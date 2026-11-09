import { test, expect, Route } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CORE_MF_STUB, responderServicioExterno } from '../support/servicios-simulados';

/**
 * Aprobación del jefe contra el CRUD Beego v2 y el MID REALES (#397): el MF registra
 * los estados en POST /contratos-generales/{id}/estados del MID, que asigna el número
 * al pasar a SUSCRITO. Se simulan core-mf, minuta, gestor documental y Parámetros.
 * persona_id va simulado: sin él el MF envía usuario_id 0, que el CRUD rechaza, así que
 * la prueba lo cambia por USUARIO_ID_PRUEBA antes de reenviar al MID.
 *
 * Ejecutar: CRUD_BEEGO_URL=http://localhost:8080/ MID_BEEGO_URL=http://localhost:8081/
 *           pnpm run test:e2e -- revision-crud-beego
 */
const CRUD_BEEGO_URL = process.env.CRUD_BEEGO_URL?.replace(/\/$/, '');
const MID_BEEGO_URL = process.env.MID_BEEGO_URL?.replace(/\/$/, '');
const CONTENEDOR_BD = process.env.CRUD_BEEGO_DB_CONTAINER ?? 'gestion_contractual_crud_390_db';
const EVIDENCIAS = process.env.EVIDENCIAS_397 ?? join(homedir(), 'argo_repos', 'evidencias-397');
const RECTORIA = 6818;
const SUSCRITO = 6774;
const USUARIO_ID_PRUEBA = 7;
// Vigencia propia de cada corrida: el consecutivo arranca en 1 sin depender de corridas anteriores.
const VIGENCIA_ID = 900_000 + (Date.now() % 100_000);

test.skip(!CRUD_BEEGO_URL || !MID_BEEGO_URL, 'Requiere CRUD_BEEGO_URL y MID_BEEGO_URL');

const b64 = (valor: unknown) => Buffer.from(JSON.stringify(valor)).toString('base64');

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

test('aprobación del jefe: el MID asigna el número al pasar a SUSCRITO', async ({ browser }) => {
  test.setTimeout(120_000);
  mkdirSync(EVIDENCIAS, { recursive: true });
  const contrato = await postJson(`${CRUD_BEEGO_URL}/v1/contratos-generales/`, {
    unidad_ejecutora_id: RECTORIA,
    vigencia_id: VIGENCIA_ID,
  });
  const id = contrato.Data.id;
  await postJson(`${CRUD_BEEGO_URL}/v1/estados-contrato/`, {
    contrato_general_id: { id },
    estado_parametro_id: 6773,
    estado_interno_parametro_id: 6800,
    usuario_id: 1,
    usuario_rol: 'ABOGADO_CONTRATACION_RECTOR',
  });

  const escrituras: string[] = [];
  const cambiosEnviados: Record<string, unknown>[] = [];
  const noSimuladas: string[] = [];
  const responder = async (route: Route) => {
    const peticion = route.request();
    const url = new URL(peticion.url());
    const ruta = url.pathname.replace('/apioas/', '');
    if (peticion.method() !== 'GET') escrituras.push(`${peticion.method()} ${ruta}`);
    if (ruta.startsWith('gestion_contractual_crud/v1/')) {
      const destino = `${CRUD_BEEGO_URL}/${ruta.replace('gestion_contractual_crud/', '')}${url.search}`;
      return route.fulfill({ response: await route.fetch({ url: destino }) });
    }
    if (/^gestion_contractual_mid\/contratos-generales\/\d+\/estados$/.test(ruta)) {
      const destino = `${MID_BEEGO_URL}/${ruta.replace('gestion_contractual_mid/', '')}`;
      const cuerpo = peticion.postDataJSON();
      cambiosEnviados.push(cuerpo);
      const postData = JSON.stringify({ ...cuerpo, usuario_id: cuerpo.usuario_id || USUARIO_ID_PRUEBA });
      return route.fulfill({ response: await route.fetch({ url: destino, postData }) });
    }
    if (/\/document\/upload$/.test(ruta)) {
      return route.fulfill({ json: { Status: '200', res: { Id: 1, Enlace: '00000000-0000-4000-8000-000000000000' } } });
    }
    if (/^minuta_contractual_mid\//.test(ruta)) return route.fulfill({ json: { Success: true, Status: 200, Data: 'JVBERi0xLjQK' } });
    if (/^gestor_documental_mid\//.test(ruta)) return route.fulfill({ json: { file: 'JVBERi0xLjQK' } });
    const externa = responderServicioExterno(route, ruta, url.searchParams);
    if (externa) return externa;
    noSimuladas.push(`${peticion.method()} ${url.pathname}`);
    return route.fulfill({ json: { Success: true, Status: 200, Data: [] } });
  };

  const context = await browser.newContext({ bypassCSP: true, viewport: { width: 1280, height: 800 } });
  await context.route(/pruebascoreclientes.portaloas.udistrital.edu.co/, (route) =>
    route.fulfill({ contentType: 'application/javascript', body: CORE_MF_STUB })
  );
  await context.route(/autenticacion\.portaloas\.udistrital\.edu\.co\/apioas\//, responder);
  await context.addInitScript(
    ([menu, user]) => {
      localStorage.setItem('menu', menu);
      localStorage.setItem('user', user);
    },
    [
      b64([{ Url: `/gestion-contractual/contratos/documentos/${id}` }]),
      b64({ user: { role: ['JEFE_CONTRATACION_RECTOR'] }, userService: { role: [] } }),
    ] as const
  );
  const page = await context.newPage();
  await page.goto(`/gestion-contractual/contratos/documentos/${id}`);

  const aprobar = page.getByRole('button', { name: /Aprobar y Enviar a Ordenador/ });
  await expect(aprobar).toBeVisible({ timeout: 60_000 });
  await aprobar.click();
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({ name: 'minuta.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 prueba') });
  await page.getByRole('dialog').getByRole('button').last().click();

  await expect(page.locator('.swal2-popup')).toContainText('Número de contrato: 1', { timeout: 30_000 });
  await page.screenshot({ path: join(EVIDENCIAS, '20-revision-numero-desde-mid.png') });

  expect(sql(`select numero_contrato || '|' || vigencia_id from contratacion.contrato_general where id = ${id}`)).toBe(
    `1|${VIGENCIA_ID}`
  );
  expect(sql(`select estado_parametro_id from contratacion.estado_contrato where contrato_general_id = ${id} and actual`)).toBe(
    String(SUSCRITO)
  );
  // El MF no calcula ni escribe el número: solo registra estados en el MID.
  expect(escrituras.filter((e) => /numero-contrato|v1\/contratos-generales\/\d+$/.test(e))).toEqual([]);
  expect(escrituras.filter((e) => e.endsWith('/estados'))).toHaveLength(2);
  for (const cambio of cambiosEnviados) {
    expect(cambio).not.toHaveProperty('numero_contrato');
    expect(cambio).not.toHaveProperty('contrato_general_id');
  }
  expect(cambiosEnviados.map((c) => c['estado_parametro_id'])).toEqual([6773, SUSCRITO]);
  await context.close();
});
