import { environment } from 'src/environments/environment';

const {
  APROBADO_JEFE,
  EN_REVISION_ORDENADOR,
  REVISADO_ORDENADOR,
  EN_FIRMA_ORDENADOR,
  FIRMADO_ORDENADOR,
  EN_FIRMA_CONTRATISTA,
  FIRMADO_CONTRATISTA,
  FIRMAS_COMPLETAS,
} = environment.ESTADOS_INTERNOS;

/**
 * Estados internos desde "Aprobado por el jefe" en adelante: se muestra la
 * última minuta cargada en el flujo (decisión del 18/11, #405).
 *
 * "En revisión del jefe" no está: la minuta se carga al aprobar o firmar
 * (SubirArchivoComponent) y el rechazo no desactiva las ya cargadas, así que un
 * contrato reenviado tras un rechazo mostraría en esa revisión la minuta de la
 * vuelta anterior. Desde que el jefe aprueba, la cargada es de la vuelta actual.
 */
export const ESTADOS_MINUTA_CARGADA: readonly number[] = [
  APROBADO_JEFE,
  EN_REVISION_ORDENADOR,
  REVISADO_ORDENADOR,
  EN_FIRMA_ORDENADOR,
  FIRMADO_ORDENADOR,
  EN_FIRMA_CONTRATISTA,
  FIRMADO_CONTRATISTA,
  FIRMAS_COMPLETAS,
];

/**
 * true si la minuta se genera siempre con los datos actuales: Borrador,
 * Rechazado, En revisión del jefe y registro nuevo (sin estado, nace en
 * Borrador). Cualquier otro
 * estado que no esté en ESTADOS_MINUTA_CARGADA (por ejemplo Declinado) también
 * genera, por ser lo más conservador.
 */
export function minutaEditable(estadoInterno: number | null | undefined): boolean {
  return !estadoInterno || !ESTADOS_MINUTA_CARGADA.includes(Number(estadoInterno));
}

/**
 * "2026-11-11T10:30:00Z" → "11/11/2026". Toma el día del texto, sin pasarlo
 * por Date: el CRUD guarda la hora de Bogotá y Date podría correr el día.
 */
export function fechaDdMmAaaa(valor: unknown): string | null {
  const texto = String(valor ?? '');
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) return texto;
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : null;
}

/** Texto del origen de la minuta, igual en la revisión y en el modal. */
export function etiquetaOrigenMinuta(origen: 'cargada' | 'generada', fecha?: unknown): string {
  if (origen === 'generada') return 'Minuta generada con los datos actuales, sin firmar';
  const dia = fechaDdMmAaaa(fecha);
  return dia ? `Minuta cargada el ${dia}` : 'Minuta cargada';
}
