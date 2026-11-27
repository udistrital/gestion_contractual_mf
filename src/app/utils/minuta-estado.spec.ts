import { environment } from 'src/environments/environment';
import { etiquetaOrigenMinuta, fechaDdMmAaaa, minutaEditable } from './minuta-estado';

const E = environment.ESTADOS_INTERNOS;

describe('minutaEditable (regla del 18/11 y revisión del PR)', () => {
  it.each<[string, number | null | undefined]>([
    ['Borrador', E.BORRADOR],
    ['Rechazado', E.RECHAZADO],
    ['sin estado (0)', 0],
    ['sin estado (null)', null],
    ['sin estado (undefined)', undefined],
    ['Declinado (no cubierto: lo más conservador)', E.DECLINADO],
    ['estado desconocido', 999999],
  ])('%s → se genera con los datos actuales', (_caso, estado) => {
    expect(minutaEditable(estado)).toBe(true);
  });

  it.each<[string, number]>([
    ['En revisión del jefe (la minuta vigente del envío)', E.EN_REVISION_JEFE],
    ['Aprobado por el jefe', E.APROBADO_JEFE],
    ['En revisión del ordenador (IDEXUD)', E.EN_REVISION_ORDENADOR],
    ['Revisado por el ordenador (IDEXUD)', E.REVISADO_ORDENADOR],
    ['En firma del ordenador', E.EN_FIRMA_ORDENADOR],
    ['Firmado por el ordenador', E.FIRMADO_ORDENADOR],
    ['En firma del contratista', E.EN_FIRMA_CONTRATISTA],
    ['Firmado por el contratista', E.FIRMADO_CONTRATISTA],
    ['Firmas completas', E.FIRMAS_COMPLETAS],
  ])('%s → se muestra la minuta cargada', (_caso, estado) => {
    expect(minutaEditable(estado)).toBe(false);
  });

  it('cubre todos los estados internos del environment', () => {
    const cubiertos = [
      E.BORRADOR, E.RECHAZADO, E.DECLINADO, E.EN_REVISION_JEFE, E.APROBADO_JEFE, E.EN_REVISION_ORDENADOR,
      E.REVISADO_ORDENADOR, E.EN_FIRMA_ORDENADOR, E.FIRMADO_ORDENADOR, E.EN_FIRMA_CONTRATISTA,
      E.FIRMADO_CONTRATISTA, E.FIRMAS_COMPLETAS,
    ];
    expect(new Set(Object.values(E))).toEqual(new Set(cubiertos));
  });
});

describe('etiqueta de origen de la minuta', () => {
  it('fecha del CRUD o ya formateada → dd/mm/aaaa', () => {
    expect(fechaDdMmAaaa('2026-11-10T22:15:00Z')).toBe('10/11/2026');
    expect(fechaDdMmAaaa('10/11/2026')).toBe('10/11/2026');
    expect(fechaDdMmAaaa(undefined)).toBeNull();
  });

  it('generada, cargada con fecha y cargada sin fecha', () => {
    expect(etiquetaOrigenMinuta('generada')).toBe('Minuta generada con los datos actuales, sin firmar');
    expect(etiquetaOrigenMinuta('cargada', '2026-11-10T22:15:00Z')).toBe('Minuta cargada el 10/11/2026');
    expect(etiquetaOrigenMinuta('cargada')).toBe('Minuta cargada');
  });
});
