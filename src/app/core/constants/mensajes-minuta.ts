/**
 * Textos que ve el usuario cuando se genera la minuta (#405). Se cambian aquí
 * cuando la analista defina los definitivos; ningún componente arma estos textos.
 */
export const MENSAJES_MINUTA = {
  parametro: 'No se pudo identificar el contrato.',
  noEncontrado: 'El contrato no existe.',
  sinPlantilla: 'No hay plantilla de minuta para esta unidad y tipo de contrato.',
  faltanDatos: (faltantes: string[]) =>
    faltantes.length
      ? `Faltan datos para generar la minuta: ${faltantes.join(', ')}.`
      : 'Faltan datos para generar la minuta.',
  servicio: (servicio?: string) =>
    servicio
      ? `Un servicio no respondió (${servicio}). Intente de nuevo.`
      : 'Un servicio no respondió. Intente de nuevo.',
  interno: 'No se pudo generar la minuta. Intente de nuevo.',
  invalida: 'La minuta llegó vacía o dañada.',
  conexion: 'No hay conexión con el servicio de minutas. Intente de nuevo.',
  guardadoPrevioFallido:
    'No se pudieron guardar las cláusulas. La minuta no se generó para no mostrar datos desactualizados.',
} as const;

/** Nombre legible de cada faltante que reporta la minuta en el Status 422. */
export const NOMBRES_FALTANTES_MINUTA: Readonly<Record<string, string>> = {
  ordenador: 'ordenador del gasto',
  contratista: 'contratista',
  vigencia: 'vigencia',
  clausulas: 'cláusulas',
};

/** Fragmentos del Message de la minuta que el MF reconoce (no se muestran). */
export const PATRONES_MENSAJE_MINUTA = {
  sinPlantilla: /plantilla no encontrada/i,
  faltantes: /faltan datos:\s*(.*)$/i,
  servicio: /servicio no disponible:\s*([^\s(]+)/i,
} as const;
