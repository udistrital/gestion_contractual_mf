import { test, expect, APIRequestContext, BrowserContext, Page, request } from '@playwright/test';
import {
  AMPARO_CALIDAD,
  AMPARO_CUMPLIMIENTO,
  CONTRATO_ID,
  PREFIJO,
  VIGENCIA,
  crearAmparos,
  exigirContratoLibre,
  limpiarContrato,
  listarAmparos,
  obtenerPoliza,
} from '../support/api';

/**
 * E2E de #352: flujo de usuario de pólizas y amparos a través del root, con CRUD y
 * MID reales. Las pruebas son secuenciales y comparten el contrato sandbox.
 *
 * Nota sobre fechas: el adaptador de fechas nativo parsea el texto con `Date.parse`,
 * por eso aquí se escribe MM/DD/YYYY, que es el formato que interpreta sin ambigüedad.
 */
test.describe.configure({ mode: 'serial' });

const NUMERO_POLIZA = `${PREFIJO}POL-UI`;
const menuPermitido = Buffer.from(
  JSON.stringify([
    { Url: '/polizas/registrar' },
    { Url: '/polizas/consultar' },
    { Url: '/polizas/listado' },
  ])
).toString('base64');
const usuario = Buffer.from(
  JSON.stringify({ user: { role: ['CONTRATACION'] }, userService: { role: [] } })
).toString('base64');

let api: APIRequestContext;
let context: BrowserContext;
let page: Page;

/**
 * Aísla el MF de servicios externos que no forman parte de #352: el core-mf remoto
 * (shell con login OAuth que tapa la pantalla) se reemplaza por un stub single-spa
 * sin UI, y el catálogo de Parámetros (solo se usa para resolver nombres que la
 * pantalla toma del MID) responde vacío.
 */
const CORE_MF_STUB = `System.register([], function (_export) {
  return { execute: function () {
    _export({ bootstrap: async function () {}, mount: async function () {}, unmount: async function () {} });
  } };
});`;

async function aislarServiciosExternos(ctx: BrowserContext) {
  await ctx.route(/pruebascoreclientes.portaloas.udistrital.edu.co/, (route) =>
    route.fulfill({ contentType: 'application/javascript', body: CORE_MF_STUB })
  );
  await ctx.route(/\/v1\/parametro(\?|$)/, (route) =>
    route.fulfill({ json: { Success: true, Status: '200', Data: [] } })
  );
  await aislarGuardadoDelActa(ctx);
}

/**
 * Al registrar los amparos se genera el acta (minuta mid), se sube al gestor documental
 * y se registra en `documentos-contratos` (#360). Esta prueba valida el flujo de la
 * pantalla, no esos servicios: se simulan para no escribir en el gestor ni en Nuxeo.
 * Las llamadas quedan en `llamadasGuardadoActa` para verificar el orden.
 */
const llamadasGuardadoActa: string[] = [];

async function aislarGuardadoDelActa(ctx: BrowserContext) {
  await ctx.route(/\/acta-poliza\/contratos\/\d+$/, (route) => {
    llamadasGuardadoActa.push('GET acta-poliza');
    return route.fulfill({ json: { Success: true, Status: 200, Data: 'JVBERi0xLjQK' } });
  });
  await ctx.route(/\/document\/upload$/, (route) => {
    llamadasGuardadoActa.push('POST document/upload');
    return route.fulfill({
      json: { Status: '200', res: { Id: 1, Enlace: '00000000-0000-4000-8000-000000000000' } },
    });
  });
  await ctx.route(/\/documentos-contratos$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    llamadasGuardadoActa.push('POST documentos-contratos');
    return route.fulfill({ status: 201, json: { Success: true, Status: 201, Data: {} } });
  });
}

async function seleccionar(pagina: Page, formControlName: string, opcion: string | RegExp) {
  // `force`: sin la fuente de iconos (la cargaba el core-mf) el texto de las ligaduras
  // se superpone al select y Playwright lo considera tapado.
  await pagina.locator(`mat-select[formcontrolname="${formControlName}"]`).click({ force: true });
  await pagina.getByRole('option', { name: opcion }).click();
  await expect(pagina.locator('.cdk-overlay-backdrop-showing')).toHaveCount(0);
}

test.beforeAll(async ({ browser }) => {
  api = await request.newContext();
  await limpiarContrato(api);
  await exigirContratoLibre(api);
  // Lo que en producción hace el paso Garantías: amparos sin póliza.
  await crearAmparos(api, [AMPARO_CUMPLIMIENTO, AMPARO_CALIDAD]);

  // bypassCSP: el root solo permite `connect-src https:`, pero el ambiente de pruebas
  // apunta Parámetros a http://pruebasapi… y el navegador lo bloquea antes de que el
  // stub de `aislarServiciosExternos` pueda responderlo.
  context = await browser.newContext({ bypassCSP: true });
  await context.addInitScript(
    ([menu, user]) => {
      localStorage.setItem('menu', menu);
      localStorage.setItem('user', user);
    },
    [menuPermitido, usuario]
  );
  await aislarServiciosExternos(context);
  page = await context.newPage();
});

test.afterAll(async () => {
  await limpiarContrato(api);
  await context.close();
  await api.dispose();
});

test('registrar póliza: guarda los datos básicos y el botón pasa a "Actualizar"', async () => {
  await page.goto('/polizas/registrar');
  await expect(page.getByText('Asociar Contratos')).toBeVisible();

  await seleccionar(page, 'vigencia', VIGENCIA);
  await seleccionar(page, 'consecutivo', String(CONTRATO_ID));

  // Sin póliza previa, el formulario arranca vacío.
  await expect(page.locator('input[formcontrolname="numero_poliza"]')).toHaveValue('');
  const guardar = page.getByRole('button', { name: /Guardar póliza/ });
  await expect(guardar).toBeDisabled();

  await page.locator('input[formcontrolname="numero_poliza"]').fill(NUMERO_POLIZA);
  await page.locator('input[formcontrolname="fecha_inicio"]').fill('01/15/2026');
  await page.locator('input[formcontrolname="fecha_fin"]').fill('12/15/2026');
  await page.locator('input[formcontrolname="fecha_expedicion"]').fill('01/10/2026');
  await page.locator('input[formcontrolname="fecha_aprobacion"]').fill('01/12/2026');
  await seleccionar(page, 'entidad_aseguradora_id', /Seguros del Estado/);
  await page.locator('textarea[formcontrolname="descripcion"]').fill('Póliza creada por E2E');

  await expect(guardar).toBeEnabled();
  await guardar.click();

  await expect(page.locator('.swal2-popup')).toContainText('Póliza guardada exitosamente');
  await page.locator('.swal2-confirm').click();
  await expect(page.getByRole('button', { name: /Actualizar póliza/ })).toBeVisible();

  const poliza = await obtenerPoliza(api);
  expect(poliza.numero_poliza).toBe(NUMERO_POLIZA);
  expect(poliza.fecha_inicio).toContain('2026-01-15');
  expect(poliza.fecha_fin).toContain('2026-12-15');
});

test('registrar póliza: vincula amparos a la póliza con valor y fechas', async () => {
  const registrar = page.getByRole('button', { name: /Registrar$/ });
  await expect(registrar).toBeDisabled(); // sin filas aún

  await seleccionar(page, 'amparoSeleccionado', `${PREFIJO}amparo ${AMPARO_CUMPLIMIENTO}`);
  await page.getByRole('button', { name: /Agregar Amparo/ }).click();

  const fila = page.locator('table.amparos-table tr.mat-mdc-row');
  await expect(fila).toHaveCount(1);
  await fila.locator('input[placeholder="Ingrese el valor"]').fill('17000000');
  await fila.locator('input[placeholder="DD/MM/YYYY"]').nth(0).fill('01/15/2026');
  await fila.locator('input[placeholder="DD/MM/YYYY"]').nth(1).fill('12/15/2026');

  await expect(registrar).toBeEnabled();
  await registrar.click();

  // Registrar pide confirmación porque además genera y guarda el acta (#360).
  await expect(page.locator('.swal2-popup')).toContainText(
    '¿Registrar los amparos y guardar el acta?'
  );
  await page.locator('.swal2-confirm').click();

  // El snackbar de "Amparos registrados..." sigue saliendo un instante: se filtra por texto.
  await expect(
    page
      .locator('.mat-mdc-snack-bar-container')
      .filter({ hasText: 'Póliza registrada y acta de aprobación guardada' })
  ).toBeVisible();
  expect(llamadasGuardadoActa).toEqual([
    'GET acta-poliza',
    'POST document/upload',
    'POST documentos-contratos',
  ]);

  const poliza = await obtenerPoliza(api);
  const amparos = await listarAmparos(api);
  const vinculado = amparos.find((a) => a.amparo_id === AMPARO_CUMPLIMIENTO);
  const libre = amparos.find((a) => a.amparo_id === AMPARO_CALIDAD);
  expect(vinculado.poliza_id).toBe(poliza.id);
  expect(Number(vinculado.valor)).toBe(17000000);
  expect(vinculado.fecha_fin).toContain('2026-12-15');
  expect(libre.poliza_id).toBeNull();
});

test('registrar póliza: al volver al contrato precarga póliza y amparo, y edita sin duplicar', async () => {
  await page.goto('/polizas/registrar');
  await seleccionar(page, 'vigencia', VIGENCIA);
  await seleccionar(page, 'consecutivo', String(CONTRATO_ID));

  await expect(page.locator('input[formcontrolname="numero_poliza"]')).toHaveValue(NUMERO_POLIZA);
  await expect(page.getByRole('button', { name: /Actualizar póliza/ })).toBeVisible();
  await expect(page.locator('table.amparos-table tr.mat-mdc-row')).toHaveCount(1);

  const antes = await obtenerPoliza(api);
  await page.locator('textarea[formcontrolname="descripcion"]').fill('Póliza editada por E2E');
  await page.getByRole('button', { name: /Actualizar póliza/ }).click();
  await expect(page.locator('.swal2-popup')).toContainText('Póliza guardada exitosamente');
  await page.locator('.swal2-confirm').click();

  const despues = await obtenerPoliza(api);
  expect(despues.id).toBe(antes.id); // PUT, no POST
  expect(despues.descripcion).toBe('Póliza editada por E2E');
});

test('registrar póliza: quitar un amparo vinculado lo desvincula', async () => {
  const fila = page.locator('table.amparos-table tr.mat-mdc-row');
  await fila.locator('button[color="warn"]').click();
  await expect(fila).toHaveCount(0);

  await seleccionar(page, 'amparoSeleccionado', `${PREFIJO}amparo ${AMPARO_CALIDAD}`);
  await page.getByRole('button', { name: /Agregar Amparo/ }).click();
  const nueva = page.locator('table.amparos-table tr.mat-mdc-row');
  await nueva.locator('input[placeholder="Ingrese el valor"]').fill('5000000');
  await nueva.locator('input[placeholder="DD/MM/YYYY"]').nth(0).fill('01/15/2026');
  await nueva.locator('input[placeholder="DD/MM/YYYY"]').nth(1).fill('12/15/2026');
  await page.getByRole('button', { name: /Registrar$/ }).click();
  await page.locator('.swal2-confirm').click();
  await expect(
    page
      .locator('.mat-mdc-snack-bar-container')
      .filter({ hasText: 'Póliza registrada y acta de aprobación guardada' })
  ).toBeVisible();

  const poliza = await obtenerPoliza(api);
  const amparos = await listarAmparos(api);
  expect(amparos.find((a) => a.amparo_id === AMPARO_CUMPLIMIENTO).poliza_id).toBeNull();
  expect(amparos.find((a) => a.amparo_id === AMPARO_CALIDAD).poliza_id).toBe(poliza.id);
});

test('consultar pólizas: el contrato aparece con póliza y su detalle abre en el modal', async () => {
  await page.goto('/polizas/consultar');
  const fila = page
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: String(CONTRATO_ID), exact: true }) });

  // El listado carga un contrato por petición al MID y pagina de a 10: se avanza
  // de página hasta encontrar el contrato sandbox.
  await expect(page.locator('tr.mat-mdc-row').first()).toBeVisible({ timeout: 30_000 });
  const siguiente = page.locator('button.mat-mdc-paginator-navigation-next');
  for (let i = 0; i < 10 && (await fila.count()) === 0 && (await siguiente.isEnabled()); i++) {
    await siguiente.click();
  }
  await expect(fila).toBeVisible();
  await expect(fila).toContainText('Sí');
  // El MID resuelve el nombre del amparo desde Parámetros (no la descripción).
  await expect(fila).toContainText('Amparo de Cumplimiento');
  await expect(fila).toContainText('Amparo de Salarios, Prestaciones e Indemnizaciones');

  await fila.getByRole('button', { name: /Ver Detalles/ }).click();
  const modal = page.locator('mat-dialog-container');
  await expect(modal).toContainText(`DETALLE PÓLIZA — CONTRATO ${CONTRATO_ID}`);
  await expect(modal).toContainText(NUMERO_POLIZA);
  await expect(modal).toContainText('Porcentaje');
});

test('autorización: sin menú con la ruta, el authGuard bloquea el acceso', async ({ browser }) => {
  const sinPermisos = await browser.newContext();
  await aislarServiciosExternos(sinPermisos);
  const p = await sinPermisos.newPage();
  await p.goto('/polizas/registrar');
  await expect(p.locator('.swal2-popup')).toContainText('No tiene permisos para realizar esta acción');
  await expect(p.getByText('Asociar Contratos')).toHaveCount(0);
  await sinPermisos.close();
});
