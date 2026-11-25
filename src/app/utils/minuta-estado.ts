import { environment } from 'src/environments/environment';

const {
  EN_REVISION_JEFE,
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
 * Estados internos desde "En revisión del jefe" en adelante: se muestra la
 * última minuta cargada en el flujo (decisión del 18/11 y del líder técnico en
 * la revisión del PR, #405).
 *
 * En "En revisión del jefe" la cargada es la de la vuelta actual: al enviar al
 * jefe (también al reenviar tras un rechazo) se genera y registra la minuta
 * vigente y se desactivan las anteriores (MinutaDocumentoService.registrarMinutaVigente).
 */
export const ESTADOS_MINUTA_CARGADA: readonly number[] = [
  EN_REVISION_JEFE,
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
 * Rechazado y registro nuevo (sin estado, nace en Borrador). Cualquier otro
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
