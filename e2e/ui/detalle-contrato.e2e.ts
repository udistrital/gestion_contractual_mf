import { test, expect, BrowserContext, Locator, Page, Route } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  AMPARO_CALIDAD,
  AMPARO_CUMPLIMIENTO,
  CORE_MF_STUB,
  ORDEN_ID,
  PESO_COLOMBIANO_ID,
  TIPO_CONTROL_TECNICO,
  responderServicioExterno,
} from '../support/servicios-simulados';

/**
 * E2E de #390: detalle del contrato en solo lectura (/contratos/detalle/:id) con
 * backend SIMULADO. Ninguna petición sale a los servicios. gestion_contractual_crud
 * se responde en el formato del CRUD Go/Beego v2 de la #385 (rutas /v1/<recurso>/,
 * PascalCase, Status como texto, lista vacía [{}], fechas cero); el MID y los demás
 * servicios, con las simulaciones de e2e/support. Se verifica, paso por paso, que
 * los datos se ven, que los controles están deshabilitados, que no hay acciones de
 * edición y que el detalle no hace ningún POST, PUT, PATCH ni DELETE.
 *
 * Requiere el root (:4200) con la ruta `contratos` hacia este MF y el MF (:4201).
 */
const CONTRATO_ID = 9001;
const EVIDENCIAS = process.env.EVIDENCIAS_390 ?? join(homedir(), 'argo_repos', 'evidencias-390');

const menuPermitido = Buffer.from(
  JSON.stringify([{ Url: `/contratos/detalle/${CONTRATO_ID}` }])
).toString('base64');
const usuario = Buffer.from(
  JSON.stringify({ user: { role: ['ABOGADO_CONTRATACION_RECTOR'] }, userService: { role: [] } })
).toString('base64');

// ---------------------------------------------------------------------------
// Datos simulados del contrato de prueba, en el formato del CRUD Beego v2
// ---------------------------------------------------------------------------

/** Respuesta del CRUD Beego: Status como texto. */
const beego = (Data: unknown, Status = '200') => ({ Success: true, Status, Message: 'Request successful', Data });
const FECHA_CERO = '0001-01-01T00:00:00Z';
const DEL_CONTRATO = { Id: CONTRATO_ID };

const ACTIVIDADES =
  '1. Entregar los equipos de laboratorio descritos en la ficha técnica. Entregable(s): Acta de entrega; Factura. Plazo/Periodicidad: 30 días.\n\n' +
  '2. Realizar la instalación y prueba de funcionamiento de los equipos. Entregable(s): Informe de instalación. Plazo/Periodicidad: 45 días.';

const contrato = {
  Id: CONTRATO_ID,
  NumeroContrato: null,
  VigenciaId: 2026,
  ConsecutivoElaboracion: '27',
  UnidadEjecutoraId: 6818,
  TipoCompromisoId: ORDEN_ID,
  TipoContratoId: 6541,
  PerfilContratistaId: 0,
  FechaSuscripcionEstudio: FECHA_CERO,
  AplicaPoliza: true,
  ModalidadSeleccionId: 6571,
  TipoControlId: TIPO_CONTROL_TECNICO,
  TipologiaEspecificaId: 6583,
  RegimenContratacionId: 6591,
  ProcedimientoId: 6596,
  PlazoEjecucion: 6,
  UnidadEjecucionId: 211,
  TipoMonedaId: PESO_COLOMBIANO_ID,
  ValorPesos: 45000000,
  ValorContratoMe: 0,
  ValorTasaCambio: 0,
  TipoGastoId: 6642,
  OrigenRecursosId: 6651,
  OrigenPresupuestoId: 6661,
  TemaGastoInversionId: 6671,
  MedioPagoId: 6681,
  ClausulaRegistroPresupuestal: true,
  ModoPago: '<p>Un único pago contra entrega a satisfacción, previa certificación del supervisor.</p>',
  Objeto: '<p>Suministro e instalación de equipos para el laboratorio de electrónica de la Facultad de Ingeniería.</p>',
  Justificacion: '<p>La Facultad requiere renovar los equipos del laboratorio para garantizar las prácticas académicas.</p>',
  Actividades: ACTIVIDADES,
  Condiciones: '',
  Observaciones: '',
  FechaInicial: FECHA_CERO,
  FechaFinal: FECHA_CERO,
  FechaSuscripcion: FECHA_CERO,
  ProveedorNumeroDocumento: '1014285890',
  TipoPersonaId: 1,
  ClaseProveedorId: 0,
  DependenciaSolicitanteId: 20,
  SedeSolicitanteId: 10,
  DependenciaSolicitanteLegadoId: 0,
  SedeSolicitanteLegadoId: 0,
  UsuarioId: 0,
  UsuarioRol: '',
  UsuarioLegado: '',
  Activo: true,
  FechaCreacion: '2026-10-20T15:04:11Z',
  FechaModificacion: '2026-10-27T10:12:45Z',
};

const RECURSOS_DEL_CONTRATO: Record<string, unknown[]> = {
  ordenador_contrato: [
    { Id: 71, ContratoGeneralId: DEL_CONTRATO, TerceroId: 0, CargoId: 12, DocumentoIdentidad: '19456789', Resolucion: '', OrdenadorArgoId: 1, OrdenadorSicapitalId: 1001, Activo: true },
  ],
  disponibilidad_presupuestal: [
    { Id: 501, ContratoGeneralId: DEL_CONTRATO, NumeroCdpId: 1234, VigenciaCdpId: 2024, FechaRegistro: '2026-10-21T00:00:00Z', Activo: true },
  ],
  supervisor_contrato: [
    { Id: 61, ContratoGeneralId: DEL_CONTRATO, SupervisorId: 7788, Documento: 79865432, DigitoVerificacion: 3, CargoId: 45, SedeId: 10, DependenciaId: 20, SedeLegado: 'Sede Calle 40', DependenciaLegado: 'Facultad de Ingeniería', CargoLegado: 'Decano', Activo: true },
  ],
  especificacion_tecnica: [
    { Id: 801, ContratoGeneralId: DEL_CONTRATO, Descripcion: 'Osciloscopio digital de 4 canales 200 MHz', Cantidad: 3, ValorUnitario: 9500000, ValorTotal: 28500000, Activo: true },
    { Id: 802, ContratoGeneralId: DEL_CONTRATO, Descripcion: 'Fuente de alimentación DC programable', Cantidad: 5, ValorUnitario: 3300000, ValorTotal: 16500000, Activo: true },
  ],
  amparo_poliza: [
    { Id: 901, ContratoGeneralId: DEL_CONTRATO, PolizaId: null, AmparoId: AMPARO_CUMPLIMIENTO, TipoValorAmparoId: 2, Suficiencia: 20, Valor: 0, Descripcion: 'Cumplimiento del contrato por el 20 % del valor', FechaInicio: FECHA_CERO, FechaFin: FECHA_CERO, Activo: true },
    { Id: 902, ContratoGeneralId: DEL_CONTRATO, PolizaId: null, AmparoId: AMPARO_CALIDAD, TipoValorAmparoId: 2, Suficiencia: 10, Valor: 0, Descripcion: 'Calidad de los bienes por el 10 % del valor', FechaInicio: FECHA_CERO, FechaFin: FECHA_CERO, Activo: true },
  ],
  estado_contrato: [
    { Id: 3, ContratoGeneralId: DEL_CONTRATO, EstadoParametroId: 6773, EstadoInternoParametroId: 6799, Actual: true, Motivo: '', FechaEvento: FECHA_CERO, UsuarioId: 1, UsuarioRol: 'ABOGADO_CONTRATACION_RECTOR', Activo: true },
  ],
};

// ---------------------------------------------------------------------------
// Simulación del backend
// ---------------------------------------------------------------------------

const escrituras: string[] = [];
const noSimuladas: string[] = [];

/** Responde gestion_contractual_crud como el CRUD Beego v2. */
function responderCrudBeego(route: Route, ruta: string, query: URLSearchParams): Promise<void> | null {
  const json = (data: unknown) => route.fulfill({ status: 200, json: data });
  if (ruta === `gestion_contractual_crud/v1/contrato_general/${CONTRATO_ID}`) return json(beego(contrato));
  const lista = ruta.match(/^gestion_contractual_crud\/v1\/(\w+)\/$/);
  if (lista && (query.get('query') ?? '').includes(`ContratoGeneralId.Id:${CONTRATO_ID}`)) {
    const registros = RECURSOS_DEL_CONTRATO[lista[1]];
    // Lista vacía como la devuelve hoy el CRUD Beego.
    return json(beego(registros?.length ? registros : [{}]));
  }
  return null;
}

/** Respuestas por servicio y ruta relativa (sin el prefijo de apioas). */
function responder(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const ruta = url.pathname.replace('/apioas/', '');
  const respuesta = responderCrudBeego(route, ruta, url.searchParams) ?? responderServicioExterno(route, ruta, url.searchParams);
  if (respuesta) return respuesta;
  noSimuladas.push(`${route.request().method()} ${url.pathname}${url.search}`);
  return route.fulfill({ status: 404, json: { Success: false, Status: 404, Message: 'Ruta no simulada en la prueba', Data: null } });
}

async function prepararContexto(ctx: BrowserContext) {
  ctx.on('request', (req) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
      escrituras.push(`${req.method()} ${req.url()}`);
    }
  });
  await ctx.route(/pruebascoreclientes.portaloas.udistrital.edu.co/, (route) =>
    route.fulfill({ contentType: 'application/javascript', body: CORE_MF_STUB })
  );
  await ctx.route(/autenticacion\.portaloas\.udistrital\.edu\.co\/apioas\//, responder);
  await ctx.addInitScript(
    ([menu, user]) => {
      localStorage.setItem('menu', menu);
      localStorage.setItem('user', user);
    },
    [menuPermitido, usuario]
  );
}

// ---------------------------------------------------------------------------
// Verificaciones comunes
// ---------------------------------------------------------------------------

const ACCIONES_DE_EDICION =
  /guardar|agregar|añadir|eliminar|remover|asociar|cargue|plantilla|seleccionar pdf|subir|nueva actividad|cláusula especial|re-sincronizar|consultar registro|siguiente:|\bsave\b|\bdelete\b|upload|add_circle|\bedit\b/i;

/** Describe un control para identificarlo en el reporte. */
async function nombreControl(control: Locator): Promise<string> {
  return control.evaluate((el) => {
    const nombre =
      el.getAttribute('formcontrolname') ??
      el.closest('[formcontrolname]')?.getAttribute('formcontrolname') ??
      el.getAttribute('placeholder') ??
      el.getAttribute('aria-label') ??
      el.className;
    return `${el.tagName.toLowerCase()}[${nombre}]`;
  });
}

/** Controles de captura de la sección que siguen habilitados. */
async function controlesHabilitados(seccion: Locator, excluir: string[] = []): Promise<string[]> {
  const habilitados: string[] = [];
  for (const campo of await seccion.locator('input:not([type="hidden"]), select, textarea').all()) {
    // El input del tooltip de enlaces de Quill no es un campo del formulario.
    if (await campo.evaluate((el) => !!el.closest('.ql-tooltip'))) continue;
    const nombre = await nombreControl(campo);
    if (excluir.some((e) => nombre.includes(e))) continue;
    if (await campo.isEnabled()) habilitados.push(nombre);
  }
  for (const select of await seccion.locator('mat-select').all()) {
    if ((await select.getAttribute('aria-disabled')) !== 'true') habilitados.push(await nombreControl(select));
  }
  for (const editor of await seccion.locator('.ql-editor').all()) {
    if ((await editor.getAttribute('contenteditable')) !== 'false') habilitados.push('editor[quill]');
  }
  return habilitados;
}

async function accionesDeEdicion(seccion: Locator): Promise<string[]> {
  const textos = await seccion.locator('button').allTextContents();
  return textos.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => ACCIONES_DE_EDICION.test(t));
}

async function verificarSoloLectura(seccion: Locator, excluir: string[] = []) {
  expect.soft(await controlesHabilitados(seccion, excluir), 'controles habilitados').toEqual([]);
  expect.soft(await accionesDeEdicion(seccion), 'botones de edición visibles').toEqual([]);
  expect.soft(await seccion.locator('input[type="file"]').count(), 'carga de archivos').toBe(0);
  expect.soft(await visibles(seccion.locator('[contenteditable="true"]')), 'contenido editable visible').toBe(0);
  expect.soft(await visibles(seccion.locator('.ql-toolbar')), 'barra de herramientas de Quill visible').toBe(0);
}

async function visibles(elementos: Locator): Promise<number> {
  let total = 0;
  for (const elemento of await elementos.all()) {
    if (await elemento.isVisible()) total++;
  }
  return total;
}

/** Valor mostrado por un mat-select (directo o dentro de app-searchable-select). */
function valorSelect(contenedor: Locator): Locator {
  return contenedor.locator('.mat-mdc-select-value').first();
}

async function irAlPaso(page: Page, titulo: string) {
  await page.locator(`.step-pill[aria-label="${titulo}"]`).click();
  await page.waitForTimeout(400);
}

/** Avanza con el botón "Siguiente" del modo visualización y verifica el paso activo. */
async function avanzarConSiguiente(page: Page, seccionActual: Locator, titulo: string) {
  await seccionActual.getByRole('button', { name: /^\s*Siguiente\b/ }).click();
  await expect.soft(page.locator(`.step-pill[aria-label="${titulo}"] .step-sublabel`)).toContainText('ACTIVO');
  await page.waitForTimeout(400);
}

async function capturar(page: Page, seccion: Locator, archivo: string) {
  await seccion.scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(EVIDENCIAS, `${archivo}.png`), fullPage: true });
}

// ---------------------------------------------------------------------------
// Prueba
// ---------------------------------------------------------------------------

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  mkdirSync(EVIDENCIAS, { recursive: true });
  context = await browser.newContext({ bypassCSP: true, viewport: { width: 1440, height: 900 } });
  await prepararContexto(context);
  page = await context.newPage();
  await page.goto(`/contratos/detalle/${CONTRATO_ID}`);
  await expect(page.locator('app-registro-contrato')).toBeVisible();
  await expect(page.getByText('Detalle del Contrato').first()).toBeVisible();
  // Espera a que lleguen las cargas asíncronas de todos los pasos.
  await expect(page.locator('app-paso-especificaciones')).toContainText('Osciloscopio digital');
  await page.waitForLoadState('networkidle');
});

test.afterAll(async () => {
  await context.close();
});

test('detalle de contrato en solo lectura (backend simulado)', async () => {
  // Aserciones suaves: se recorren todos los pasos aunque alguno falle.
  test.setTimeout(240_000);

  await test.step('01 info general: datos visibles y en solo lectura', async () => {
    await irAlPaso(page, 'General y Presupuestal');
    const seccion = page.locator('app-paso-info-general');
    const campo = (label: string) => valorSelect(seccion.locator('app-searchable-select', { hasText: label }));

    await expect.soft(campo('Unidad Ejecutora')).toHaveText(/Rectoría/);
    await expect.soft(campo('Tipo de Compromiso')).toHaveText(/Orden/);
    await expect.soft(campo('Tipo de Contrato')).toHaveText(/Orden de Compra/);
    await expect.soft(campo('Modalidad de Selección')).toHaveText(/Contratación Directa/);
    await expect.soft(campo('Régimen de Contratación')).toHaveText(/Régimen Especial/);
    await expect.soft(campo('Tipología Específica')).toHaveText(/Compraventa/);
    await expect.soft(campo('Procedimiento')).toHaveText(/PRO-OC-01/);
    await expect.soft(seccion.locator('input[formcontrolname="plazoEjecucion"]')).toHaveValue('6');
    await expect.soft(valorSelect(seccion.locator('mat-form-field', { has: page.locator('mat-select[formcontrolname="unidadEjecucionId"]') }))).toHaveText(/MESES/);
    await expect.soft(valorSelect(seccion.locator('mat-form-field', { has: page.locator('mat-select[formcontrolname="aplicaPoliza"]') }))).toHaveText(/Si/);

    await verificarSoloLectura(seccion);
    await capturar(page, seccion, '01-info-general');
  });

  await test.step('02 info presupuestal: CDP, ordenador y datos en solo lectura', async () => {
    const seccion = page.locator('app-paso-info-presupuestal');
    const opcion = (control: string) => seccion.locator(`select[formcontrolname="${control}"] option:checked`);

    await expect.soft(seccion.locator('table')).toContainText('1234');
    await expect.soft(seccion.locator('table')).toContainText('FACULTAD DE INGENIERIA');
    await expect.soft(opcion('tipoMoneda')).toHaveText('Peso colombiano');
    await expect.soft(seccion.locator('input[formcontrolname="valorContrato"]')).toHaveValue('45000000');
    await expect.soft(opcion('ordenadorGasto')).toHaveText('RECTOR');
    await expect.soft(seccion.locator('input[formcontrolname="nombreOrdenador"]')).toHaveValue(/GIOVANNI RODRIGO/);
    await expect.soft(opcion('origenRecurso')).toHaveText('Recursos propios');
    await expect.soft(opcion('origenPresupuesto')).toHaveText('Presupuesto de la vigencia');
    await expect.soft(opcion('tipoGasto')).toHaveText('Inversión');
    await expect.soft(opcion('temaGasto')).toHaveText('Dotación de laboratorios');
    await expect.soft(opcion('medioPago')).toHaveText('Transferencia electrónica');
    await expect.soft(seccion.locator('app-editor-enriquecido .ql-editor')).toContainText('Un único pago');

    await verificarSoloLectura(seccion);
    await capturar(page, seccion, '02-info-presupuestal');
  });

  await test.step('03 supervisores y solicitante: datos visibles y en solo lectura', async () => {
    await avanzarConSiguiente(page, page.locator('app-paso-info-presupuestal'), 'Solicitante y Supervisor');
    const seccion = page.locator('app-paso-supervisores');
    const formField = (control: string) =>
      seccion.locator('mat-form-field', { has: page.locator(`mat-select[formcontrolname="${control}"]`) });

    const solicitante = (label: string) => valorSelect(seccion.locator('app-searchable-select', { hasText: label }));

    await expect.soft(solicitante('Sede Universitaria Solicitante')).toHaveText(/Sede Calle 40/);
    await expect.soft(valorSelect(formField('sede').first())).toHaveText(/Sede Calle 40/);
    // Conocido en develop (lo corrige la rama de la #382): al cargar las dependencias de
    // la sede, cargarDependencias() deja en null la dependencia guardada del solicitante
    // y del supervisor. No es de esta rama, así que solo se deja registrado.
    test.info().annotations.push({
      type: 'conocido-develop',
      description: `Dependencia solicitante: "${await solicitante('Dependencia Solicitante').textContent()}", ` +
        `dependencia supervisor: "${await valorSelect(formField('dependencia').first()).textContent()}"`,
    });
    await expect.soft(seccion).toContainText('CARLOS ANDRÉS RUIZ MORENO');
    await expect.soft(seccion).toContainText('Decano');
    // "Tipo y Alcance del Control" se carga de ContratoGeneral.TipoControlId.
    await expect.soft(valorSelect(formField('tipoControl').first())).toHaveText(/Técnico, administrativo y financiero/);

    await verificarSoloLectura(seccion);
    await capturar(page, seccion, '03-supervisores');
  });

  await test.step('04 contratista: datos visibles y en solo lectura', async () => {
    const seccion = page.locator('app-paso-contratistas');
    await expect.soft(seccion.locator('input[formcontrolname="documentoContratista"]')).toHaveValue('1014285890');
    await expect.soft(seccion.locator('input[formcontrolname="documentoContratista"]')).toBeDisabled();
    await expect.soft(seccion.locator('.search-input-wrapper')).toHaveClass(/wrapper-locked/);
    await expect.soft(seccion).toContainText('INGRID PAOLA MORALES MORALES');
    await expect.soft(seccion).toContainText('ingrid.morales@correo.com');

    await verificarSoloLectura(seccion);
    await capturar(page, seccion, '04-contratista');
  });

  await test.step('05 obligaciones: justificación, objeto y actividades en solo lectura', async () => {
    await avanzarConSiguiente(page, page.locator('app-paso-contratistas'), 'Estructura y Necesidad');
    const seccion = page.locator('app-paso-obligaciones');
    await expect.soft(seccion).toContainText('renovar los equipos del laboratorio');
    await expect.soft(seccion).toContainText('Suministro e instalación de equipos');
    await expect.soft(seccion).toContainText('Entregar los equipos de laboratorio');
    await expect.soft(seccion).toContainText('Informe de instalación');

    await verificarSoloLectura(seccion);
    await capturar(page, seccion, '05-obligaciones');
  });

  await test.step('06 especificaciones técnicas: tabla sin acciones', async () => {
    await avanzarConSiguiente(page, page.locator('app-paso-obligaciones'), 'Especificaciones Técnicas');
    const seccion = page.locator('app-paso-especificaciones');
    await expect.soft(seccion).toContainText('Osciloscopio digital de 4 canales 200 MHz');
    await expect.soft(seccion).toContainText('Fuente de alimentación DC programable');
    await expect.soft(seccion.locator('th', { hasText: 'ACCIONES' })).toHaveCount(0);

    await verificarSoloLectura(seccion);
    await capturar(page, seccion, '06-especificaciones');
  });

  await test.step('07 garantías: amparos visibles y en solo lectura', async () => {
    await avanzarConSiguiente(page, page.locator('app-paso-especificaciones'), 'Garantías y Mecanismos de Cobertura del Riesgo');
    const seccion = page.locator('app-paso-garantias');
    const filas = seccion.locator('tr.fila-tabla');
    await expect.soft(filas).toHaveCount(2);
    await expect.soft(valorSelect(filas.nth(0))).toHaveText(/Cumplimiento/);
    await expect.soft(valorSelect(filas.nth(1))).toHaveText(/Calidad de los bienes/);
    await expect.soft(filas.nth(0).locator('input[placeholder="Ej: 10"]')).toHaveValue('20');
    await expect.soft(filas.nth(1).locator('input[placeholder="Ej: 10"]')).toHaveValue('10');
    await expect.soft(filas.nth(0).locator('input').last()).toHaveValue(/Cumplimiento del contrato/);
    await expect.soft(seccion.locator('.kpi-card', { hasText: 'Estado Cobertura' })).toContainText('Completo');
    await expect.soft(seccion.locator('th', { hasText: 'ACCIONES' })).toHaveCount(0);

    await verificarSoloLectura(seccion);
    await capturar(page, seccion, '07-garantias');
  });

  await test.step('08 cláusulas y parágrafos: contenido en solo lectura', async () => {
    await avanzarConSiguiente(page, page.locator('app-paso-garantias'), 'Clausulado y Parágrafos');
    const seccion = page.locator('app-paso-clausulas-paragrafos');
    await expect.soft(seccion).toContainText('PRIMERA');
    await expect.soft(seccion).toContainText('suministrar e instalar los equipos');
    await expect.soft(seccion.locator('app-editor-enriquecido')).toHaveCount(0);

    // El buscador de cláusulas es un filtro de navegación, no un dato del contrato.
    await verificarSoloLectura(seccion, ['Buscar cláusula']);
    await capturar(page, seccion, '08-clausulas');
  });

  await test.step('09 documentos: el paso no forma parte del stepper del registro', async () => {
    // PasoDocumentosComponent solo estaba en el stepper viejo del detalle (sin ruta);
    // el registro no lo incluye, así que en el detalle no se renderiza.
    await expect.soft(page.locator('app-paso-documentos')).toHaveCount(0);
  });

  await test.step('el stepper marca los pasos con datos como guardados', async () => {
    const estados = (await page.locator('.step-pill .step-sublabel').allTextContents()).map((t) => t.trim());
    expect.soft(estados.filter((estado) => /PENDIENTE/.test(estado)), 'pasos pendientes con datos').toEqual([]);
    expect.soft(estados.filter((estado) => /GUARDADO/.test(estado)).length, 'pasos guardados').toBe(estados.length - 1);
  });

  await test.step('el detalle no escribe nada y todas las peticiones están simuladas', async () => {
    expect(escrituras, 'peticiones de escritura').toEqual([]);
    expect(noSimuladas, 'peticiones sin simular').toEqual([]);
  });
});
