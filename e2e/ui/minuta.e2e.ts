import { test, expect, BrowserContext, Page, Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
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
 * E2E de #405: minuta en la vista previa del paso de cláusulas y en la pestaña
 * "Minuta" de la revisión, con backend SIMULADO. Ninguna petición sale a los
 * servicios. La minuta (minuta_contractual_mid) se responde con el sobre
 * {Success, Status, Message, Data} de udistrital/minuta_contractual_mid#14, con
 * HTTP 200 (el resultado va en Status) y con el código HTTP real; el PDF es un
 * fixture mínimo sin datos reales (e2e/support/minuta-minima.pdf). El contrato,
 * el CRUD y los demás servicios son los mismos de detalle-contrato.e2e.ts.
 *
 * Requiere el root (:4200) con la ruta `contratos` hacia este MF y el MF (:4201).
 * Ejecutar: pnpm run test:e2e -- minuta
 */
const CONTRATO_ID = 9001;
/** Estados internos del contrato (environment.ESTADOS_INTERNOS). */
const BORRADOR = 6799;
const RECHAZADO = 6803;
const EN_REVISION_JEFE = 6800;
const EN_FIRMA_ORDENADOR = 6801;
const FALLA_SERVICIO = 'No se pudo generar la minuta. Intente en unos minutos; si el problema continúa, contacte a soporte.';
const PDF = readFileSync(join(__dirname, '..', 'support', 'minuta-minima.pdf')).toString('base64');

const menuPermitido = Buffer.from(
  JSON.stringify([
    { Url: `/gestion-contractual/contratos/detalle/${CONTRATO_ID}` },
    { Url: `/gestion-contractual/contratos/editar/${CONTRATO_ID}` },
    { Url: `/gestion-contractual/contratos/documentos/${CONTRATO_ID}` },
  ])
).toString('base64');
const usuario = Buffer.from(
  JSON.stringify({ user: { role: ['ABOGADO_CONTRATACION_RECTOR'] }, userService: { role: [] } })
).toString('base64');

// ---------------------------------------------------------------------------
// Datos simulados del contrato de prueba, en el formato del CRUD: snake_case,
// [] en listas vacías, null en lo que no tiene valor y FK como objeto { id }.
// ---------------------------------------------------------------------------

const ok = (Data: unknown) => ({ Success: true, Status: '200', Message: 'Request successful', Data });
const DEL_CONTRATO = { id: CONTRATO_ID };

const ACTIVIDADES =
  '1. Entregar los equipos de laboratorio descritos en la ficha técnica. Entregable(s): Acta de entrega; Factura. Plazo/Periodicidad: 30 días.\n\n' +
  '2. Realizar la instalación y prueba de funcionamiento de los equipos. Entregable(s): Informe de instalación. Plazo/Periodicidad: 45 días.';

const contrato = {
  id: CONTRATO_ID,
  numero_contrato: null,
  vigencia_id: null,
  consecutivo_elaboracion: '27',
  unidad_ejecutora_id: 6818,
  tipo_compromiso_id: ORDEN_ID,
  tipo_contrato_id: 6541,
  perfil_contratista_id: null,
  fecha_suscripcion_estudio: null,
  aplica_poliza: true,
  modalidad_seleccion_id: 6571,
  tipo_control_id: TIPO_CONTROL_TECNICO,
  tipologia_especifica_id: 6583,
  regimen_contratacion_id: 6591,
  procedimiento_id: 6596,
  plazo_ejecucion: 6,
  unidad_ejecucion_id: 211,
  tipo_moneda_id: PESO_COLOMBIANO_ID,
  valor_pesos: 45000000,
  valor_contrato_me: null,
  valor_tasa_cambio: null,
  tipo_gasto_id: 6642,
  origen_recursos_id: 6651,
  origen_presupuesto_id: 6661,
  tema_gasto_inversion_id: 6671,
  medio_pago_id: 6681,
  clausula_registro_presupuestal: true,
  modo_pago: '<p>Un único pago contra entrega a satisfacción, previa certificación del supervisor.</p>',
  objeto: '<p>Suministro e instalación de equipos para el laboratorio de electrónica de la Facultad de Ingeniería.</p>',
  justificacion: '<p>La Facultad requiere renovar los equipos del laboratorio para garantizar las prácticas académicas.</p>',
  actividades: ACTIVIDADES,
  condiciones: null,
  observaciones: null,
  fecha_inicial: null,
  fecha_final: null,
  fecha_suscripcion: null,
  proveedor_numero_documento: '1000000001',
  tipo_persona_id: 1,
  clase_proveedor_id: null,
  dependencia_solicitante_id: 20,
  activo: true,
  fecha_creacion: '2026-10-20T15:04:11Z',
  fecha_modificacion: '2026-10-27T10:12:45Z',
};

const RECURSOS_DEL_CONTRATO: Record<string, unknown[]> = {
  'ordenadores': [
    { id: 71, contrato_general_id: DEL_CONTRATO, tercero_id: null, cargo_id: 12, documento_identidad: '1000000003', resolucion: null, ordenador_argo_id: 1, ordenador_sicapital_id: 1001, activo: true },
  ],
  'disponibilidades-presupuestales': [
    { id: 501, contrato_general_id: DEL_CONTRATO, numero_cdp_id: 1234, vigencia_cdp_id: 2024, valor_a_tomar: 45000000, fecha_registro: '2026-10-21T00:00:00Z', activo: true },
  ],
  supervisores: [
    { id: 61, contrato_general_id: DEL_CONTRATO, supervisor_id: 7788, documento: 1000000005, digito_verificacion: 3, cargo_id: 45, dependencia_id: 20, sede_legado: 'Sede Calle 40', dependencia_legado: 'Facultad de Ingeniería', cargo_legado: 'Decano', activo: true },
  ],
  'especificaciones-tecnicas': [
    { id: 801, contrato_general_id: DEL_CONTRATO, descripcion: 'Osciloscopio digital de 4 canales 200 MHz', cantidad: 3, valor_unitario: 9500000, valor_total: 28500000, activo: true },
    { id: 802, contrato_general_id: DEL_CONTRATO, descripcion: 'Fuente de alimentación DC programable', cantidad: 5, valor_unitario: 3300000, valor_total: 16500000, activo: true },
  ],
  'amparos-polizas': [
    { id: 901, contrato_general_id: DEL_CONTRATO, poliza_id: null, amparo_id: AMPARO_CUMPLIMIENTO, tipo_valor_amparo_id: 2, suficiencia: 20, valor: null, descripcion: 'Cumplimiento del contrato por el 20 % del valor', fecha_inicio: null, fecha_fin: null, activo: true },
    { id: 902, contrato_general_id: DEL_CONTRATO, poliza_id: null, amparo_id: AMPARO_CALIDAD, tipo_valor_amparo_id: 2, suficiencia: 10, valor: null, descripcion: 'Calidad de los bienes por el 10 % del valor', fecha_inicio: null, fecha_fin: null, activo: true },
  ],
  'estados-contrato': [
    { id: 3, contrato_general_id: DEL_CONTRATO, estado_parametro_id: 6773, estado_interno_parametro_id: 6799, actual: true, motivo: null, fecha_evento: null, usuario_id: 1, usuario_rol: 'ABOGADO_CONTRATACION_RECTOR', activo: true },
  ],
};

// ---------------------------------------------------------------------------
// Respuestas de la minuta
// ---------------------------------------------------------------------------

type Modo = 'HTTP 200' | 'HTTP real';
const sobre = (Status: number, Message: string, Data?: string) => ({
  Success: Status === 200,
  Status,
  Message,
  ...(Data !== undefined ? { Data } : {}),
});
const MINUTA = {
  ok: sobre(200, 'Minuta generada exitosamente', PDF),
  inexistente: sobre(404, 'Contrato general no encontrado'),
  faltanDatos: sobre(422, 'Faltan datos: ordenador'),
  invalida: sobre(200, 'Minuta generada exitosamente', Buffer.from('no soy un PDF').toString('base64')),
  servicioCaido: sobre(502, 'Servicio no disponible: plantillas_mid (paso 1: HTML)'),
};

/** Estado del backend simulado, que cada prueba ajusta. */
const simulacion = {
  minuta: MINUTA.ok as Record<string, unknown>,
  modo: 'HTTP 200' as Modo,
  retrasoMinutaMs: 0,
  minutaGuardada: false,
  guardadoClausulasOk: true,
  /** Estado interno actual del contrato (Parámetros); por defecto Borrador. */
  estadoInterno: BORRADOR,
  /** Estado interno anterior (por ejemplo Rechazado en un contrato reenviado). */
  estadoAnterior: 0,
};
const llamadasMinuta: string[] = [];

function reiniciarSimulacion() {
  Object.assign(simulacion, {
    minuta: MINUTA.ok,
    modo: 'HTTP 200',
    retrasoMinutaMs: 0,
    minutaGuardada: false,
    guardadoClausulasOk: true,
    estadoInterno: BORRADOR,
    estadoAnterior: 0,
  });
  llamadasMinuta.length = 0;
}

// ---------------------------------------------------------------------------
// Simulación del backend
// ---------------------------------------------------------------------------

async function responderMinuta(route: Route, ruta: string): Promise<void> {
  llamadasMinuta.push(ruta);
  if (simulacion.retrasoMinutaMs) await new Promise((r) => setTimeout(r, simulacion.retrasoMinutaMs));
  const status = simulacion.modo === 'HTTP real' ? Number(simulacion.minuta['Status']) : 200;
  return route.fulfill({ status, json: simulacion.minuta });
}

/** Responde gestion_contractual_crud en el formato del CRUD. */
function responderCrud(route: Route, ruta: string, query: URLSearchParams): Promise<void> | null {
  const json = (data: unknown, status = 200) => route.fulfill({ status, json: data });
  if (ruta === `gestion_contractual_crud/v1/contratos-generales/${CONTRATO_ID}`) return json(ok(contrato));
  const lista = ruta.match(/^gestion_contractual_crud\/v1\/([\w-]+)\/$/);
  if (lista?.[1] === 'estados-contrato') {
    const estado = { id: 3, contrato_general_id: DEL_CONTRATO, estado_parametro_id: 6773, actual: true, activo: true };
    // Del más reciente al más antiguo, como los pide la revisión.
    const anterior = simulacion.estadoAnterior
      ? [{ ...estado, id: 2, actual: false, estado_interno_parametro_id: simulacion.estadoAnterior }]
      : [];
    return json(ok([{ ...estado, estado_interno_parametro_id: simulacion.estadoInterno }, ...anterior]));
  }
  if (lista?.[1] === 'documentos-contratos') {
    const guardada = { id: 9, documento_enlace: 'uid-minuta-guardada', fecha_creacion: '2026-11-10T22:15:00Z' };
    return json(ok(simulacion.minutaGuardada ? [guardada] : []));
  }
  if (lista && (query.get('query') ?? '').includes(`contrato_general_id.id:${CONTRATO_ID}`)) {
    return json(ok(RECURSOS_DEL_CONTRATO[lista[1]] ?? []));
  }
  return null;
}

/** Respuestas por servicio y ruta relativa (sin el prefijo de apioas). */
function responder(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const ruta = url.pathname.replace('/apioas/', '');
  const metodo = route.request().method();
  if (ruta.startsWith('minuta_contractual_mid/minutas/')) return responderMinuta(route, ruta);
  if (ruta === 'gestor_documental_mid/v1/document/uid-minuta-guardada') return route.fulfill({ json: { file: PDF } });
  if (/^clausulas_paragrafos_crud\/contratos\/\d+$/.test(ruta) && ['PUT', 'POST'].includes(metodo)) {
    return simulacion.guardadoClausulasOk
      ? route.fulfill({ json: { Success: true, Status: 200, Message: 'ok', Data: {} } })
      : route.fulfill({ status: 404, json: { Success: false, Status: 404, Message: 'simulado', Data: null } });
  }
  const respuesta = responderCrud(route, ruta, url.searchParams) ?? responderServicioExterno(route, ruta, url.searchParams);
  if (respuesta) return respuesta;
  return route.fulfill({ status: 404, json: { Success: false, Status: 404, Message: 'Ruta no simulada en la prueba', Data: null } });
}

async function prepararContexto(ctx: BrowserContext) {
  await ctx.route(/pruebascoreclientes.portaloas.udistrital.edu.co/, (route) =>
    route.fulfill({ contentType: 'application/javascript', body: CORE_MF_STUB })
  );
  await ctx.route(/autenticacion\.portaloas\.udistrital\.edu\.co\/apioas\//, responder);
  await ctx.addInitScript(
    ([menu, user]) => {
      localStorage.setItem('menu', menu);
      localStorage.setItem('user', user);
      // Registra el texto de cada alerta (sweetalert2) que aparece, para contarlas.
      const alertas: string[] = [];
      (window as unknown as { __alertas: string[] }).__alertas = alertas;
      let ultima = '';
      setInterval(() => {
        const popup = document.querySelector('.swal2-popup') as HTMLElement | null;
        const texto = popup ? popup.innerText.replace(/\s+/g, ' ').trim() : '';
        if (texto && texto !== ultima) alertas.push(texto);
        ultima = texto;
      }, 50);
    },
    [menuPermitido, usuario]
  );
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

async function abrir(browser: import('@playwright/test').Browser, ruta: string) {
  const ctx = await browser.newContext({ bypassCSP: true, viewport: { width: 1440, height: 900 } });
  await prepararContexto(ctx);
  const page = await ctx.newPage();
  await page.goto(ruta);
  return { ctx, page };
}

async function irAClausulas(page: Page) {
  await expect(page.locator('app-paso-especificaciones')).toContainText('Osciloscopio digital', { timeout: 60_000 });
  await page.locator('.step-pill[aria-label="Clausulado y Parágrafos"]').click();
  await expect(page.locator('app-paso-clausulas-paragrafos')).toBeVisible();
}

const botonVistaPrevia = (page: Page) => page.locator('app-paso-clausulas-paragrafos .banner-actions .preview-btn');
const botonVistaPreviaDock = (page: Page) => page.locator('app-paso-clausulas-paragrafos .dock-btn-preview');
const modalMinuta = (page: Page) => page.locator('app-pdf-viewer-modal');
const alertas = (page: Page) => page.evaluate(() => (window as unknown as { __alertas: string[] }).__alertas.slice());

async function cerrarAlertaYModal(page: Page) {
  if (await page.locator('.swal2-popup').isVisible()) await page.locator('.swal2-confirm').dispatchEvent('click');
  if (await modalMinuta(page).isVisible()) await page.keyboard.press('Escape');
  await expect(page.locator('.swal2-popup')).toBeHidden();
  await expect(modalMinuta(page)).toBeHidden();
}

// ---------------------------------------------------------------------------
// Vista previa del paso de cláusulas
// ---------------------------------------------------------------------------

for (const modo of ['HTTP 200', 'HTTP real'] as Modo[]) {
  test.describe(`Vista previa de la minuta (${modo})`, () => {
    test.describe.configure({ mode: 'serial' });
    let ctx: BrowserContext;
    let page: Page;

    test.beforeAll(async ({ browser }) => {
      reiniciarSimulacion();
      ({ ctx, page } = await abrir(browser, `/gestion-contractual/contratos/detalle/${CONTRATO_ID}`));
      await irAClausulas(page);
    });
    test.afterAll(async () => ctx.close());
    test.beforeEach(() => {
      reiniciarSimulacion();
      simulacion.modo = modo;
    });
    test.afterEach(async () => cerrarAlertaYModal(page));

    test('200: abre el modal "Minuta preliminar" con el PDF', async () => {
      await botonVistaPrevia(page).click();
      await expect(modalMinuta(page)).toBeVisible();
      await expect(modalMinuta(page).locator('plantilla-modal b')).toHaveText('Minuta preliminar');
      await expect(modalMinuta(page)).toContainText('Minuta generada con los datos actuales, sin firmar');
      await expect(modalMinuta(page).getByRole('button', { name: /Guardar/ })).toHaveCount(0);
      await expect(modalMinuta(page).locator('.textLayer').first()).toContainText('MINUTA DE PRUEBA');
      expect(llamadasMinuta).toEqual([`minuta_contractual_mid/minutas/contratos/${CONTRATO_ID}`]);
    });

    test('404: avisa que el contrato no existe y no abre el modal', async () => {
      simulacion.minuta = MINUTA.inexistente;
      await botonVistaPrevia(page).click();
      await expect(page.locator('.swal2-popup')).toContainText('El contrato no existe.');
      await expect(modalMinuta(page)).toHaveCount(0);
    });

    test('422: indica el paso del registro donde se completa el dato', async () => {
      simulacion.minuta = MINUTA.faltanDatos;
      await botonVistaPrevia(page).click();
      await expect(page.locator('.swal2-popup')).toContainText(
        'Faltan datos en el paso General y Presupuestal: ordenador del gasto.'
      );
      await expect(page.locator('.swal2-popup')).not.toContainText('Faltan datos: ordenador');
      await expect(modalMinuta(page)).toHaveCount(0);
    });

    test('502: mensaje único, sin nombres técnicos', async () => {
      simulacion.minuta = MINUTA.servicioCaido;
      await botonVistaPrevia(page).click();
      await expect(page.locator('.swal2-popup')).toContainText(FALLA_SERVICIO);
      await expect(page.locator('.swal2-popup')).not.toContainText('plantillas_mid');
      await expect(modalMinuta(page)).toHaveCount(0);
    });

    test('respuesta inválida: no abre un modal vacío', async () => {
      simulacion.minuta = MINUTA.invalida;
      await botonVistaPrevia(page).click();
      await expect(page.locator('.swal2-popup')).toContainText('La minuta llegó vacía o dañada.');
      await expect(modalMinuta(page)).toHaveCount(0);
    });

    test('los dos botones muestran "Generando minuta…" mientras se genera', async () => {
      // Margen amplio: con el MF recién compilado, 2 s no alcanzaban para las cuatro aserciones.
      simulacion.retrasoMinutaMs = 5000;
      await botonVistaPrevia(page).click();
      for (const boton of [botonVistaPrevia(page), botonVistaPreviaDock(page)]) {
        await expect(boton).toBeDisabled();
        await expect(boton).toContainText('Generando minuta…');
      }
      await expect(modalMinuta(page)).toBeVisible({ timeout: 15_000 });
      await page.keyboard.press('Escape');
      for (const boton of [botonVistaPrevia(page), botonVistaPreviaDock(page)]) {
        await expect(boton).toBeEnabled();
        await expect(boton).not.toContainText('Generando minuta…');
      }
    });
  });
}

test('detalle En firma del ordenador: el botón "Ver Minuta" muestra la minuta cargada en el modal "Minuta"', async ({ browser }) => {
  reiniciarSimulacion();
  simulacion.estadoInterno = EN_FIRMA_ORDENADOR;
  simulacion.minutaGuardada = true;
  const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/detalle/${CONTRATO_ID}`);
  try {
    await irAClausulas(page);
    await expect(botonVistaPrevia(page)).toHaveAccessibleName('Ver Minuta');
    await expect(botonVistaPreviaDock(page)).toHaveAccessibleName('Ver Minuta');
    await botonVistaPrevia(page).click();
    await expect(modalMinuta(page).locator('plantilla-modal b')).toHaveText('Minuta');
    await expect(modalMinuta(page)).toContainText('Minuta cargada el 10/11/2026');
    await expect(modalMinuta(page).locator('.textLayer').first()).toContainText('MINUTA DE PRUEBA');
    await expect(modalMinuta(page).getByRole('button', { name: /Guardar/ })).toHaveCount(0);
    expect(llamadasMinuta).toEqual([]);
  } finally {
    await ctx.close();
  }
});

test('detalle En revisión del jefe: el botón sigue siendo "Vista Previa de Minuta" y genera', async ({ browser }) => {
  reiniciarSimulacion();
  simulacion.estadoInterno = EN_REVISION_JEFE;
  simulacion.minutaGuardada = true;
  const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/detalle/${CONTRATO_ID}`);
  try {
    await irAClausulas(page);
    await expect(botonVistaPrevia(page)).toHaveAccessibleName('Vista Previa de Minuta');
    await botonVistaPrevia(page).click();
    await expect(modalMinuta(page).locator('plantilla-modal b')).toHaveText('Minuta preliminar');
    await expect(modalMinuta(page)).toContainText('Minuta generada con los datos actuales, sin firmar');
    expect(llamadasMinuta).toHaveLength(1);
  } finally {
    await ctx.close();
  }
});

test('edición en Borrador: la vista previa no ofrece "Guardar"', async ({ browser }) => {
  reiniciarSimulacion();
  const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/editar/${CONTRATO_ID}`);
  try {
    await irAClausulas(page);
    await botonVistaPrevia(page).click();
    await expect(modalMinuta(page).locator('plantilla-modal b')).toHaveText('Minuta preliminar');
    await expect(modalMinuta(page).getByRole('button', { name: /Cerrar/ })).toBeVisible();
    await expect(modalMinuta(page).getByRole('button', { name: /Guardar/ })).toHaveCount(0);
  } finally {
    await ctx.close();
  }
});

test('edición: si falla el guardado previo de cláusulas no genera la minuta y deja una sola alerta', async ({ browser }) => {
  reiniciarSimulacion();
  simulacion.guardadoClausulasOk = false;
  const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/editar/${CONTRATO_ID}`);
  try {
    await irAClausulas(page);
    await page.evaluate(() => ((window as unknown as { __alertas: string[] }).__alertas.length = 0));

    await botonVistaPrevia(page).click();
    await expect(page.locator('.swal2-popup')).toContainText(
      'No se pudieron guardar las cláusulas. La minuta no se generó para no mostrar datos desactualizados.'
    );
    await page.waitForTimeout(1000);

    expect(await alertas(page)).toHaveLength(1);
    expect(llamadasMinuta).toEqual([]);
    await expect(modalMinuta(page)).toHaveCount(0);
    await expect(botonVistaPrevia(page)).toBeEnabled();
  } finally {
    await ctx.close();
  }
});

// ---------------------------------------------------------------------------
// Pestaña "Minuta" de la revisión
// ---------------------------------------------------------------------------

test.describe('Revisión: pestaña Minuta', () => {
  const panel = (page: Page) => page.locator('app-revision-contrato .pdf-container').first();

  test.beforeEach(() => reiniciarSimulacion());

  test('En firma del ordenador con minuta cargada: la muestra con "Minuta cargada el dd/mm/aaaa" y no la genera', async ({ browser }) => {
    simulacion.estadoInterno = EN_FIRMA_ORDENADOR;
    simulacion.minutaGuardada = true;
    const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/documentos/${CONTRATO_ID}`);
    try {
      await expect(page.locator('app-revision-contrato .origen-minuta p')).toHaveText('Minuta cargada el 10/11/2026', { timeout: 60_000 });
      await expect(panel(page).locator('.textLayer').first()).toContainText('MINUTA DE PRUEBA');
      expect(llamadasMinuta).toEqual([]);
    } finally {
      await ctx.close();
    }
  });

  for (const [nombre, estado] of [
    ['Borrador', BORRADOR],
    ['Rechazado', RECHAZADO],
    ['En revisión del jefe', EN_REVISION_JEFE],
  ] as const) {
    test(`${nombre} con minuta cargada: genera con los datos actuales e ignora la cargada`, async ({ browser }) => {
      simulacion.estadoInterno = estado;
      simulacion.minutaGuardada = true;
      const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/documentos/${CONTRATO_ID}`);
      try {
        await expect(page.locator('app-revision-contrato .origen-minuta p')).toHaveText(
          'Minuta generada con los datos actuales, sin firmar',
          { timeout: 60_000 }
        );
        expect(llamadasMinuta).toHaveLength(1);
      } finally {
        await ctx.close();
      }
    });
  }

  test('reenviado después de un rechazo, con una minuta vieja cargada: no la muestra', async ({ browser }) => {
    simulacion.estadoInterno = EN_REVISION_JEFE;
    simulacion.estadoAnterior = RECHAZADO;
    simulacion.minutaGuardada = true;
    const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/documentos/${CONTRATO_ID}`);
    try {
      await expect(page.locator('app-revision-contrato .origen-minuta p')).toHaveText(
        'Minuta generada con los datos actuales, sin firmar',
        { timeout: 60_000 }
      );
      await expect(page.locator('app-revision-contrato')).not.toContainText('Minuta cargada');
      expect(llamadasMinuta).toHaveLength(1);
    } finally {
      await ctx.close();
    }
  });

  test('minuta generada: la muestra con su etiqueta', async ({ browser }) => {
    const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/documentos/${CONTRATO_ID}`);
    try {
      await expect(page.locator('app-revision-contrato .origen-minuta p')).toHaveText(
        'Minuta generada con los datos actuales, sin firmar',
        { timeout: 60_000 }
      );
      await expect(panel(page).locator('.textLayer').first()).toContainText('MINUTA DE PRUEBA');
      expect(llamadasMinuta).toHaveLength(1);
    } finally {
      await ctx.close();
    }
  });

  for (const modo of ['HTTP 200', 'HTTP real'] as Modo[]) {
    test(`502 (${modo}): "Reintentar" vuelve a pedir y termina mostrando la minuta`, async ({ browser }) => {
      simulacion.modo = modo;
      simulacion.minuta = MINUTA.servicioCaido;
      const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/documentos/${CONTRATO_ID}`);
      try {
        const error = panel(page).locator('.estado-minuta[role="alert"]');
        await expect(error).toContainText(FALLA_SERVICIO, { timeout: 60_000 });
        await expect(error).not.toContainText('plantillas_mid');

        simulacion.minuta = MINUTA.ok;
        simulacion.retrasoMinutaMs = 1000;
        await panel(page).getByRole('button', { name: 'Reintentar' }).click();
        await expect(panel(page).locator('.estado-minuta mat-spinner')).toBeVisible();

        await expect(page.locator('app-revision-contrato .origen-minuta p')).toHaveText('Minuta generada con los datos actuales, sin firmar');
        await expect(panel(page).locator('.textLayer').first()).toContainText('MINUTA DE PRUEBA');
        expect(llamadasMinuta).toHaveLength(2);
      } finally {
        await ctx.close();
      }
    });

    test(`404 (${modo}): muestra el mensaje sin "Reintentar"`, async ({ browser }) => {
      simulacion.modo = modo;
      simulacion.minuta = MINUTA.inexistente;
      const { ctx, page } = await abrir(browser, `/gestion-contractual/contratos/documentos/${CONTRATO_ID}`);
      try {
        await expect(panel(page).locator('.estado-minuta[role="alert"]')).toContainText('El contrato no existe.', {
          timeout: 60_000,
        });
        await expect(panel(page).getByRole('button', { name: 'Reintentar' })).toHaveCount(0);
        await expect(panel(page).locator('app-pdf-visualizador')).toHaveCount(0);
      } finally {
        await ctx.close();
      }
    });
  }
});
