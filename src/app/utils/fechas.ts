/**
 * Fecha "YYYY-MM-DD" del CRUD como Date local. `new Date('YYYY-MM-DD')` la toma
 * como UTC y en Bogotá muestra el día anterior.
 */
export function fechaLocal(valor: string | Date | null | undefined): Date | null {
  if (valor instanceof Date) return valor;
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor ?? '');
  if (!partes) return null;
  return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
}
