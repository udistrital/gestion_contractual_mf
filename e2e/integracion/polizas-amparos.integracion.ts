import { test, expect, APIRequestContext, request } from '@playwright/test';
import {
  AMPARO_CALIDAD,
  AMPARO_CUMPLIMIENTO,
  CONTRATO_ID,
  MID_URL,
  PREFIJO,
  crearAmparos,
  cuerpoAmparo,
  exigirContratoLibre,
  idsQuery,
  limpiarContrato,
  listarAmparos,
  obtenerPoliza,
} from '../support/api';

/**
 * Pruebas de integración de #352: verifican el contrato HTTP entre el MF y
 * gestion_contractual_mid con los servicios reales. Desde #360 el MF consume
 * `polizas` y `amparos-polizas` a través del MID, que reenvía a
 * gestion_contractual_crud. Cada prueba arma la misma URL y el mismo cuerpo
 * que `PolizasService`.
 *
 * Las pruebas son secuenciales: comparten el estado del contrato sandbox.
 */
test.describe.configure({ mode: 'serial' });

let api: APIRequestContext;
let amparoIds: number[] = [];
let polizaId: number;

test.beforeAll(async () => {
  api = await request.newContext({ extraHTTPHeaders: { 'Content-Type': 'application/json' } });
  await limpiarContrato(api);
  await exigirContratoLibre(api);
});

test.afterAll(async () => {
  await limpiarContrato(api);
  await api.dispose();
});

test.describe('amparos-polizas (vía gestion_contractual_mid)', () => {
  test('lista vacía para un contrato sin amparos (getAmparosPorContrato)', async () => {
    expect(await listarAmparos(api)).toEqual([]);
  });

  test('POST en lote crea los amparos con poliza_id nulo (postAmparos)', async () => {
    amparoIds = await crearAmparos(api, [AMPARO_CUMPLIMIENTO, AMPARO_CALIDAD]);
    expect(amparoIds).toHaveLength(2);

    const amparos = await listarAmparos(api);
    expect(amparos.map((a) => a.id)).toEqual(amparoIds);
    amparos.forEach((a) => {
      expect(a.poliza_id).toBeNull();
      expect(a.activo).toBe(true);
      expect(a.contrato_general_id).toBe(CONTRATO_ID);
    });
  });

  test('los numéricos llegan como string (por eso el MF usa Number())', async () => {
    const [primero] = await listarAmparos(api);
    expect(typeof primero.suficiencia).toBe('string');
    expect(Number(primero.suficiencia)).toBe(10);
  });

  test('PUT por id actualiza un amparo (putAmparo)', async () => {
    const res = await api.put(`${MID_URL}/amparos-polizas/${amparoIds[0]}`, {
      data: { suficiencia: 25, descripcion: `${PREFIJO}editado` },
    });
    expect(res.status(), await res.text()).toBe(200);

    const editado = (await listarAmparos(api)).find((a) => a.id === amparoIds[0]);
    expect(Number(editado.suficiencia)).toBe(25);
    expect(editado.descripcion).toBe(`${PREFIJO}editado`);
  });

  test('POST sin contrato_general_id responde 400', async () => {
    const { contrato_general_id, ...sinContrato } = cuerpoAmparo(AMPARO_CUMPLIMIENTO);
    const res = await api.post(`${MID_URL}/amparos-polizas`, { data: [sinContrato] });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('polizas (vía gestion_contractual_mid)', () => {
  test('el contrato sandbox aún no tiene póliza (getPolizaPorContrato)', async () => {
    expect(await obtenerPoliza(api)).toBeNull();
  });

  test('POST crea la póliza con fechas ISO 8601 (postPoliza)', async () => {
    const res = await api.post(`${MID_URL}/polizas`, {
      data: {
        contrato_general_id: CONTRATO_ID,
        numero_poliza: `${PREFIJO}POL-1`,
        entidad_aseguradora_id: 1,
        descripcion: 'Póliza creada por pruebas de integración',
        fecha_inicio: new Date('2026-01-15').toISOString(),
        fecha_fin: new Date('2026-12-15').toISOString(),
        fecha_expedicion: new Date('2026-01-10').toISOString(),
        fecha_aprobacion: new Date('2026-01-12').toISOString(),
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    polizaId = (await res.json()).Data.id;
    expect(polizaId).toBeGreaterThan(0);

    const poliza = await obtenerPoliza(api);
    expect(poliza.id).toBe(polizaId);
    expect(poliza.numero_poliza).toBe(`${PREFIJO}POL-1`);
  });

  test('PUT actualiza la póliza en lugar de duplicarla (putPoliza)', async () => {
    const res = await api.put(`${MID_URL}/polizas/${polizaId}`, {
      data: { descripcion: 'Póliza editada' },
    });
    expect(res.status(), await res.text()).toBe(200);

    const lista = await api.get(
      `${MID_URL}/polizas?query=${idsQuery(CONTRATO_ID)}&limit=0`
    );
    const activas = (await lista.json()).Data as any[];
    expect(activas).toHaveLength(1);
    expect(activas[0].descripcion).toBe('Póliza editada');
  });

  test('POST con fecha no ISO responde 400', async () => {
    const res = await api.post(`${MID_URL}/polizas`, {
      data: { contrato_general_id: CONTRATO_ID, numero_poliza: `${PREFIJO}X`, fecha_fin: '15/12/2026' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('vinculación amparo ↔ póliza (registrarAmparos)', () => {
  test('PUT con poliza_id, valor y fechas vincula el amparo', async () => {
    const res = await api.put(`${MID_URL}/amparos-polizas/${amparoIds[0]}`, {
      data: {
        poliza_id: polizaId,
        valor: 17000000,
        fecha_inicio: new Date('2026-01-15').toISOString(),
        fecha_fin: new Date('2026-12-15').toISOString(),
      },
    });
    expect(res.status(), await res.text()).toBe(200);

    const vinculado = (await listarAmparos(api)).find((a) => a.id === amparoIds[0]);
    expect(vinculado.poliza_id).toBe(polizaId);
    expect(Number(vinculado.valor)).toBe(17000000);
    expect(vinculado.fecha_fin).toContain('2026-12-15');
  });

  test('PUT con poliza_id de otro contrato responde 400', async () => {
    const otraPoliza = 1; // póliza del contrato 1, distinto del sandbox
    const res = await api.put(`${MID_URL}/amparos-polizas/${amparoIds[1]}`, {
      data: { poliza_id: otraPoliza },
    });
    expect(res.status()).toBe(400);
    const sinCambio = (await listarAmparos(api)).find((a) => a.id === amparoIds[1]);
    expect(sinCambio.poliza_id).toBeNull();
  });

  test('PUT con poliza_id null desvincula el amparo', async () => {
    const res = await api.put(`${MID_URL}/amparos-polizas/${amparoIds[0]}`, {
      data: { poliza_id: null },
    });
    expect(res.status(), await res.text()).toBe(200);
    const libre = (await listarAmparos(api)).find((a) => a.id === amparoIds[0]);
    expect(libre.poliza_id).toBeNull();
  });
});

test.describe('amparos-contratos (gestion_contractual_mid)', () => {
  test('devuelve amparos con nombre resuelto y poliza_id (getAmparosContratoMid)', async () => {
    await api.put(`${MID_URL}/amparos-polizas/${amparoIds[0]}`, { data: { poliza_id: polizaId } });

    const res = await api.get(`${MID_URL}/amparos-contratos/${CONTRATO_ID}`);
    expect(res.status(), await res.text()).toBe(200);
    const body = await res.json();
    expect(body.Success).toBe(true);

    const filas = body.Data as any[];
    expect(filas.map((f) => f.id).sort()).toEqual([...amparoIds].sort());
    expect(filas.find((f) => f.id === amparoIds[0]).poliza_id).toBe(polizaId);
    expect(filas.some((f) => !!f.poliza_id)).toBe(true); // lo que usa `tienePoliza`
    filas.forEach((f) => expect(typeof f.amparo).toBe('string'));
  });
});

test.describe('borrado lógico (deleteAmparo)', () => {
  test('DELETE oculta el amparo del listado activo', async () => {
    const res = await api.delete(`${MID_URL}/amparos-polizas/${amparoIds[1]}`);
    expect(res.status(), await res.text()).toBe(200);

    const ids = (await listarAmparos(api)).map((a) => a.id);
    expect(ids).toContain(amparoIds[0]);
    expect(ids).not.toContain(amparoIds[1]);
  });
});
