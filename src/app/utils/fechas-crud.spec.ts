import { aFechaCrud, desdeFechaCrud } from './fechas-crud';

describe('fechas del CRUD', () => {
  it('envía el día local aunque en UTC ya sea el día siguiente', () => {
    expect(aFechaCrud(new Date(2026, 9, 31, 23, 30))).toBe('2026-10-31T00:00:00Z');
    expect(aFechaCrud(new Date(2026, 0, 5, 0, 10))).toBe('2026-01-05T00:00:00Z');
  });

  it('un texto YYYY-MM-DD conserva el día, sin pasar por Date', () => {
    expect(aFechaCrud('2026-11-05')).toBe('2026-11-05T00:00:00Z');
    expect(aFechaCrud('2026-01-01')).toBe('2026-01-01T00:00:00Z');
  });

  it('lee la medianoche UTC del CRUD como el mismo día local', () => {
    const valor = desdeFechaCrud('2026-10-31T00:00:00Z');
    expect(valor).toBe('2026-10-31T12:00:00');
    expect(new Date(valor).getDate()).toBe(31);
  });

  it('una fecha leída del CRUD se envía de vuelta con el mismo día', () => {
    expect(aFechaCrud(desdeFechaCrud('2026-10-31T00:00:00Z'))).toBe('2026-10-31T00:00:00Z');
  });

  it('la fecha nula queda vacía', () => {
    expect(desdeFechaCrud(null)).toBe('');
    expect(desdeFechaCrud(undefined)).toBe('');
  });
});
