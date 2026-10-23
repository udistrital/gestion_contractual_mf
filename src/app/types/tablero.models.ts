import { environment } from 'src/environments/environment';

export type EstadoClave =
  | 'porSuscribir'
  | 'suscrito'
  | 'legalizado'
  | 'enEjecucion'
  | 'declinado';

export type RolTablero = 'JEFE' | 'ABOGADO';

export interface EstadoTablero {
  clave: EstadoClave;
  id: number;
  nombre: string;
  icono: string;
  descripcion: string;
}

// Orden y textos de las tarjetas de resumen (mockup treemap)
export const ESTADOS_TABLERO: EstadoTablero[] = [
  {
    clave: 'porSuscribir',
    id: environment.ESTADOS_GENERALES.POR_SUSCRIBIR,
    nombre: 'Por suscribir',
    icono: 'edit_note',
    descripcion: 'Pendientes de firma de las partes',
  },
  {
    clave: 'suscrito',
    id: environment.ESTADOS_GENERALES.SUSCRITO,
    nombre: 'Suscrito',
    icono: 'draw',
    descripcion: 'Firmados, pendientes de legalizar',
  },
  {
    clave: 'legalizado',
    id: environment.ESTADOS_GENERALES.LEGALIZADO,
    nombre: 'Legalizado',
    icono: 'verified',
    descripcion: 'Pólizas y RP aprobados',
  },
  {
    clave: 'enEjecucion',
    id: environment.ESTADOS_GENERALES.EN_EJECUCION,
    nombre: 'En ejecución',
    icono: 'play_circle',
    descripcion: 'Con acta de inicio',
  },
  {
    clave: 'declinado',
    id: environment.ESTADOS_GENERALES.DECLINADO,
    nombre: 'Declinado',
    icono: 'cancel',
    descripcion: 'Anulados o rechazados',
  },
];

// Días que puede durar un contrato en un estado antes de generar alerta.
// Por defecto 3; los casos que admiten hasta 5 días se registran en
// DIAS_ALERTA_POR_ESTADO cuando el área los confirme.
export const DIAS_ALERTA_POR_DEFECTO = 3;
export const DIAS_ALERTA_MAXIMO = 5;
export const DIAS_ALERTA_POR_ESTADO: Partial<Record<EstadoClave, number>> = {};

// paso-info-general guardaba el estado inicial con usuario_id fijo en 1,
// por lo que ese id no identifica a ningún abogado.
export const USUARIO_ID_GENERICO = 1;

export interface ContratoTablero {
  id: number;
  numero: string;
  vigencia: string;
  estado: EstadoClave | null;
  diasEnEstado: number;
  fechaFinal: Date | null;
  dependenciaId: number | null;
  dependencia: string;
  abogadoId: number | null;
  abogado: string;
}

export type ConteoEstados = Record<EstadoClave, number> & { total: number };

export interface GrupoContratos extends ConteoEstados {
  clave: string;
  nombre: string;
}

export type TipoAlerta = Exclude<EstadoClave, 'declinado'>;

export interface AlertaContrato {
  tipo: TipoAlerta;
  contrato: ContratoTablero;
  dias: number;
  texto: string;
  prioridad: 'alta' | 'media';
}
