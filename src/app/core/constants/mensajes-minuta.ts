/**
 * Textos que ve el usuario cuando se genera la minuta (#405), aprobados por la
 * analista el 18/11. Ningún componente arma estos textos por su cuenta.
 */

/** Falla de un servicio, error inesperado o sin conexión: sin nombres técnicos. */
const FALLA_SERVICIO =
  'No se pudo generar la minuta. Intente en unos minutos; si el problema continúa, contacte a soporte.';

/** Pasos del registro, tal como se ven en el stepper (registro-contrato.component.ts:160-180). */
export const PASOS_REGISTRO = [
  'General y Presupuestal',
  'Solicitante y Supervisor',
  'Estructura y Necesidad',
  'Especificaciones Técnicas',
  'Garantías y Mecanismos de Cobertura del Riesgo',
  'Clausulado y Parágrafos',
] as const;

/** Nombre legible de cada faltante que reporta la minuta en el Status 422. */
export const NOMBRES_FALTANTES_MINUTA: Readonly<Record<string, string>> = {
  ordenador: 'ordenador del gasto',
  contratista: 'contratista',
  vigencia: 'vigencia',
  clausulas: 'cláusulas',
};

/**
 * Paso del registro donde se completa cada faltante:
 * - ordenador: paso-info-presupuestal ("Cargo Ordenador del Gasto"), en "General y Presupuestal";
 * - vigencia: paso-info-general (selector "Vigencia"), en "General y Presupuestal";
 * - contratista: paso-contratistas, en "Solicitante y Supervisor";
 * - clausulas: paso-clausulas-paragrafos, en "Clausulado y Parágrafos".
 * Un faltante que no está aquí no lo llena el usuario en ningún paso.
 */
export const PASOS_FALTANTES_MINUTA: Readonly<Record<string, (typeof PASOS_REGISTRO)[number]>> = {
  ordenador: 'General y Presupuestal',
  vigencia: 'General y Presupuestal',
  contratista: 'Solicitante y Supervisor',
  clausulas: 'Clausulado y Parágrafos',
};

/**
 * "Faltan datos en el paso <paso>: <dato>." agrupado por paso (una oración por
 * paso, en el orden del stepper); "Falta <dato> en el contrato. Contacte a
 * soporte." si el dato no se llena en ningún paso.
 */
function faltanDatos(faltantes: string[]): string {
  if (!faltantes.length) return 'Faltan datos para generar la minuta.';
  const nombre = (f: string) => NOMBRES_FALTANTES_MINUTA[f] ?? f;
  const oraciones = PASOS_REGISTRO.map((paso) => {
    const datos = faltantes.filter((f) => PASOS_FALTANTES_MINUTA[f] === paso).map(nombre);
    return datos.length ? `Faltan datos en el paso ${paso}: ${datos.join(', ')}.` : '';
  });
  const sinPaso = faltantes
    .filter((f) => !PASOS_FALTANTES_MINUTA[f])
    .map((f) => `Falta ${nombre(f)} en el contrato. Contacte a soporte.`);
  return [...oraciones, ...sinPaso].filter(Boolean).join(' ');
}

export const MENSAJES_MINUTA = {
  parametro: 'No se pudo identificar el contrato.',
  noEncontrado: 'El contrato no existe.',
  sinPlantilla: 'No hay plantilla de minuta para esta unidad y tipo de contrato.',
  faltanDatos,
  servicio: FALLA_SERVICIO,
  interno: FALLA_SERVICIO,
  invalida: 'La minuta llegó vacía o dañada.',
  conexion: FALLA_SERVICIO,
  guardadoPrevioFallido:
    'No se pudieron guardar las cláusulas. La minuta no se generó para no mostrar datos desactualizados.',
} as const;

/** Fragmentos del Message de la minuta que el MF reconoce (no se muestran). */
export const PATRONES_MENSAJE_MINUTA = {
  sinPlantilla: /plantilla no encontrada/i,
  faltantes: /faltan datos:\s*(.*)$/i,
  servicio: /servicio no disponible:\s*([^\s(]+)/i,
} as const;
