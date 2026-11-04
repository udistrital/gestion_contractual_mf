/**
 * Las columnas date del CRUD Beego guardan el día UTC de lo que reciben y lo
 * devuelven como medianoche UTC. Estas funciones conservan el día local.
 */

/** Día local de la fecha, en el formato RFC3339 que exige el CRUD. */
export function aFechaCrud(fecha: Date | string): string {
  const local = new Date(fecha);
  const mes = String(local.getMonth() + 1).padStart(2, '0');
  const dia = String(local.getDate()).padStart(2, '0');
  return `${local.getFullYear()}-${mes}-${dia}T00:00:00Z`;
}

/** Fecha del CRUD como día local para los formularios; '' si está vacía. */
export function desdeFechaCrud(valor: unknown): string {
  const dia = String(valor ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return '';
  return `${dia}T12:00:00`;
}
