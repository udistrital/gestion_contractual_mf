import { test, expect, BrowserContext, Page, Route } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CORE_MF_STUB, VIGENCIA_ACTUAL_ID, responderServicioExterno } from '../support/servicios-simulados';

/**
 * Pantallas de pólizas y actas contra el CRUD Beego v2 y el MID REALES (#397).
 *
 * Las peticiones a gestion_contractual_crud van a CRUD_BEEGO_URL y las de pólizas y
 * amparos del MID a MID_BEEGO_URL (MID de mid#28 apuntando a ese mismo CRUD). Se simulan
 * core-mf, Parámetros, minuta_contractual_mid y el gestor documental.
 *
 * Ejecutar: CRUD_BEEGO_URL=http://localhost:8080/ MID_BEEGO_URL=http://localhost:8081/
 *           pnpm run test:e2e -- polizas-actas-crud-beego
 */
const CRUD_BEEGO_URL = process.env.CRUD_BEEGO_URL?.replace(/\/$/, '');
const MID_BEEGO_URL = process.env.MID_BEEGO_URL?.replace(/\/$/, '');
const CONTENEDOR_BD = process.env.CRUD_BEEGO_DB_CONTAINER ?? 'gestion_contractual_crud_390_db';
const EVIDENCIAS = process.env.EVIDENCIAS_397 ?? join(homedir(), 'argo_repos', 'evidencias-397');
const VIGENCIA = String(new Date().getFullYear());
const DESCRIPCION_AMPARO = 'Amparo de cumplimiento de prueba';
const NUMERO_POLIZA = 'POL-PRUEBA-397';
const ACTA_PDF = 'JVBERi0xLjQK';
const ENLACE_ACTA = '00000000-0000-4000-8000-000000000000';

test.skip(!CRUD_BEEGO_URL || !MID_BEEGO_URL, 'Requiere CRUD_BEEGO_URL y MID_BEEGO_URL');
test.describe.configure({ mode: 'serial' });

const usuario = Buffer.from(
  JSON.stringify({ user: { role: ['ABOGADO_CONTRATACION_RECTOR'] }, userService: { role: [] } })
).toString('base64');
const menu = Buffer.from(
  JSON.stringify(
    ['/gestion-contractual/polizas/registrar', '/gestion-contractual/polizas/consultar', '/gestion-contractual/actas/registrar'].map(
      (Url) => ({ Url })
    )
  )
).toString('base64');

const noSimuladas: string[] = [];
let context: BrowserContext;
let page: Page;
let contratoId = 0;

async function reenviar(route: Route, destino: string) {
  return route.fulfill({ response: await route.fetch({ url: destino }) });
}

async function responder(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const ruta = url.pathname.replace('/apioas/', '');
  if (ruta.startsWith('gestion_contractual_crud/v1/')) {
    return reenviar(route, `${CRUD_BEEGO_URL}/${ruta.replace('gestion_contractual_crud/', '')}${url.search}`);
  }
  if (/^gestion_contractual_mid\/(polizas|amparos-polizas|amparos-contratos)/.test(ruta)) {
    return reenviar(route, `${MID_BEEGO_URL}/${ruta.replace('gestion_contractual_mid/', '')}${url.search}`);
  }
  if (/\/acta-poliza\/contratos\/\d+$/.test(ruta)) {
    return route.fulfill({ json: { Success: true, Status: 200, Data: ACTA_PDF } });
  }
  if (/\/document\/upload$/.test(ruta)) {
    return route.fulfill({ json: { Status: '200', res: { Id: 1, Enlace: ENLACE_ACTA } } });
  }
  if (ruta.endsWith(`/document/${ENLACE_ACTA}`)) return route.fulfill({ json: { file: ACTA_PDF } });
  const externa = responderServicioExterno(route, ruta, url.searchParams);
  if (externa) return externa;
  noSimuladas.push(`${route.request().method()} ${url.pathname}${url.search}`);
  return route.fulfill({ status: 404, json: { Success: false, Status: 404, Message: 'Ruta no simulada', Data: null } });
}

function sql(consulta: string): string {
  return execFileSync('docker', ['exec', CONTENEDOR_BD, 'psql', '-U', 'postgres', '-d', 'administrativa', '-tAc', consulta], {
    encoding: 'utf-8',
  }).trim();
}

async function postJson(url: string, cuerpo: unknown) {
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  return respuesta.json();
}

async function seleccionar(formControlName: string, opcion: string | RegExp) {
  const select = page.locator(`mat-select[formcontrolname="${formControlName}"]`);
  const elegida = page.getByRole('option', { name: opcion }).first();
  await expect(select).not.toHaveAttribute('aria-disabled', 'true');
  // Un select sin opciones no abre: se reintenta mientras llegan.
  await expect(async () => {
    // `force`: sin la fuente de iconos del core-mf las ligaduras tapan el select.
    await select.click({ force: true });
    await expect(elegida).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await elegida.click();
  await expect(page.locator('.cdk-overlay-backdrop-showing')).toHaveCount(0);
}

async function capturar(archivo: string) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(EVIDENCIAS, `${archivo}.png`), fullPage: true });
}

test.beforeAll(async ({ browser }) => {
  mkdirSync(EVIDENCIAS, { recursive: true });
  const contrato = await postJson(`${CRUD_BEEGO_URL}/v1/contratos-generales/`, {
    unidad_ejecutora_id: 6818,
    vigencia_id: VIGENCIA_ACTUAL_ID,
  });
  contratoId = contrato.Data.id;
  await postJson(`${MID_BEEGO_URL}/amparos-polizas`, [
    {
      contrato_general_id: contratoId,
      amparo_id: 6602,
      suficiencia: 10,
      tipo_valor_amparo_id: 2,
      descripcion: DESCRIPCION_AMPARO,
    },
  ]);

  context = await browser.newContext({ bypassCSP: true, viewport: { width: 1440, height: 900 } });
  await context.route(/pruebascoreclientes.portaloas.udistrital.edu.co/, (route) =>
    route.fulfill({ contentType: 'application/javascript', body: CORE_MF_STUB })
  );
  await context.route(/autenticacion\.portaloas\.udistrital\.edu\.co\/apioas\//, responder);
  await context.route(/\/v1\/parametro(\?|$)/, responder);
  await context.addInitScript(
    ([menuPermitido, user]) => {
      localStorage.setItem('menu', menuPermitido);
      localStorage.setItem('user', user);
    },
    [menu, usuario] as const
  );
  page = await context.newPage();
});

test.afterAll(async () => {
  await context?.close();
});

test('registrar póliza: la vigencia lista los contratos y el acta queda en la póliza', async () => {
  test.setTimeout(120_000);
  await page.goto('/gestion-contractual/polizas/registrar');
  await expect(page.getByText('Asociar Contratos')).toBeVisible();
  await seleccionar('vigencia', VIGENCIA);
  await seleccionar('consecutivo', String(contratoId));
  await capturar('10-poliza-contrato-por-vigencia');

  await page.locator('input[formcontrolname="numero_poliza"]').fill(NUMERO_POLIZA);
  await page.locator('input[formcontrolname="fecha_inicio"]').fill('01/15/2026');
  await page.locator('input[formcontrolname="fecha_fin"]').fill('12/15/2026');
  await page.locator('input[formcontrolname="fecha_expedicion"]').fill('01/10/2026');
  await page.locator('input[formcontrolname="fecha_aprobacion"]').fill('01/12/2026');
  await seleccionar('entidad_aseguradora_id', /Seguros del Estado/);
  await page.locator('textarea[formcontrolname="descripcion"]').fill('Póliza de prueba');
  await page.getByRole('button', { name: /Guardar póliza/ }).click();
  await expect(page.locator('.swal2-popup')).toContainText('Póliza guardada exitosamente');
  await page.locator('.swal2-confirm').click();

  await seleccionar('amparoSeleccionado', DESCRIPCION_AMPARO);
  await page.getByRole('button', { name: /Agregar Amparo/ }).click();
  const fila = page.locator('table.amparos-table tr.mat-mdc-row');
  await expect(fila).toHaveCount(1);
  await fila.locator('input[placeholder="Ingrese el valor"]').fill('17000000');
  await fila.locator('input[placeholder="DD/MM/YYYY"]').nth(0).fill('01/15/2026');
  await fila.locator('input[placeholder="DD/MM/YYYY"]').nth(1).fill('12/15/2026');
  await page.getByRole('button', { name: /Registrar$/ }).click();
  await page.locator('.swal2-confirm').click();
  await expect(
    page.locator('.mat-mdc-snack-bar-container').filter({ hasText: 'Póliza registrada y acta de aprobación guardada' })
  ).toBeVisible();
  await capturar('11-poliza-acta-registrada');

  const polizaId = sql(`select id from contratacion.poliza where contrato_general_id = ${contratoId}`);
  expect(sql(`select entidad_tipo, entidad_id, documento_enlace from contratacion.documento_contrato where activo`)).toBe(
    `poliza|${polizaId}|${ENLACE_ACTA}`
  );
});

test('consultar pólizas: el contrato sale por vigencia y el modal abre el acta de la póliza', async () => {
  test.setTimeout(90_000);
  await page.goto('/gestion-contractual/polizas/consultar');
  const fila = page.getByRole('row').filter({ has: page.getByRole('cell', { name: String(contratoId), exact: true }) });
  await expect(fila).toBeVisible({ timeout: 30_000 });
  await expect(fila).toContainText('Sí');
  await capturar('12-poliza-listado-por-vigencia');

  await fila.getByRole('button', { name: /Ver Detalles/ }).click();
  const modal = page.locator('mat-dialog-container');
  await expect(modal).toContainText(NUMERO_POLIZA);
  const consulta = page.waitForResponse((r) => r.url().includes('/v1/documentos-contratos/?'));
  const ventana = context.waitForEvent('page');
  await modal.getByRole('button', { name: /Ver acta de aprobación/ }).click();
  const respuesta = await consulta;
  expect(new URL(respuesta.url()).search).toContain('entidad_tipo:poliza');
  expect((await respuesta.json()).Data[0].documento_enlace).toBe(ENLACE_ACTA);
  await (await ventana).close();
  await capturar('13-poliza-detalle');
  await page.keyboard.press('Escape');
});

test('registro de actas: la vigencia lista los contratos desde el CRUD', async () => {
  await page.goto('/gestion-contractual/actas/registrar');
  await seleccionar('vigencia', VIGENCIA);
  await page.locator('mat-select[formcontrolname="consecutivoContrato"]').click({ force: true });
  await expect(page.getByRole('option', { name: String(contratoId), exact: true })).toBeVisible();
  await capturar('14-acta-contrato-por-vigencia');
  await page.keyboard.press('Escape');
  expect(noSimuladas, 'peticiones sin simular').toEqual([]);
});
