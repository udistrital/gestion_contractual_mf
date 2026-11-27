import { environment } from 'src/environments/environment';

/**
 * Máquina de estados del flujo de aprobación de minuta.
 *
 * Cada fila reproduce una fila de las matrices validadas de la documentación
 * (Rectoría, IDEXUD). La máquina termina en FIRMAS_COMPLETAS, que se registra cuando
 * el abogado (a) revisa el contrato firmado por las partes y no requiere modificación.
 * El tramo posterior (registro de la póliza y acta de aprobación) no se incluye.
 * Una transición que no figura en la tabla no está permitida.
 */

const { ESTADOS_INTERNOS: EI, ESTADOS_GENERALES: EG, UNIDADES_EJECUTORAS: UE } = environment;

export const ROLES = {
  ABOGADO_RECTORIA: 'ABOGADO_CONTRATACION_RECTOR',
  JEFE_RECTORIA: 'JEFE_CONTRATACION_RECTOR',
  ABOGADO_IDEXUD: 'ABOGADO_CONTRATACION_IDEXUD',
  JEFE_IDEXUD: 'JEFE_CONTRATACION_IDEXUD',
  ORDENADOR: 'ORDENADOR_DEL_GASTO',
  PROVEEDOR: 'PROVEEDOR',
} as const;

export const EVENTOS = {
  REGISTRAR: 'registrar',
  ENVIAR_A_JEFE: 'enviar-a-jefe',
  DECLINAR: 'declinar',
  APROBAR: 'aprobar',
  RECHAZAR: 'rechazar',
  ENVIAR_A_ORDENADOR: 'enviar-a-ordenador',
  REVISAR: 'revisar',
  FIRMAR: 'firmar',
  ENVIAR_A_CONTRATISTA: 'enviar-a-contratista',
  /** «Sí» del abogado (a) a «¿Requiere alguna modificación?» sobre el contrato firmado. */
  SOLICITAR_AJUSTE: 'solicitar-ajuste',
  /** Paso sin actividad ni actor en el diagrama. */
  AUTOMATICO: 'automatico',
} as const;

export type Evento = (typeof EVENTOS)[keyof typeof EVENTOS];

export interface TransicionEstado {
  /** Estados internos de origen; `null` cuando la transición crea el contrato. */
  origen: Array<number | null>;
  evento: Evento;
  /** Actividad del diagrama BPMN tal como aparece en la matriz. */
  actividad: string;
  /** Roles autorizados. Vacío cuando no hay actor (evento automático). */
  roles: string[];
  destino: number;
  /** Estado general resultante. */
  estadoGeneral: number;
  /** Decisiones pendientes de la documentación que afectan a esta fila. */
  pendiente?: string[];
}

const BORRADOR_O_RECHAZADO = [EI.BORRADOR, EI.RECHAZADO];

const TRANSICIONES_RECTORIA: TransicionEstado[] = [
  {
    origen: [null],
    evento: EVENTOS.REGISTRAR,
    actividad: 'Registrar Contrato por Abogado (a)',
    roles: [ROLES.ABOGADO_RECTORIA],
    destino: EI.BORRADOR,
    estadoGeneral: EG.POR_SUSCRIBIR,
  },
  {
    origen: BORRADOR_O_RECHAZADO,
    evento: EVENTOS.ENVIAR_A_JEFE,
    actividad: 'Contrato Registrado, Enviar Aprobación Jefe Oficina',
    roles: [ROLES.ABOGADO_RECTORIA],
    destino: EI.EN_REVISION_JEFE,
    estadoGeneral: EG.POR_SUSCRIBIR,
  },
  {
    origen: BORRADOR_O_RECHAZADO,
    evento: EVENTOS.DECLINAR,
    actividad: 'Declinar Contrato',
    roles: [ROLES.ABOGADO_RECTORIA],
    destino: EI.DECLINADO,
    estadoGeneral: EG.DECLINADO,
  },
  {
    origen: [EI.EN_REVISION_JEFE],
    evento: EVENTOS.APROBAR,
    actividad: 'Revisar y Aprobar Contrato y documentos',
    roles: [ROLES.JEFE_RECTORIA],
    destino: EI.APROBADO_JEFE,
    estadoGeneral: EG.POR_SUSCRIBIR,
  },
  {
    origen: [EI.EN_REVISION_JEFE],
    evento: EVENTOS.RECHAZAR,
    actividad: 'Revisar y Aprobar Contrato y documentos',
    roles: [ROLES.JEFE_RECTORIA],
    destino: EI.RECHAZADO,
    estadoGeneral: EG.POR_SUSCRIBIR,
  },
  {
    origen: [EI.APROBADO_JEFE],
    evento: EVENTOS.ENVIAR_A_ORDENADOR,
    actividad: 'Enviar Contrato a Ordenador del Gasto',
    roles: [ROLES.JEFE_RECTORIA],
    destino: EI.EN_FIRMA_ORDENADOR,
    estadoGeneral: EG.SUSCRITO,
    pendiente: ['P9'],
  },
  {
    origen: [EI.EN_FIRMA_ORDENADOR],
    evento: EVENTOS.FIRMAR,
    actividad: 'Revisar Contrato · Firmar Contrato por Ordenador del Gasto',
    roles: [ROLES.ORDENADOR],
    destino: EI.FIRMADO_ORDENADOR,
    estadoGeneral: EG.SUSCRITO,
  },
  {
    origen: [EI.EN_FIRMA_ORDENADOR],
    evento: EVENTOS.RECHAZAR,
    actividad: 'Revisar Contrato',
    roles: [ROLES.ORDENADOR],
    destino: EI.RECHAZADO,
    estadoGeneral: EG.POR_SUSCRIBIR,
  },
  {
    origen: [EI.FIRMADO_ORDENADOR],
    evento: EVENTOS.ENVIAR_A_CONTRATISTA,
    actividad: 'Enviar a Contratista',
    roles: [ROLES.ORDENADOR],
    destino: EI.EN_FIRMA_CONTRATISTA,
    estadoGeneral: EG.SUSCRITO,
  },
  {
    origen: [EI.EN_FIRMA_CONTRATISTA],
    evento: EVENTOS.FIRMAR,
    actividad: 'Revisar Contrato · Firmar Contrato y adjuntar póliza',
    roles: [ROLES.PROVEEDOR],
    destino: EI.FIRMADO_CONTRATISTA,
    estadoGeneral: EG.SUSCRITO,
  },
  {
    origen: [EI.EN_FIRMA_CONTRATISTA],
    evento: EVENTOS.RECHAZAR,
    actividad: 'Revisar Contrato',
    roles: [ROLES.PROVEEDOR],
    destino: EI.RECHAZADO,
    estadoGeneral: EG.POR_SUSCRIBIR,
  },
  {
    origen: [EI.FIRMADO_CONTRATISTA],
    evento: EVENTOS.SOLICITAR_AJUSTE,
    actividad: 'Revisar Contrato Firmado por las partes y póliza',
    roles: [ROLES.ABOGADO_RECTORIA],
    destino: EI.EN_AJUSTE_CONTRATISTA,
    estadoGeneral: EG.SUSCRITO,
    pendiente: ['P12'],
  },
  {
    origen: [EI.FIRMADO_CONTRATISTA],
    evento: EVENTOS.APROBAR,
    actividad: 'Revisar Contrato Firmado por las partes y póliza',
    roles: [ROLES.ABOGADO_RECTORIA],
    destino: EI.FIRMAS_COMPLETAS,
    estadoGeneral: EG.SUSCRITO,
  },
  {
    // Actor por definir en la matriz: se restringe al abogado (a) que solicitó el ajuste.
    origen: [EI.EN_AJUSTE_CONTRATISTA],
    evento: EVENTOS.ENVIAR_A_CONTRATISTA,
    actividad: 'Sin actividad definida en el diagrama',
    roles: [ROLES.ABOGADO_RECTORIA],
    destino: EI.EN_FIRMA_CONTRATISTA,
    estadoGeneral: EG.SUSCRITO,
    pendiente: ['P12'],
  },
];

const TRANSICIONES_IDEXUD: TransicionEstado[] = [
];

export const TRANSICIONES: { [unidadEjecutora: number]: TransicionEstado[] } = {
  [UE.RECTORIA]: TRANSICIONES_RECTORIA,
  [UE.IDEXUD]: TRANSICIONES_IDEXUD,
};

/**
 * Devuelve la transición permitida para la unidad ejecutora, el estado interno actual
 * (`null` si el contrato aún no existe), el evento y el rol. Devuelve `null` si no figura
 * en la tabla: en ese caso la transición no está permitida y no debe modificar el estado.
 */
export function resolverTransicion(
  unidadEjecutora: number,
  origen: number | null,
  evento: Evento,
  rol?: string
): TransicionEstado | null {
  const transiciones = TRANSICIONES[unidadEjecutora] ?? [];
  return (
    transiciones.find(
      (t) =>
        t.evento === evento &&
        t.origen.includes(origen) &&
        (t.roles.length === 0 || (rol !== undefined && t.roles.includes(rol)))
    ) ?? null
  );
}
