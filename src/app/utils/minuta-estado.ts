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
 * última minuta cargada en el flujo (decisión del 18/11, #405).
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
