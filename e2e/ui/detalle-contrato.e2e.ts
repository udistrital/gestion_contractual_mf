import { test, expect, BrowserContext, Locator, Page, Route } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * E2E de #390: detalle del contrato en solo lectura (/contratos/detalle/:id) con
 * backend SIMULADO. Ninguna petición sale a los servicios: el CRUD, el MID y los
 * demás servicios se responden con page.route en el formato real de develop
 * ({Success, Status, Message, Data}). Se verifica, paso por paso, que los datos se
 * ven, que los controles están deshabilitados, que no hay acciones de edición y
 * que el detalle no hace ningún POST, PUT, PATCH ni DELETE.
 *
 * Requiere el root (:4200) con la ruta `contratos` hacia este MF y el MF (:4201).
 */
const CONTRATO_ID = 9001;
const API = 'https://autenticacion.portaloas.udistrital.edu.co/apioas';
const EVIDENCIAS = process.env.EVIDENCIAS_390 ?? join(homedir(), 'argo_repos', 'evidencias-390');

const menuPermitido = Buffer.from(
  JSON.stringify([{ Url: `/contratos/detalle/${CONTRATO_ID}` }])
).toString('base64');
const usuario = Buffer.from(
  JSON.stringify({ user: { role: ['ABOGADO_CONTRATACION_RECTOR'] }, userService: { role: [] } })
).toString('base64');

/** Mismo stub del core-mf que usa polizas.e2e.ts: shell single-spa sin login. */
const CORE_MF_STUB = `System.register([], function (_export) {
  return { execute: function () {
    _export({ bootstrap: async function () {}, mount: async function () {}, unmount: async function () {} });
  } };
});`;

// ---------------------------------------------------------------------------
// Datos simulados del contrato de prueba
// ---------------------------------------------------------------------------

const ORDEN_ID = 6534;
const PESO_COLOMBIANO_ID = 6634;
const AMPARO_CUMPLIMIENTO = 6602;
const AMPARO_CALIDAD = 6605;

const ok = (Data: unknown, Message = 'Consulta exitosa') => ({ Success: true, Status: 200, Message, Data });

const param = (Id: number, Nombre: string, padre?: number) => ({
  Id,
  Nombre,
  Activo: true,
  ...(padre ? { ParametroPadreId: { Id: padre } } : {}),
});

/** Catálogo de parámetros por tipo, como lo entrega `GET parametros?ids=` del MID. */
const PARAMETROS: Record<number, unknown[]> = {
  111: [param(ORDEN_ID, 'Orden'), param(6535, 'Contrato'), param(6536, 'Convenio')],
  112: [
    param(6541, 'Orden de Compra', ORDEN_ID),
    param(6542, 'Orden de Servicio', ORDEN_ID),
    param(6546, 'Contrato de Prestación de Servicios', 6535),
  ],
  113: [param(6551, 'Profesional', 6546)],
  114: [param(6583, 'Compraventa de bienes muebles', 6541), param(6584, 'Suministro de bienes', 6541)],
  115: [param(6571, 'Contratación Directa'), param(6572, 'Invitación Directa')],
  116: [param(6591, 'Régimen Especial - Acuerdo 03 de 2015'), param(6592, 'Ley 80 de 1993')],
  117: [param(6596, 'PRO-OC-01 Orden de compra'), param(6597, 'PRO-CD-02 Contratación directa')],
  7: [param(211, 'MESES'), param(212, 'DÍAS')],
  137: [param(6773, 'POR SUSCRIBIR')],
  141: [param(6799, 'BORRADOR')],
  122: [param(PESO_COLOMBIANO_ID, 'Peso colombiano'), param(6635, 'Dólar estadounidense')],
  123: [param(6641, 'Funcionamiento'), param(6642, 'Inversión')],
  124: [param(6651, 'Recursos propios'), param(6652, 'Transferencias de la Nación')],
  125: [param(6661, 'Presupuesto de la vigencia'), param(6662, 'Reservas presupuestales')],
  126: [param(6671, 'Dotación de laboratorios'), param(6672, 'Infraestructura tecnológica')],
  127: [param(6681, 'Transferencia electrónica'), param(6682, 'Cheque')],
};

const ACTIVIDADES =
  '1. Entregar los equipos de laboratorio descritos en la ficha técnica. Entregable(s): Acta de entrega; Factura. Plazo/Periodicidad: 30 días.\n\n' +
  '2. Realizar la instalación y prueba de funcionamiento de los equipos. Entregable(s): Informe de instalación. Plazo/Periodicidad: 45 días.';

const contrato = {
  id: CONTRATO_ID,
  vigencia: '2026',
  consecutivo_elaboracion: '27',
  numero_contrato: null,
  unidad_ejecutora_id: 6818,
  tipo_compromiso_id: ORDEN_ID,
  tipo_contrato_id: 6541,
  perfil_contratista_id: null,
  fecha_suscripcion_estudios: null,
  aplica_poliza: true,
  modalidad_seleccion_id: 6571,
  tipo_control_id: null,
  tipologia_especifica_id: 6583,
  regimen_contratacion_id: 6591,
  procedimiento_id: 6596,
  plazo_ejecucion: 6,
  unidad_ejecucion_id: 211,
  tipo_moneda_id: PESO_COLOMBIANO_ID,
  valor_pesos: 45000000,
  valor_contrato_me: 0,
  valor_tasa_cambio: 0,
  tipo_gasto_id: 6642,
  origen_recursos_id: 6651,
  origen_presupuestos_id: 6661,
  tema_gasto_inversion_id: 6671,
  medio_pago_id: 6681,
  clausula_registro_presupuestal: true,
  modo_pago: '<p>Un único pago contra entrega a satisfacción, previa certificación del supervisor.</p>',
  objeto: '<p>Suministro e instalación de equipos para el laboratorio de electrónica de la Facultad de Ingeniería.</p>',
  justificacion: '<p>La Facultad requiere renovar los equipos del laboratorio para garantizar las prácticas académicas.</p>',
  actividades: ACTIVIDADES,
  condiciones: null,
  observaciones: null,
  activo: true,
  fecha_creacion: '2026-10-20T15:04:11.000Z',
  fecha_modificacion: '2026-10-27T10:12:45.000Z',
  contratista: { id: 77, numero_documento: '1014285890', tipo_persona_id: 1 },
};

const cdpCrud = {
  id: 501,
  numero_cdp_id: 1234,
  vigencia_cdp: 2026,
  fecha_registro: '2026-10-21T00:00:00.000Z',
  contrato_general_id: CONTRATO_ID,
  activo: true,
};

const cdpPresupuesto = {
  vigencia: '2026',
  num_sol_adq: '845',
  numero_disponibilidad: '1234',
  valor_contratacion: 50000000,
  nombre_dependencia: 'FACULTAD DE INGENIERIA',
  descripcion: 'Adquisición de equipos de laboratorio',
  estado: 'EXPEDIDO',
  rubro: '3-01-001-02-02-01-0001',
  justificacion: 'Justificación del CDP',
  observaciones: 'Actividades del CDP',
};

const SEDES = [
  { Id: 10, Nombre: 'Sede Calle 40' },
  { Id: 11, Nombre: 'Sede Macarena' },
];
const DEPENDENCIAS = [
  { id: 20, nombre: 'Facultad de Ingeniería' },
  { id: 21, nombre: 'Oficina Asesora de Tecnologías e Información' },
];

const supervisorCrud = {
  id: 61,
  supervisor_id: '7788',
  documento: '79865432',
  digito_verificacion: '3',
  sede_id: '10',
  dependencia_id: '20',
  cargo_id: '45',
  sede_legado: 'Sede Calle 40',
  dependencia_legado: 'Facultad de Ingeniería',
  cargo_legado: 'Decano',
  contrato_general_id: CONTRATO_ID,
};

const supervisorMid = {
  nombre: 'CARLOS ANDRÉS RUIZ MORENO',
  cargo: 'Decano',
  documento: '79865432',
  digito_verificacion: '3',
  cargo_id: '45',
  sede_supervisor: 'Sede Calle 40',
  dependencia_supervisor: 'Facultad de Ingeniería',
};

const proveedor = {
  proveedor: {
    tipo_persona: 'NATURAL',
    tipo_persona_id: 1,
    numero_documento: '1014285890',
    nombre_completo_proveedor: 'INGRID PAOLA MORALES MORALES',
    ciudad_contacto: 'Bogotá D.C.',
    direccion: 'Calle 100 # 15-20',
    correo: 'ingrid.morales@correo.com',
    ciudad_expedicion_documento: 'Bogotá D.C.',
  },
  contratos: [],
};

const especificaciones = [
  { id: 801, descripcion: 'Osciloscopio digital de 4 canales 200 MHz', cantidad: 3, valor_unitario: 9500000, valor_total: 28500000, contrato_general_id: CONTRATO_ID },
  { id: 802, descripcion: 'Fuente de alimentación DC programable', cantidad: 5, valor_unitario: 3300000, valor_total: 16500000, contrato_general_id: CONTRATO_ID },
];

const amparos = [
  { id: 901, contrato_general_id: CONTRATO_ID, amparo_id: AMPARO_CUMPLIMIENTO, tipo_valor_amparo_id: 2, suficiencia: 20, descripcion: 'Cumplimiento del contrato por el 20 % del valor', activo: true },
  { id: 902, contrato_general_id: CONTRATO_ID, amparo_id: AMPARO_CALIDAD, tipo_valor_amparo_id: 2, suficiencia: 10, descripcion: 'Calidad de los bienes por el 10 % del valor', activo: true },
];

const clausulas = [
  {
    _id: 'cl-1',
    nombre: 'Objeto',
    descripcion: '<p>El contratista se obliga a suministrar e instalar los equipos del laboratorio de electrónica.</p>',
    predeterminado: true,
    es_editable: false,
    paragrafos: [],
  },
  {
    _id: 'cl-2',
    nombre: 'Plazo de ejecución',
    descripcion: '<p>El plazo de ejecución será de seis (6) meses contados a partir del acta de inicio.</p>',
    predeterminado: false,
    es_editable: true,
    paragrafos: [
      { _id: 'pa-1', nombre: 'Parágrafo primero', descripcion: '<p>El plazo podrá prorrogarse por mutuo acuerdo.</p>', predeterminado: false, es_editable: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Simulación del backend
// ---------------------------------------------------------------------------

const escrituras: string[] = [];
const noSimuladas: string[] = [];

/** Respuestas por servicio y ruta relativa (sin el prefijo de apioas). */
function responder(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const ruta = url.pathname.replace('/apioas/', '');
  const query = url.searchParams;
  const json = (data: unknown, status = 200) => route.fulfill({ status, json: data });

  // gestion_contractual_crud
  if (ruta === `gestion_contractual_crud/contratos-generales/${CONTRATO_ID}`) return json(ok(contrato));
  if (ruta === `gestion_contractual_crud/ordenador-contrato/contrato/${CONTRATO_ID}`)
    return json(ok({ id: 71, ordenador_argo_id: 1, ordenador_sicapital_id: 1001, documento_identidad: '19456789', cargo_id: 12, contrato_general_id: CONTRATO_ID }, 'Supervisores encontrados'));
  if (ruta === `gestion_contractual_crud/disponibilidad_presupuestal/contrato/${CONTRATO_ID}`) return json(ok([cdpCrud]));
  if (ruta === `gestion_contractual_crud/solicitantes/contrato/${CONTRATO_ID}`)
    return json(ok({ id: 31, sede_solicitante_id: 10, dependencia_solicitante_id: 20, contrato_general_id: CONTRATO_ID }));
  if (ruta === `gestion_contractual_crud/supervisores/contrato/${CONTRATO_ID}`) return json(ok([supervisorCrud], 'Supervisores encontrados'));
  if (ruta === `gestion_contractual_crud/contratistas/contrato/${CONTRATO_ID}`)
    return json(ok({ id: '77', numero_documento: '1014285890', tipo_persona_id: 1, activo: true, fecha_creacion: '2026-10-21T00:00:00.000Z', fecha_modificacion: null, contrato_general_id: CONTRATO_ID }, 'Contratista encontrado'));
  if (ruta === 'gestion_contractual_crud/especificaciones-tecnicas') return json(ok(especificaciones));
  // El MF pide esta ruta, aunque el CRUD de develop no la expone (ver hallazgos de la #390).
  if (ruta === `gestion_contractual_crud/amparos-polizas/contrato/${CONTRATO_ID}`) return json(ok(amparos));
  if (ruta === `gestion_contractual_crud/estados-contrato/contrato/${CONTRATO_ID}/actual`)
    return json({ id: 3, estado_parametro_id: 6773, estado_interno_parametro_id: 6799, actual: true, contrato_general_id: CONTRATO_ID });

  // gestion_contractual_mid
  if (ruta === 'gestion_contractual_mid/parametros') {
    const ids = (query.get('ids') ?? '').split(',').map(Number);
    return json(ok(Object.fromEntries(ids.map((id) => [id, PARAMETROS[id] ?? []]))));
  }
  if (ruta === 'gestion_contractual_mid/espacios-fisicos/sedes') return json(ok(SEDES));
  if (/^gestion_contractual_mid\/espacios-fisicos\/dependencias-sede\/\d+$/.test(ruta)) return json(ok(DEPENDENCIAS));

  // ordenador_supervisor_mid
  if (ruta === 'ordenador_supervisor_mid/v1/rol-ordenador')
    return json(ok([{ id: 1, rol: 'RECTOR' }, { id: 2, rol: 'VICERRECTOR ADMINISTRATIVO Y FINANCIERO' }]));
  if (ruta === 'ordenador_supervisor_mid/v1/rol-ordenador/actual')
    return json(ok([{ nombre_ordenador: 'GIOVANNI RODRIGO BERMÚDEZ BOHÓRQUEZ', documento: '19456789' }]));
  if (ruta === 'ordenador_supervisor_mid/v1/supervisores/dependencia') return json(ok([supervisorMid]));

  // presupuesto_contractual_mid, proveedores_mid
  if (ruta === 'presupuesto_contractual_mid/cdps') return json(ok([cdpPresupuesto]));
  if (ruta === 'proveedores_mid/contratistas') return json(ok(proveedor, 'Contratista encontrado'));

  // parametros_crud (índices de cláusulas y tipos de amparo)
  if (ruta === 'parametros/v1/parametro') {
    const consulta = query.get('query') ?? '';
    if (consulta.includes('TipoParametroId:135'))
      return json({ Success: true, Status: '200', Message: 'Request successful', Data: [{ Id: 1, Nombre: 'PRIMERA' }, { Id: 2, Nombre: 'SEGUNDA' }] });
    if (consulta.includes('TipoParametroId:118'))
      return json({ Success: true, Status: '200', Message: 'Request successful', Data: [{ Id: AMPARO_CUMPLIMIENTO, Nombre: 'Cumplimiento' }, { Id: AMPARO_CALIDAD, Nombre: 'Calidad de los bienes' }] });
    return json({ Success: true, Status: '200', Message: 'Request successful', Data: [] });
  }

  // clausulas_paragrafos_crud (el MF usa el contrato fijo 9512 en develop)
  if (/^clausulas_paragrafos_crud\/contratos\/\d+$/.test(ruta)) return json(ok(clausulas));

  noSimuladas.push(`${route.request().method()} ${url.pathname}${url.search}`);
  return json({ Success: false, Status: 404, Message: 'Ruta no simulada en la prueba', Data: null }, 404);
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
