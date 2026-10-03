import { APIRequestContext, expect } from '@playwright/test';

/**
 * Utilidades compartidas por las pruebas de integración y E2E de pólizas y
 * amparos (#352). Las URLs de las peticiones replican las que arma
 * `src/app/services/polizas.service.ts`: desde #360 van a gestion_contractual_mid.
 * La limpieza sigue directo en el CRUD porque el MID no expone DELETE /polizas.
 */

export const CRUD_URL = (process.env.CRUD_URL ?? 'http://localhost:8080').replace(/\/$/, '');
export const MID_URL = (process.env.MID_URL ?? 'http://localhost:8081').replace(/\/$/, '');

/**
 * Contrato "sandbox" sobre el que escriben las pruebas. Debe existir en la BD de
 * desarrollo y no tener póliza ni amparos activos propios.
 */
export const CONTRATO_ID = Number(process.env.E2E_CONTRATO_ID ?? 13);
export const VIGENCIA = process.env.E2E_VIGENCIA ?? '2026';

/** Ids de tipo de amparo (Parámetros CRUD) que ya existen en la BD de desarrollo. */
export const AMPARO_CUMPLIMIENTO = 6602;
export const AMPARO_CALIDAD = 6605;

/** Todo lo que crean las pruebas lleva este prefijo, para limpiar solo lo propio. */
export const PREFIJO = 'E2E-';

export const idsQuery = (contratoId: number) =>
  encodeURIComponent(JSON.stringify({ contrato_general_id: contratoId, activo: true }));

export async function listarAmparos(api: APIRequestContext, contratoId = CONTRATO_ID) {
  const res = await api.get(
    `${MID_URL}/amparos-polizas?query=${idsQuery(contratoId)}&limit=0&sortBy=id&orderBy=ASC`
  );
  expect(res.status()).toBe(200);
  return (await res.json()).Data as any[];
}

export async function obtenerPoliza(api: APIRequestContext, contratoId = CONTRATO_ID) {
  const res = await api.get(`${MID_URL}/polizas?query=${idsQuery(contratoId)}&limit=1`);
  expect(res.status()).toBe(200);
  return ((await res.json()).Data as any[])[0] ?? null;
}

export function cuerpoAmparo(amparoId: number, extra: Record<string, unknown> = {}) {
  return {
    contrato_general_id: CONTRATO_ID,
    amparo_id: amparoId,
    tipo_valor_amparo_id: 2,
    suficiencia: 10,
    descripcion: `${PREFIJO}amparo ${amparoId}`,
    ...extra,
  };
}

/** Crea amparos sin póliza (como lo hace el paso Garantías) y devuelve sus ids. */
export async function crearAmparos(api: APIRequestContext, amparoIds: number[]) {
  const res = await api.post(`${MID_URL}/amparos-polizas`, {
    data: amparoIds.map((id) => cuerpoAmparo(id)),
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = await res.json();
  expect(body.Success).toBe(true);
  return (body.Data as any[]).map((a) => a.id as number);
}

/**
 * Falla con un mensaje claro si el contrato sandbox ya tiene datos que no son de
 * las pruebas, para no pisar información real.
 */
export async function exigirContratoLibre(api: APIRequestContext) {
  const poliza = await obtenerPoliza(api);
  const amparos = await listarAmparos(api);
  const ajenos =
    (poliza && !String(poliza.numero_poliza ?? '').startsWith(PREFIJO) ? 1 : 0) +
    amparos.filter((a) => !String(a.descripcion ?? '').startsWith(PREFIJO)).length;
  if (ajenos > 0) {
    throw new Error(
      `El contrato ${CONTRATO_ID} ya tiene póliza o amparos que no son de las pruebas. ` +
        `Defina E2E_CONTRATO_ID con un contrato sin póliza ni amparos.`
    );
  }
}

/** Borrado lógico de todo lo que crearon las pruebas sobre el contrato sandbox. */
export async function limpiarContrato(api: APIRequestContext) {
  for (const amparo of await listarAmparos(api)) {
    if (String(amparo.descripcion ?? '').startsWith(PREFIJO)) {
      await api.delete(`${CRUD_URL}/amparos-polizas/${amparo.id}`);
    }
  }
  const poliza = await obtenerPoliza(api);
  if (poliza && String(poliza.numero_poliza ?? '').startsWith(PREFIJO)) {
    await api.delete(`${CRUD_URL}/polizas/${poliza.id}`);
  }
}
