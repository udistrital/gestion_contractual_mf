import { test, expect, BrowserContext, Locator, Page, Route } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CORE_MF_STUB, PROVEEDOR, responderServicioExterno } from '../support/servicios-simulados';

/**
 * Integración local de #390 contra el CRUD Go/Beego v2 REAL de la #385.
 *
 * Las peticiones del MF a gestion_contractual_crud se reenvían al CRUD que corre en
 * CRUD_BEEGO_URL (por ejemplo http://localhost:8080/, levantado con el
 * docker-compose de la rama de la #385). Así no hace falta cambiar el environment
 * del MF ni depender de CORS. Solo se simulan el core-mf, gestion_contractual_mid
 * (consecutivo, parámetros, espacios físicos) y los demás servicios externos.
 *
 * Crea un contrato, guarda los pasos 1 y 2 (contratista, solicitante y tipo de
 * control incluidos), CDP, ordenador, supervisores y especificaciones, abre el
 * detalle y verifica en la base de datos que queda un solo ordenador activo y que
 * contratista y solicitante quedaron en contrato_general.
 *
 * Ejecutar: CRUD_BEEGO_URL=http://localhost:8080/ pnpm run test:e2e -- registro-crud-beego
 */
const CRUD_BEEGO_URL = process.env.CRUD_BEEGO_URL;
const CONTENEDOR_BD = process.env.CRUD_BEEGO_DB_CONTAINER ?? 'gestion_contractual_crud_390_db';
const EVIDENCIAS = process.env.EVIDENCIAS_390_BEEGO ?? join(homedir(), 'argo_repos', 'evidencias-390-beego');

test.skip(!CRUD_BEEGO_URL, 'Requiere CRUD_BEEGO_URL con el CRUD Beego v2 corriendo en local');

const usuario = Buffer.from(
  JSON.stringify({ user: { role: ['ABOGADO_CONTRATACION_RECTOR'] }, userService: { role: [] } })
).toString('base64');
const menu = (urls: string[]) => Buffer.from(JSON.stringify(urls.map((Url) => ({ Url })))).toString('base64');

const peticionesAlCrud: string[] = [];
const noSimuladas: string[] = [];
let contratoId = 0;

async function responder(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const ruta = url.pathname.replace('/apioas/', '');
  if (ruta.startsWith('gestion_contractual_crud/v1/')) {
    const destino = `${CRUD_BEEGO_URL!.replace(/\/$/, '')}/${ruta.replace('gestion_contractual_crud/', '')}${url.search}`;
    peticionesAlCrud.push(`${route.request().method()} ${destino}`);
    const respuesta = await route.fetch({ url: destino });
    if (route.request().method() === 'POST' && ruta === 'gestion_contractual_crud/v1/contrato_general/') {
      contratoId = (await respuesta.json()).Data.Id;
    }
    return route.fulfill({ response: respuesta });
  }
  const externa = responderServicioExterno(route, ruta, url.searchParams);
  if (externa) return externa;
  noSimuladas.push(`${route.request().method()} ${url.pathname}${url.search}`);
  return route.fulfill({ status: 404, json: { Success: false, Status: 404, Message: 'Ruta no simulada', Data: null } });
}

/** Consulta la base del CRUD Beego (contenedor del docker-compose de la #385). */
function sql(consulta: string): string {
  return execFileSync('docker', ['exec', CONTENEDOR_BD, 'psql', '-U', 'postgres', '-d', 'administrativa', '-tAc', consulta], {
    encoding: 'utf-8',
  }).trim();
}

async function aceptarAlerta(page: Page) {
  const confirmar = page.locator('.swal2-confirm');
  await confirmar.waitFor({ state: 'visible', timeout: 15_000 });
  const texto = (await page.locator('.swal2-popup').textContent()) ?? '';
  await confirmar.click();
  await expect(page.locator('.swal2-popup')).toHaveCount(0);
  return texto;
}

async function seleccionar(page: Page, select: Locator, opcion: string | RegExp) {
  // `force`: sin la fuente de iconos del core-mf las ligaduras tapan el select.
  await select.click({ force: true, timeout: 10_000 });
  await page.getByRole('option', { name: opcion }).first().click({ timeout: 10_000 });
  await expect(page.locator('.cdk-overlay-backdrop-showing')).toHaveCount(0);
}

const buscable = (seccion: Locator, label: string) =>
  seccion.locator('app-searchable-select', { hasText: label }).locator('mat-select');

async function capturar(page: Page, archivo: string) {
  await page.screenshot({ path: join(EVIDENCIAS, `${archivo}.png`), fullPage: true });
}

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  mkdirSync(EVIDENCIAS, { recursive: true });
  context = await browser.newContext({ bypassCSP: true, viewport: { width: 1440, height: 900 } });
  await context.route(/pruebascoreclientes.portaloas.udistrital.edu.co/, (route) =>
    route.fulfill({ contentType: 'application/javascript', body: CORE_MF_STUB })
  );
  await context.route(/autenticacion\.portaloas\.udistrital\.edu\.co\/apioas\//, responder);
  await context.addInitScript(
    ([menuInicial, user, proveedor]) => {
      // Se conserva el menú si la prueba lo amplió (el guard compara la URL exacta).
      if (!localStorage.getItem('menu')) localStorage.setItem('menu', menuInicial);
      localStorage.setItem('user', user);
      // Entrada real al registro: desde la consulta, con el contratista ya validado
      // (así lo deja la modal "Validar contratista" en el estado de navegación).
      if (location.pathname === '/contratos/registrar') {
        history.replaceState({ ...(history.state ?? {}), contratistaPrevalidado: proveedor, bloquearContratista: false }, '');
      }
    },
    [menu(['/contratos/registrar']), usuario, PROVEEDOR] as const
  );
  page = await context.newPage();
});

test.afterAll(async () => {
  await context.close();
});

test('registro y edición contra el CRUD Beego v2 real y detalle del contrato', async () => {
  test.setTimeout(300_000);

  await test.step('paso 1: datos básicos (crea el contrato en contrato_general)', async () => {
    await page.goto('/contratos/registrar');
    const seccion = page.locator('app-paso-info-general');
    await expect(seccion).toBeVisible();
    await seleccionar(page, buscable(seccion, 'Tipo de Compromiso'), 'Orden');
    await seleccionar(page, buscable(seccion, 'Tipo de Contrato'), 'Orden de Compra');
    await seleccionar(page, seccion.locator('mat-select[formcontrolname="aplicaPoliza"]'), 'No');
    await seleccionar(page, buscable(seccion, 'Modalidad de Selección'), 'Contratación Directa');
    await seleccionar(page, buscable(seccion, 'Régimen de Contratación'), 'Régimen Especial - Acuerdo 03 de 2015');
    await seleccionar(page, buscable(seccion, 'Tipología Específica'), 'Compraventa de bienes muebles');
    await seleccionar(page, buscable(seccion, 'Procedimiento'), 'PRO-OC-01 Orden de compra');
    await seccion.locator('input[formcontrolname="plazoEjecucion"]').fill('6');
    await seleccionar(page, seccion.locator('mat-select[formcontrolname="unidadEjecucionId"]'), 'MESES');
    await seccion.getByRole('button', { name: /Guardar Datos Básicos/ }).click();
    await aceptarAlerta(page);
    await expect.poll(() => contratoId, { message: 'id del contrato creado en el CRUD' }).toBeGreaterThan(0);
  });

  await test.step('paso 1: CDP, valores y ordenador (se guarda dos veces para comprobar que no duplica)', async () => {
    const seccion = page.locator('app-paso-info-presupuestal');
    await seleccionar(page, seccion.locator('mat-select[formcontrolname="vigencia"]'), '2024');
    // Con un solo CDP disponible, el select buscable lo toma solo y lo agrega a la tabla.
    await expect(seccion.locator('table')).toContainText('1234');
    await seccion.getByRole('button', { name: /Asociar CDP/ }).click();
    await aceptarAlerta(page);

    await seccion.locator('select[formcontrolname="tipoMoneda"]').selectOption({ label: 'Peso colombiano' });
    await seccion.locator('input[formcontrolname="valorContrato"]').fill('45000000');
    await seccion.locator('select[formcontrolname="ordenadorGasto"]').selectOption({ label: 'RECTOR' });
    await expect(seccion.locator('input[formcontrolname="nombreOrdenador"]')).toHaveValue(/GIOVANNI/);
    await seccion.locator('select[formcontrolname="origenRecurso"]').selectOption({ label: 'Recursos propios' });
    await seccion.locator('select[formcontrolname="origenPresupuesto"]').selectOption({ label: 'Presupuesto de la vigencia' });
    await seccion.locator('select[formcontrolname="tipoGasto"]').selectOption({ label: 'Inversión' });
    await seccion.locator('select[formcontrolname="temaGasto"]').selectOption({ label: 'Dotación de laboratorios' });
    await seccion.locator('select[formcontrolname="medioPago"]').selectOption({ label: 'Transferencia electrónica' });
    await seccion.locator('mat-checkbox[formcontrolname="clausulaRegistroPresupuestal"] input').check({ force: true });
    await seccion.locator('.ql-editor').fill('Un único pago contra entrega a satisfacción.');

    for (let vez = 0; vez < 2; vez++) {
      await page.locator('.step-pill[aria-label="General y Presupuestal"]').click();
      await seccion.getByRole('button', { name: /Guardar y Continuar/ }).click();
      await aceptarAlerta(page);
    }
    await capturar(page, '01-paso1-guardado');
  });

  await test.step('paso 2: solicitante, supervisor y tipo de control', async () => {
    await page.locator('.step-pill[aria-label="Solicitante y Supervisor"]').click();
    const seccion = page.locator('app-paso-supervisores');
    await seleccionar(page, buscable(seccion, 'Sede Universitaria Solicitante'), 'Sede Calle 40');
    await seleccionar(page, buscable(seccion, 'Dependencia Solicitante'), 'Facultad de Ingeniería');
    // El primer guardado no muestra alerta y, por OnPush, la vista no refleja
    // "Solicitante guardado" hasta otro ciclo (así viene de develop): se espera el PUT.
    const guardado = page.waitForResponse(
      (r) => r.request().method() === 'PUT' && r.url().includes(`/v1/contrato_general/${contratoId}`)
    );
    await seccion.getByRole('button', { name: /(Guardar|Actualizar) Solicitante/ }).click();
    expect((await guardado).status()).toBe(200);

    await seleccionar(page, seccion.locator('mat-select[formcontrolname="sede"]').first(), 'Sede Calle 40');
    await seleccionar(page, seccion.locator('mat-select[formcontrolname="dependencia"]').first(), 'Facultad de Ingeniería');
    await expect(seccion).toContainText('CARLOS ANDRÉS RUIZ MORENO');
    await seleccionar(page, seccion.locator('mat-select[formcontrolname="tipoControl"]').first(), 'Técnico, administrativo y financiero');
    await seccion.getByRole('button', { name: /Guardar Supervisores/ }).click();
    await aceptarAlerta(page);
    await capturar(page, '02-paso2-supervisores');
  });

  await test.step('paso 2: contratista (se guarda en contrato_general)', async () => {
    const seccion = page.locator('app-paso-contratistas');
    await expect(seccion.locator('input[formcontrolname="documentoContratista"]')).toHaveValue('1014285890');
    await seccion.getByRole('button', { name: /Consultar Registro/ }).click();
    await expect(seccion).toContainText('INGRID PAOLA MORALES MORALES');
    await seccion.getByRole('button', { name: /Siguiente: Estructura y Necesidad/ }).click();
    await aceptarAlerta(page);
    await capturar(page, '03-paso2-contratista');
  });

  await test.step('especificaciones técnicas', async () => {
    await page.locator('.step-pill[aria-label="Especificaciones Técnicas"]').click();
    const seccion = page.locator('app-paso-especificaciones');
    await seccion.getByRole('button', { name: /Añadir Especificación/ }).click();
    const modal = page.locator('mat-dialog-container');
    await modal.locator('[formcontrolname="descripcion"]').fill('Osciloscopio digital de 4 canales 200 MHz');
    await modal.locator('[formcontrolname="cantidad"]').fill('3');
    await modal.locator('[formcontrolname="valor_unitario"]').fill('9500000');
    await modal.getByRole('button', { name: /Guardar Especificación/ }).click();
    await expect(seccion).toContainText('Osciloscopio digital de 4 canales 200 MHz');
    await capturar(page, '04-especificaciones');
  });

  await test.step('detalle del contrato con los datos guardados en el CRUD Beego', async () => {
    await page.evaluate(
      (menuDetalle) => localStorage.setItem('menu', menuDetalle),
      menu(['/contratos/registrar', `/contratos/detalle/${contratoId}`])
    );
    await page.goto(`/contratos/detalle/${contratoId}`);
    await expect(page.getByText('Detalle del Contrato').first()).toBeVisible();

    const general = page.locator('app-paso-info-general');
    await expect.soft(general.locator('app-searchable-select', { hasText: 'Tipo de Contrato' })).toContainText('Orden de Compra');
    await expect.soft(general.locator('input[formcontrolname="plazoEjecucion"]')).toHaveValue('6');
    const presupuestal = page.locator('app-paso-info-presupuestal');
    await expect.soft(presupuestal.locator('table')).toContainText('1234');
    await expect.soft(presupuestal.locator('select[formcontrolname="ordenadorGasto"] option:checked')).toHaveText('RECTOR');
    await expect.soft(presupuestal.locator('input[formcontrolname="valorContrato"]')).toHaveValue('45000000');
    await capturar(page, '05-detalle-general');

    await page.locator('.step-pill[aria-label="Solicitante y Supervisor"]').click();
    const supervisores = page.locator('app-paso-supervisores');
    await expect.soft(supervisores.locator('app-searchable-select', { hasText: 'Sede Universitaria Solicitante' })).toContainText('Sede Calle 40');
    await expect.soft(supervisores).toContainText('CARLOS ANDRÉS RUIZ MORENO');
    await expect.soft(supervisores.locator('mat-select[formcontrolname="tipoControl"]').first()).toContainText('Técnico, administrativo y financiero');
    await expect.soft(page.locator('app-paso-contratistas input[formcontrolname="documentoContratista"]')).toHaveValue('1014285890');
    await capturar(page, '06-detalle-supervisores-contratista');

    await page.locator('.step-pill[aria-label="Especificaciones Técnicas"]').click();
    await expect.soft(page.locator('app-paso-especificaciones')).toContainText('Osciloscopio digital de 4 canales 200 MHz');
    await capturar(page, '07-detalle-especificaciones');
  });

  await test.step('base de datos: un solo ordenador activo, contratista y solicitante en contrato_general', async () => {
    const contrato = sql(
      `select proveedor_numero_documento, tipo_persona_id, sede_solicitante_id, dependencia_solicitante_id, tipo_control_id ` +
        `from contratacion.contrato_general where id = ${contratoId}`
    );
    const conteos = {
      ordenadores_activos: sql(`select count(*) from contratacion.ordenador_contrato where contrato_general_id = ${contratoId} and activo`),
      cdps_activos: sql(`select count(*) from contratacion.disponibilidad_presupuestal where contrato_general_id = ${contratoId} and activo`),
      supervisores_activos: sql(`select count(*) from contratacion.supervisor_contrato where contrato_general_id = ${contratoId} and activo`),
      especificaciones_activas: sql(`select count(*) from contratacion.especificacion_tecnica where contrato_general_id = ${contratoId} and activo`),
      estado_actual: sql(`select estado_interno_parametro_id from contratacion.estado_contrato where contrato_general_id = ${contratoId} and actual`),
    };
    writeFileSync(
      join(EVIDENCIAS, '08-base-de-datos.txt'),
      `Contrato ${contratoId}\ncontrato_general (proveedor_numero_documento|tipo_persona_id|sede_solicitante_id|dependencia_solicitante_id|tipo_control_id):\n${contrato}\n\n` +
        Object.entries(conteos).map(([k, v]) => `${k}: ${v}`).join('\n') +
        `\n\nPeticiones al CRUD Beego (${peticionesAlCrud.length}):\n${peticionesAlCrud.join('\n')}\n`
    );
    expect.soft(contrato).toBe('1014285890|1|10|20|6611');
    expect.soft(conteos.ordenadores_activos).toBe('1');
    expect.soft(conteos.cdps_activos).toBe('1');
    expect.soft(conteos.supervisores_activos).toBe('1');
    expect.soft(conteos.especificaciones_activas).toBe('1');
    expect.soft(noSimuladas, 'peticiones sin simular').toEqual([]);
  });
});
