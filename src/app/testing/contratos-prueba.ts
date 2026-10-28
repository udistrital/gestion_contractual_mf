import { ContratoTablero } from '../types/tablero.models';

export function contratoPrueba(parcial: Partial<ContratoTablero> = {}): ContratoTablero {
  return {
    id: 1,
    numero: 'CPS-2026-0001',
    vigencia: '2026',
    estado: 'porSuscribir',
    diasEnEstado: 0,
    fechaFinal: null,
    dependenciaId: 10,
    dependencia: 'Vicerrectoría Administrativa',
    abogadoId: 500,
    abogado: 'Diana Rojas',
    ...parcial,
  };
}
