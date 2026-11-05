import { fechaLocal } from './fechas';

describe('fechaLocal', () => {
  it('conserva el día de "YYYY-MM-DD" en la zona horaria local', () => {
    const fecha = fechaLocal('2026-11-05') as Date;
    expect([fecha.getFullYear(), fecha.getMonth(), fecha.getDate()]).toEqual([2026, 10, 5]);
    expect(fecha.getHours()).toBe(0);
  });

  it('conserva el día si la fecha llega con hora', () => {
    expect(fechaLocal('2026-01-01T00:00:00Z')?.getDate()).toBe(1);
  });

  it('deja igual un valor que ya es Date', () => {
    const fecha = new Date(2026, 10, 5);
    expect(fechaLocal(fecha)).toBe(fecha);
  });

  it('devuelve null si no hay fecha válida', () => {
    expect(fechaLocal(null)).toBeNull();
    expect(fechaLocal(undefined)).toBeNull();
    expect(fechaLocal('')).toBeNull();
    expect(fechaLocal('sin fecha')).toBeNull();
  });
});
