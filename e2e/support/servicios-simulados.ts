import { Route } from '@playwright/test';

/**
 * Simulaciones compartidas por las E2E de contratos (#390) para todo lo que NO es
 * gestion_contractual_crud: core-mf, gestion_contractual_mid y los servicios
 * externos (ordenadores, presupuesto, proveedores, parámetros y cláusulas).
 * Formato de respuesta de develop: {Success, Status, Message, Data}.
 */

/** Stub del core-mf (shell single-spa sin login), el mismo de polizas.e2e.ts. */
export const CORE_MF_STUB = `System.register([], function (_export) {
  return { execute: function () {
    _export({ bootstrap: async function () {}, mount: async function () {}, unmount: async function () {} });
  } };
});`;

export const ORDEN_ID = 6534;
export const PESO_COLOMBIANO_ID = 6634;
export const AMPARO_CUMPLIMIENTO = 6602;
export const AMPARO_CALIDAD = 6605;
export const TIPO_CONTROL_TECNICO = 6611;

export const ok = (Data: unknown, Message = 'Consulta exitosa') => ({ Success: true, Status: 200, Message, Data });

const param = (Id: number, Nombre: string, padre?: number) => ({
  Id,
  Nombre,
  Activo: true,
  ...(padre ? { ParametroPadreId: { Id: padre } } : {}),
});

/** Catálogo de parámetros por tipo, como lo entrega `GET parametros?ids=` del MID. */
export const PARAMETROS: Record<number, unknown[]> = {
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
  119: [param(TIPO_CONTROL_TECNICO, 'Técnico, administrativo y financiero'), param(6612, 'Administrativo y contable')],
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

export const CDP_PRESUPUESTO = {
  vigencia: '2024',
  num_sol_adq: '845',
  numero_disponibilidad: '1234',
  valor_contratacion: 50000000,
  nombre_dependencia: 'FACULTAD DE INGENIERIA',
  descripcion: 'Adquisición de equipos de laboratorio',
  estado: 'EXPEDIDO',
  estadocdp: 'EXPEDIDO',
  rubro: '3-01-001-02-02-01-0001',
  justificacion: 'Justificación del CDP',
  observaciones: 'Actividades del CDP',
};

export const SEDES = [
  { Id: 10, Nombre: 'Sede Calle 40' },
  { Id: 11, Nombre: 'Sede Macarena' },
];
export const DEPENDENCIAS = [
  { id: 20, nombre: 'Facultad de Ingeniería' },
  { id: 21, nombre: 'Oficina Asesora de Tecnologías e Información' },
];

export const SUPERVISOR_MID = {
  nombre: 'CARLOS ANDRÉS RUIZ MORENO',
  cargo: 'Decano',
  documento: '79865432',
  digito_verificacion: '3',
  cargo_id: '45',
  sede_supervisor: 'Sede Calle 40',
  dependencia_supervisor: 'Facultad de Ingeniería',
};

export const PROVEEDOR = {
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

export const CLAUSULAS = [
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

/** Consecutivo fijo que devuelve el MID simulado. */
export const CONSECUTIVO = '27';

/**
 * Responde lo que no es gestion_contractual_crud. `ruta` es el path sin el prefijo
 * `/apioas/`. Devuelve null si la ruta no es de estos servicios.
 */
export function responderServicioExterno(route: Route, ruta: string, query: URLSearchParams): Promise<void> | null {
  const json = (data: unknown, status = 200) => route.fulfill({ status, json: data });
  const metodo = route.request().method();

  // gestion_contractual_mid
  if (ruta === 'gestion_contractual_mid/parametros') {
    const ids = (query.get('ids') ?? '').split(',').map(Number);
    return json(ok(Object.fromEntries(ids.map((id) => [id, PARAMETROS[id] ?? []]))));
  }
  if (ruta === 'gestion_contractual_mid/espacios-fisicos/sedes') return json(ok(SEDES));
  if (/^gestion_contractual_mid\/espacios-fisicos\/dependencias-sede\/\d+$/.test(ruta)) return json(ok(DEPENDENCIAS));
  if (ruta === 'gestion_contractual_mid/contratos-generales/consecutivo' && metodo === 'POST')
    return json(ok(CONSECUTIVO, 'Consecutivo generado'));

  // ordenador_supervisor_mid
  if (ruta === 'ordenador_supervisor_mid/v1/rol-ordenador')
    return json(ok([{ id: 1, rol: 'RECTOR' }, { id: 2, rol: 'VICERRECTOR ADMINISTRATIVO Y FINANCIERO' }]));
  if (ruta === 'ordenador_supervisor_mid/v1/rol-ordenador/actual')
    return json(ok([{ nombre_ordenador: 'GIOVANNI RODRIGO BERMÚDEZ BOHÓRQUEZ', documento: '19456789' }]));
  if (ruta === 'ordenador_supervisor_mid/v1/supervisores/dependencia') return json(ok([SUPERVISOR_MID]));

  // presupuesto_contractual_mid, proveedores_mid
  if (ruta === 'presupuesto_contractual_mid/cdps/numeros-disponibilidad') return json(ok([CDP_PRESUPUESTO]));
  if (ruta === 'presupuesto_contractual_mid/cdps') return json(ok([CDP_PRESUPUESTO]));
  if (ruta === 'proveedores_mid/contratistas') return json(ok(PROVEEDOR, 'Contratista encontrado'));

  // parametros_crud (índices de cláusulas y tipos de amparo)
  if (ruta === 'parametros/v1/parametro') {
    const consulta = query.get('query') ?? '';
    const respuesta = (Data: unknown[]) => ({ Success: true, Status: '200', Message: 'Request successful', Data });
    if (consulta.includes('TipoParametroId:135')) return json(respuesta([{ Id: 1, Nombre: 'PRIMERA' }, { Id: 2, Nombre: 'SEGUNDA' }]));
    if (consulta.includes('TipoParametroId:118'))
      return json(respuesta([{ Id: AMPARO_CUMPLIMIENTO, Nombre: 'Cumplimiento' }, { Id: AMPARO_CALIDAD, Nombre: 'Calidad de los bienes' }]));
    return json(respuesta([]));
  }

  // clausulas_paragrafos_crud (el MF usa el contrato fijo 9512 en develop)
  if (/^clausulas_paragrafos_crud\/contratos\/\d+$/.test(ruta) && metodo === 'GET') return json(ok(CLAUSULAS));

  return null;
}
