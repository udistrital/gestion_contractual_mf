// SOLO PARA DEMOS: contratos ficticios del tablero. Se activa con USAR_DATOS_SIMULADOS (./config.ts).
import { ContratoTablero, EstadoClave } from '../types/tablero.models';

const DEPENDENCIAS = [
  'Vicerrectoría Administrativa',
  'Facultad de Ingeniería',
  'Oficina Asesora de Sistemas',
  'Facultad de Ciencias y Educación',
  'Rectoría',
  'IDEXUD',
  'Biblioteca',
  'Bienestar Institucional',
];

// Contratos por dependencia (suman 48) para que el treemap muestre tamaños distintos
const PESOS = [15, 10, 8, 6, 4, 3, 1, 1];
const REPARTO = PESOS.flatMap((peso, dep) => Array<number>(peso).fill(dep));

const ABOGADOS = ['Diana Rojas', 'Carlos Pérez', 'Laura Gómez', 'Andrés Martínez'];

// estado, días en el estado (o días para vencer si está en ejecución)
const CASOS: Array<[EstadoClave, number]> = [
  ['porSuscribir', 1], ['porSuscribir', 4], ['porSuscribir', 7], ['porSuscribir', 2],
  ['suscrito', 0], ['suscrito', 5], ['suscrito', 9], ['legalizado', 2],
  ['legalizado', 6], ['enEjecucion', 1], ['enEjecucion', 3], ['enEjecucion', 30],
  ['enEjecucion', 90], ['declinado', 12], ['porSuscribir', 3], ['suscrito', 1],
];

export function contratosSimulados(
  vigencia: string,
  miId: number | null,
  hoy: Date = new Date()
): ContratoTablero[] {
  const contratos: ContratoTablero[] = [];
  for (let i = 0; i < 48; i++) {
    const [estado, dias] = CASOS[i % CASOS.length];
    const vig = i % 4 === 3 ? String(hoy.getFullYear() - 1) : String(hoy.getFullYear());
    const dep = REPARTO[(i * 7) % REPARTO.length];
    // Uno de cada tres queda a tu nombre para ver la vista de abogado
    const mio = miId !== null && i % 3 === 0;
    const abogado = i % ABOGADOS.length;
    const fechaFinal = estado === 'enEjecucion' ? new Date(hoy.getTime() + dias * 86400000) : null;
    contratos.push({
      id: 1000 + i,
      numero: `CPS-${vig}-${String(i + 1).padStart(4, '0')}`,
      vigencia: vig,
      estado,
      diasEnEstado: estado === 'enEjecucion' ? 20 : dias,
      fechaFinal,
      dependenciaId: dep + 1,
      dependencia: DEPENDENCIAS[dep],
      abogadoId: mio ? miId : 900 + abogado,
      abogado: mio ? 'Yo (simulado)' : ABOGADOS[abogado],
    });
  }
  return vigencia ? contratos.filter((c) => c.vigencia === vigencia) : contratos;
}
