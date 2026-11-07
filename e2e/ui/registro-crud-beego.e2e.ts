import { test, expect, BrowserContext, Locator, Page, Request, Route } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CORE_MF_STUB, PROVEEDOR, VIGENCIA_ACTUAL_ID, responderServicioExterno } from '../support/servicios-simulados';

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
 * detalle y verifica en la base de datos que queda un solo ordenador activo, que
 * contratista y solicitante quedaron en contrato_general y que lo que no tiene valor
 * queda en NULL. Al editar comprueba que no se borra lo que el formulario no maneja
 * y que el paso 1 actualiza el mismo contrato en vez de crear otro.
 * El navegador corre a las 20:30 de Colombia (en UTC ya es el día siguiente) para
 * comprobar el día de las columnas date; la base se prueba en America/Bogota.
 *
 * Ejecutar: CRUD_BEEGO_URL=http://localhost:8080/ pnpm run test:e2e -- registro-crud-beego
 */
const CRUD_BEEGO_URL = process.env.CRUD_BEEGO_URL;
const CONTENEDOR_BD = process.env.CRUD_BEEGO_DB_CONTAINER ?? 'gestion_contractual_crud_390_db';
const EVIDENCIAS = process.env.EVIDENCIAS_390_BEEGO ?? join(homedir(), 'argo_repos', 'evidencias-390-beego');

/*
 * Probada contra la rama feature/385-crud-beego-v2 del crud#51 (snake_case, [] en
 * listas vacías, POST/PUT con el registro y su id, y null en lo que no tiene valor).
 * El MF maneja Status como texto, las FK como objeto { id } y las fechas con aFechaCrud.
 */
test.skip(!CRUD_BEEGO_URL, 'Requiere CRUD_BEEGO_URL con el CRUD Beego v2 corriendo en local');

const usuario = Buffer.from(
  JSON.stringify({ user: { role: ['ABOGADO_CONTRATACION_RECTOR'] }, userService: { role: [] } })
).toString('base64');
const menu = (urls: string[]) => Buffer.from(JSON.stringify(urls.map((Url) => ({ Url })))).toString('base64');

const hoyColombia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const AHORA = new Date(`${hoyColombia}T20:30:00-05:00`);

const peticionesAlCrud: string[] = [];
const cuerposConsecutivo: unknown[] = [];
const noSimuladas: string[] = [];
let contratoId = 0;

async function responder(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const ruta = url.pathname.replace('/apioas/', '');
  if (ruta.startsWith('gestion_contractual_crud/v1/')) {
    const destino = `${CRUD_BEEGO_URL!.replace(/\/$/, '')}/${ruta.replace('gestion_contractual_crud/', '')}${url.search}`;
    peticionesAlCrud.push(`${route.request().method()} ${destino}`);
    const respuesta = await route.fetch({ url: destino });
    if (route.request().method() === 'POST' && ruta === 'gestion_contractual_crud/v1/contratos-generales/') {
      contratoId = (await respuesta.json()).Data.id;
    }
    return route.fulfill({ response: respuesta });
  }
  if (ruta === 'gestion_contractual_mid/contratos-generales/consecutivo') cuerposConsecutivo.push(route.request().postDataJSON());
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

/** Fila de la tabla con cada columna separada por | y NULL donde no hay valor. */
function columnas(tabla: string, condicion: string, nombres: string[]): string {
  const valores = nombres.map((c) => `coalesce(${c}::text, 'NULL')`).join(', ');
  return sql(`select concat_ws('|', ${valores}) from contratacion.${tabla} where ${condicion}`);
}

const nulos = (nombres: string[]) => nombres.map(() => 'NULL').join('|');

async function aceptarAlerta(page: Page) {
  const confirmar = page.locator('.swal2-confirm');
  await confirmar.waitFor({ state: 'visible', timeout: 15_000 });
  const texto = (await page.locator('.swal2-popup').textContent()) ?? '';
  await confirmar.click();
  await expect(page.locator('.swal2-popup')).toHaveCount(0);
  return texto;
}

async function seleccionar(page: Page, select: Locator, opcion: string | RegExp) {
  const elegida = page.getByRole('option', { name: opcion }).first();
  const fondo = page.locator('.cdk-overlay-backdrop-showing');
  await expect(select).toBeVisible();
  await expect(select).not.toHaveAttribute('aria-disabled', 'true');
  // `force`: sin la fuente de iconos del core-mf las ligaduras tapan el select.
  await select.click({ force: true, timeout: 10_000 });
  const aparecio = await elegida.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true, () => false);
  if (!aparecio) {
    // El panel no abrió o llegó sin opciones: se cierra y se abre una vez más.
    await page.keyboard.press('Escape');
    await expect(fondo).toHaveCount(0);
    await select.click({ force: true, timeout: 10_000 });
  }
  await elegida.click({ timeout: 10_000 });
  await expect(fondo).toHaveCount(0);
}

const buscable = (seccion: Locator, label: string) =>
  seccion.locator('app-searchable-select', { hasText: label }).locator('mat-select');

async function capturar(page: Page, archivo: string) {
  // Deja terminar la animación del paso y el cierre de los modales antes de la captura.
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(EVIDENCIAS, `${archivo}.png`), fullPage: true });
}

async function abrirEdicion(page: Page, id: number) {
  await page.evaluate(
    (menuEdicion) => localStorage.setItem('menu', menuEdicion),
    menu(['/gestion-contractual/contratos/registrar', `/gestion-contractual/contratos/detalle/${id}`, `/gestion-contractual/contratos/editar/${id}`])
  );
  await page.goto(`/gestion-contractual/contratos/editar/${id}`);
}

/** Guarda el paso 1 de un contrato existente y exige el PUT sobre ese mismo contrato. */
async function guardarPaso1(page: Page, id: number) {
  const seccion = page.locator('app-paso-info-general');
  const guardado = page.waitForResponse(
    (r) => r.request().method() === 'PUT' && r.url().endsWith(`/v1/contratos-generales/${id}`)
  );
  await seccion.getByRole('button', { name: /Guardar Datos Básicos/ }).click();
  expect((await guardado).status()).toBe(200);
  await aceptarAlerta(page);
}

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  mkdirSync(EVIDENCIAS, { recursive: true });
  context = await browser.newContext({
    bypassCSP: true,
    viewport: { width: 1440, height: 900 },
    timezoneId: 'America/Bogota',
  });
  await context.clock.setFixedTime(AHORA);
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
      if (location.pathname === '/gestion-contractual/contratos/registrar') {
        history.replaceState({ ...(history.state ?? {}), contratistaPrevalidado: proveedor, bloquearContratista: false }, '');
      }
    },
    [menu(['/gestion-contractual/contratos/registrar']), usuario, PROVEEDOR] as const
  );
  page = await context.newPage();
});

test.afterAll(async () => {
  await context.close();
});

test('registro y edición contra el CRUD Beego v2 real y detalle del contrato', async () => {
  test.setTimeout(300_000);

  await test.step('paso 1: datos básicos (crea el contrato en contrato_general)', async () => {
    await page.goto('/gestion-contractual/contratos/registrar');
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

    await seleccionar(page, buscable(seccion, 'Tipo de Moneda'), 'Peso colombiano');
    await seccion.locator('input[formcontrolname="valorContrato"]').fill('45000000');
    await seleccionar(page, buscable(seccion, 'Cargo Ordenador del Gasto'), /^RECTOR$/);
    await expect(seccion.locator('input[formcontrolname="nombreOrdenador"]')).toHaveValue(/ORDENADOR DE PRUEBA/);
    await seleccionar(page, buscable(seccion, 'Origen de Recursos'), 'Recursos propios');
    await seleccionar(page, buscable(seccion, 'Origen Presupuesto'), 'Presupuesto de la vigencia');
    await seleccionar(page, buscable(seccion, 'Tipo de Gasto'), 'Inversión');
    await seleccionar(page, buscable(seccion, 'Tema Gasto Inversión'), 'Dotación de laboratorios');
    await seleccionar(page, buscable(seccion, 'Medio de Pago'), 'Transferencia electrónica');
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
      (r) => r.request().method() === 'PUT' && r.url().includes(`/v1/contratos-generales/${contratoId}`)
    );
    await seccion.getByRole('button', { name: /(Guardar|Actualizar) Solicitante/ }).click();
    expect((await guardado).status()).toBe(200);

    await seleccionar(page, seccion.locator('mat-select[formcontrolname="sede"]').first(), 'Sede Calle 40');
    await seleccionar(page, seccion.locator('mat-select[formcontrolname="dependencia"]').first(), 'Facultad de Ingeniería');
    await expect(seccion).toContainText('SUPERVISOR DE PRUEBA');
    await seleccionar(page, seccion.locator('mat-select[formcontrolname="tipoControl"]').first(), 'Técnico, administrativo y financiero');
    await seccion.getByRole('button', { name: /Guardar Supervisores/ }).click();
    await aceptarAlerta(page);
    await capturar(page, '02-paso2-supervisores');
  });

  await test.step('paso 2: contratista (se guarda en contrato_general)', async () => {
    const seccion = page.locator('app-paso-contratistas');
    await expect(seccion.locator('input[formcontrolname="documentoContratista"]')).toHaveValue('1000000001');
    await seccion.getByRole('button', { name: /Consultar Registro/ }).click();
    await expect(seccion).toContainText('CONTRATISTA DE PRUEBA');
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
      menu(['/gestion-contractual/contratos/registrar', `/gestion-contractual/contratos/detalle/${contratoId}`])
    );
    await page.goto(`/gestion-contractual/contratos/detalle/${contratoId}`);
    await expect(page.getByText('Detalle del Contrato').first()).toBeVisible();

    const general = page.locator('app-paso-info-general');
    await expect.soft(general.locator('app-searchable-select', { hasText: 'Tipo de Contrato' })).toContainText('Orden de Compra');
    await expect.soft(general.locator('input[formcontrolname="plazoEjecucion"]')).toHaveValue('6');
    const presupuestal = page.locator('app-paso-info-presupuestal');
    await expect.soft(presupuestal.locator('table')).toContainText('1234');
    await expect.soft(buscable(presupuestal, 'Cargo Ordenador del Gasto')).toHaveText(/RECTOR/);
    await expect.soft(presupuestal.locator('input[formcontrolname="valorContrato"]')).toHaveValue('45000000');
    await capturar(page, '05-detalle-general');

    await page.locator('.step-pill[aria-label="Solicitante y Supervisor"]').click();
    const supervisores = page.locator('app-paso-supervisores');
    await expect.soft(supervisores.locator('app-searchable-select', { hasText: 'Sede Universitaria Solicitante' })).toContainText('Sede Calle 40');
    await expect.soft(supervisores).toContainText('SUPERVISOR DE PRUEBA');
    await expect.soft(supervisores.locator('mat-select[formcontrolname="tipoControl"]').first()).toContainText('Técnico, administrativo y financiero');
    await expect.soft(page.locator('app-paso-contratistas input[formcontrolname="documentoContratista"]')).toHaveValue('1000000001');
    await capturar(page, '06-detalle-supervisores-contratista');

    await page.locator('.step-pill[aria-label="Especificaciones Técnicas"]').click();
    await expect.soft(page.locator('app-paso-especificaciones')).toContainText('Osciloscopio digital de 4 canales 200 MHz');
    await capturar(page, '07-detalle-especificaciones');
  });

  const camposSinValorContrato = [
    'perfil_contratista_id', 'fecha_suscripcion_estudio', 'valor_contrato_me', 'valor_tasa_cambio',
    'clase_proveedor_id', 'condiciones', 'observaciones', 'fecha_inicial', 'fecha_final', 'fecha_suscripcion',
  ];
  const camposSinValorOrdenador = ['tercero_id', 'cargo_id', 'ordenador_sicapital_id', 'documento_identidad', 'resolucion'];
  const delContrato = `contrato_general_id = ${contratoId}`;
  let sinValorOrdenador = '';
  let cargoSupervisorInicial = '';

  await test.step('edición: guardar de nuevo no borra lo que el formulario no maneja', async () => {
    sinValorOrdenador = columnas('ordenador_contrato', delContrato, camposSinValorOrdenador);
    cargoSupervisorInicial = columnas('supervisor_contrato', delContrato, ['cargo_id']);
    // El formulario no maneja estos campos: se simulan guardados por otra vía.
    sql(`update contratacion.supervisor_contrato set cargo_id = 45 where ${delContrato}`);
    sql(`update contratacion.ordenador_contrato set cargo_id = 12, ordenador_sicapital_id = 1001, documento_identidad = '1000000003' where ${delContrato}`);

    await abrirEdicion(page, contratoId);
    const presupuestal = page.locator('app-paso-info-presupuestal');
    await expect(presupuestal.locator('input[formcontrolname="valorContrato"]')).toHaveValue('45000000');
    await expect(presupuestal.locator('input[formcontrolname="nombreOrdenador"]')).toHaveValue(/ORDENADOR DE PRUEBA/);
    const ordenador = page.waitForRequest((r) => r.method() === 'PUT' && r.url().includes('/v1/ordenadores/'));
    await presupuestal.getByRole('button', { name: /Guardar y Continuar/ }).click();
    expect.soft(Object.keys((await ordenador).postDataJSON())).toEqual(['ordenador_argo_id', 'contrato_general_id']);
    await aceptarAlerta(page);

    await page.locator('.step-pill[aria-label="Solicitante y Supervisor"]').click();
    const supervisores = page.locator('app-paso-supervisores');
    await expect(supervisores).toContainText('SUPERVISOR DE PRUEBA');
    const supervisor = page.waitForRequest((r) => r.method() === 'PUT' && r.url().includes('/v1/supervisores/'));
    await supervisores.getByRole('button', { name: /(Guardar|Actualizar) Supervisores/ }).click();
    expect.soft((await supervisor).postDataJSON()).not.toHaveProperty('cargo_id');
    await aceptarAlerta(page);
  });

  await test.step('base de datos: un solo ordenador activo, contratista y solicitante en contrato_general', async () => {
    const contrato = sql(
      `select proveedor_numero_documento, tipo_persona_id, sede_solicitante_id, dependencia_solicitante_id, tipo_control_id ` +
        `from contratacion.contrato_general where id = ${contratoId}`
    );
    const sinValor = columnas('contrato_general', `id = ${contratoId}`, camposSinValorContrato);
    const cargoSupervisor = columnas('supervisor_contrato', delContrato, ['cargo_id']);
    const ordenadorEditado = columnas('ordenador_contrato', delContrato, ['cargo_id', 'ordenador_sicapital_id', 'documento_identidad']);
    const conteos = {
      ordenadores_activos: sql(`select count(*) from contratacion.ordenador_contrato where contrato_general_id = ${contratoId} and activo`),
      cdps_activos: sql(`select count(*) from contratacion.disponibilidad_presupuestal where contrato_general_id = ${contratoId} and activo`),
      supervisores_activos: sql(`select count(*) from contratacion.supervisor_contrato where contrato_general_id = ${contratoId} and activo`),
      especificaciones_activas: sql(`select count(*) from contratacion.especificacion_tecnica where contrato_general_id = ${contratoId} and activo`),
      vigencia_id: sql(`select vigencia_id from contratacion.contrato_general where id = ${contratoId}`),
      estado_actual: sql(`select estado_interno_parametro_id from contratacion.estado_contrato where contrato_general_id = ${contratoId} and actual`),
      fecha_registro_cdp: sql(`select fecha_registro from contratacion.disponibilidad_presupuestal where contrato_general_id = ${contratoId} and activo`),
    };
    writeFileSync(
      join(EVIDENCIAS, '08-base-de-datos.txt'),
      `Zona horaria de la base: ${sql('show timezone')}\nHora del navegador: ${AHORA.toISOString()} (20:30 en Colombia)\n\n` +
        `Contrato ${contratoId}\ncontrato_general (proveedor_numero_documento|tipo_persona_id|sede_solicitante_id|dependencia_solicitante_id|tipo_control_id):\n${contrato}\n\n` +
        `contrato_general sin valor (${camposSinValorContrato.join('|')}):\n${sinValor}\n\n` +
        `ordenador_contrato sin valor al crearlo (${camposSinValorOrdenador.join('|')}):\n${sinValorOrdenador}\n\n` +
        `supervisor_contrato.cargo_id al crearlo: ${cargoSupervisorInicial}\n` +
        `supervisor_contrato.cargo_id tras editar (se fijó en 45 por SQL): ${cargoSupervisor}\n` +
        `ordenador_contrato tras editar (cargo_id|ordenador_sicapital_id|documento_identidad, fijados por SQL): ${ordenadorEditado}\n\n` +
        Object.entries(conteos).map(([k, v]) => `${k}: ${v}`).join('\n') +
        `\n\nPeticiones al CRUD Beego (${peticionesAlCrud.length}):\n${peticionesAlCrud.join('\n')}\n`
    );
    expect.soft(contrato).toBe('1000000001|1|10|20|6611');
    expect.soft(sinValor).toBe(nulos(camposSinValorContrato));
    expect.soft(sinValorOrdenador).toBe(nulos(camposSinValorOrdenador));
    expect.soft(cargoSupervisorInicial).toBe('NULL');
    expect.soft(cargoSupervisor).toBe('45');
    expect.soft(ordenadorEditado).toBe('12|1001|1000000003');
    expect.soft(conteos.ordenadores_activos).toBe('1');
    expect.soft(conteos.cdps_activos).toBe('1');
    expect.soft(conteos.supervisores_activos).toBe('1');
    expect.soft(conteos.especificaciones_activas).toBe('1');
    // Parámetros va simulado: tipo 121 del año actual.
    expect.soft(conteos.vigencia_id).toBe(String(VIGENCIA_ACTUAL_ID));
    expect.soft(cuerposConsecutivo[0]).toEqual({ unidad_ejecutora_id: 6818, vigencia_id: VIGENCIA_ACTUAL_ID });
    // La columna date debe quedar con el día local, no con el día UTC.
    expect.soft(conteos.fecha_registro_cdp).toBe(hoyColombia);
    expect.soft(noSimuladas, 'peticiones sin simular').toEqual([]);
  });
});

test('paso 1 en edición: actualiza el mismo contrato y no crea otro', async () => {
  test.setTimeout(120_000);
  const id = contratoId;
  expect(id, 'contrato creado en la prueba anterior').toBeGreaterThan(0);
  const consultar = () => ({
    contratos: sql('select count(*) from contratacion.contrato_general'),
    estados: sql(`select count(*) from contratacion.estado_contrato where contrato_general_id = ${id}`),
    fila: columnas('contrato_general', `id = ${id}`, ['consecutivo_elaboracion', 'plazo_ejecucion', 'proveedor_numero_documento', 'sede_solicitante_id']),
  });
  const antes = consultar();
  const aplicaPoliza = () => columnas('contrato_general', `id = ${id}`, ['aplica_poliza']);
  // "No" en el paso 1 debe quedar como false: antes '0' llegaba como texto y se guardaba true.
  expect.soft(aplicaPoliza()).toBe('false');
  const peticiones: string[] = [];
  const registrar = (r: Request) => {
    if (/\/contratos-generales\/|\/consecutivo/.test(r.url())) peticiones.push(`${r.method()} ${new URL(r.url()).pathname}`);
  };

  await abrirEdicion(page, id);
  const seccion = page.locator('app-paso-info-general');
  const plazo = seccion.locator('input[formcontrolname="plazoEjecucion"]');
  await expect(plazo).toHaveValue('6');
  page.on('request', registrar);
  await plazo.fill('9');
  await seccion.getByRole('button', { name: /Guardar Datos Básicos/ }).click();
  await aceptarAlerta(page);
  page.off('request', registrar);
  const despues = consultar();

  appendFileSync(
    join(EVIDENCIAS, '08-base-de-datos.txt'),
    `\nContrato ${id} editado en el paso 1 (plazo de 6 a 9)\n` +
      `peticiones al guardar: ${peticiones.join(', ')}\n` +
      `antes:   ${JSON.stringify(antes)}\ndespués: ${JSON.stringify(despues)}\n`
  );
  expect.soft(aplicaPoliza(), 'editar conserva el No').toBe('false');
  expect.soft(despues.contratos, 'no debe aparecer un segundo contrato').toBe(antes.contratos);
  expect.soft(despues.estados, 'editar no cambia el estado').toBe(antes.estados);
  expect.soft(despues.fila).toBe(antes.fila.replace(/^([^|]*)\|6\|/, '$1|9|'));
  expect.soft(peticiones.filter((p) => p.endsWith('/consecutivo')), 'editar no pide consecutivo').toEqual([]);
  expect.soft(peticiones).toContain(`PUT /apioas/gestion_contractual_crud/v1/contratos-generales/${id}`);
});

test('fecha de estudios: conserva el día al guardar y al editar', async () => {
  test.setTimeout(180_000);
  contratoId = 0;

  await page.goto('/gestion-contractual/contratos/registrar');
  const seccion = page.locator('app-paso-info-general');
  await expect(seccion).toBeVisible();
  await seleccionar(page, buscable(seccion, 'Tipo de Compromiso'), /^Contrato$/);
  await seleccionar(page, buscable(seccion, 'Tipo de Contrato'), 'Contrato de Prestación de Servicios');
  await seleccionar(page, seccion.locator('mat-select[formcontrolname="perfilContratistaId"]'), 'Profesional');
  await seleccionar(page, buscable(seccion, 'Modalidad de Selección'), 'Contratación Directa');
  await seleccionar(page, buscable(seccion, 'Régimen de Contratación'), 'Régimen Especial - Acuerdo 03 de 2015');
  await seleccionar(page, buscable(seccion, 'Tipología Específica'), 'Prestación de servicios profesionales');
  await seleccionar(page, buscable(seccion, 'Procedimiento'), 'PRO-CD-02 Contratación directa');
  await seccion.locator('mat-datepicker-toggle button').click();
  await page.locator('.mat-calendar-body-today').click();
  await expect(page.locator('.cdk-overlay-backdrop-showing')).toHaveCount(0);
  await seccion.locator('input[formcontrolname="plazoEjecucion"]').fill('6');
  await seleccionar(page, seccion.locator('mat-select[formcontrolname="unidadEjecucionId"]'), 'MESES');
  await seccion.getByRole('button', { name: /Guardar Datos Básicos/ }).click();
  await aceptarAlerta(page);
  await expect.poll(() => contratoId, { message: 'id del contrato creado en el CRUD' }).toBeGreaterThan(0);

  const fechaGuardada = () => columnas('contrato_general', `id = ${contratoId}`, ['fecha_suscripcion_estudio']);
  const fechas = [fechaGuardada()];
  const contratos = sql('select count(*) from contratacion.contrato_general');

  // Guardar otra vez sin salir del registro actualiza el contrato recién creado.
  await guardarPaso1(page, contratoId);
  fechas.push(fechaGuardada());

  // Se abre y se guarda dos veces: el PUT parcial reescribe la fecha leída del CRUD y no se
  // debe correr, ni al guardar el paso 1 ni al guardar el solicitante.
  for (let vez = 0; vez < 2; vez++) {
    await abrirEdicion(page, contratoId);
    await expect(seccion.locator('input[formcontrolname="fechaSuscripcionEstudios"]')).not.toHaveValue('');
    await guardarPaso1(page, contratoId);
    fechas.push(fechaGuardada());
    await page.locator('.step-pill[aria-label="Solicitante y Supervisor"]').click();
    const supervisores = page.locator('app-paso-supervisores');
    await seleccionar(page, buscable(supervisores, 'Sede Universitaria Solicitante'), 'Sede Calle 40');
    await seleccionar(page, buscable(supervisores, 'Dependencia Solicitante'), 'Facultad de Ingeniería');
    const guardado = page.waitForResponse(
      (r) => r.request().method() === 'PUT' && r.url().includes(`/v1/contratos-generales/${contratoId}`)
    );
    await supervisores.getByRole('button', { name: /(Guardar|Actualizar) Solicitante/ }).click();
    expect((await guardado).status()).toBe(200);
    fechas.push(fechaGuardada());
  }
  await abrirEdicion(page, contratoId);
  await expect(seccion.locator('input[formcontrolname="fechaSuscripcionEstudios"]')).not.toHaveValue('');
  await capturar(page, '09-edicion-fecha-estudios');

  const aplicaPoliza = columnas('contrato_general', `id = ${contratoId}`, ['aplica_poliza']);
  appendFileSync(
    join(EVIDENCIAS, '08-base-de-datos.txt'),
    `\nContrato ${contratoId} (fecha de estudios, guardado a las 20:30 de Colombia)\n` +
      `fecha_suscripcion_estudio al crear, al guardar de nuevo y tras cada edición: ${fechas.join(', ')}\n` +
      `aplica_poliza (el control no aplica): ${aplicaPoliza}\n`
  );
  expect.soft(fechas).toEqual(fechas.map(() => hoyColombia));
  expect.soft(sql('select count(*) from contratacion.contrato_general'), 'no debe aparecer otro contrato').toBe(contratos);
  expect.soft(aplicaPoliza).toBe('NULL');
  expect.soft(noSimuladas, 'peticiones sin simular').toEqual([]);
});
