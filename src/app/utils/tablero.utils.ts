import {
  AlertaContrato,
  ContratoTablero,
  ConteoEstados,
  DIAS_ALERTA_MAXIMO,
  DIAS_ALERTA_POR_DEFECTO,
  DIAS_ALERTA_POR_ESTADO,
  ESTADOS_TABLERO,
  EstadoClave,
  GrupoContratos,
  RolTablero,
  TipoAlerta,
} from '../types/tablero.models';

const MS_DIA = 24 * 60 * 60 * 1000;

export function diasEntre(desde: Date, hasta: Date): number {
  const a = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((b - a) / MS_DIA);
}

export function estadoPorId(id: number | null | undefined): EstadoClave | null {
  return ESTADOS_TABLERO.find((e) => e.id === Number(id))?.clave ?? null;
}

export function diasAlerta(estado: EstadoClave): number {
  return Math.min(
    DIAS_ALERTA_POR_ESTADO[estado] ?? DIAS_ALERTA_POR_DEFECTO,
    DIAS_ALERTA_MAXIMO
  );
}

// El tablero de inicio es solo para el jefe de contratación (todos los contratos)
// y el abogado (los propios). Cualquier otro rol no ve el tablero.
export function rolTablero(roles: string[]): RolTablero | null {
  if (roles.some((r) => r.startsWith('JEFE_CONTRATACION'))) return 'JEFE';
  if (roles.some((r) => r.startsWith('ABOGADO_CONTRATACION'))) return 'ABOGADO';
  return null;
}

export function conteoVacio(): ConteoEstados {
  return {
    total: 0,
    porSuscribir: 0,
    suscrito: 0,
    legalizado: 0,
    enEjecucion: 0,
    declinado: 0,
  };
}

export function contarPorEstado(contratos: ContratoTablero[]): ConteoEstados {
  const conteo = conteoVacio();
  contratos.forEach((c) => {
    if (!c.estado) return;
    conteo.total++;
    conteo[c.estado]++;
  });
  return conteo;
}

export function agruparPor(
  contratos: ContratoTablero[],
  clave: (c: ContratoTablero) => string,
  nombre: (c: ContratoTablero) => string
): GrupoContratos[] {
  const grupos = new Map<string, GrupoContratos>();
  contratos.forEach((c) => {
    if (!c.estado) return;
    const k = clave(c);
    if (!grupos.has(k)) {
      grupos.set(k, { clave: k, nombre: nombre(c), ...conteoVacio() });
    }
    const g = grupos.get(k)!;
    g.total++;
    g[c.estado]++;
  });
  return [...grupos.values()].sort((a, b) => b.total - a.total);
}

export function porcentaje(parte: number, total: number): number {
  return total ? Math.round((parte / total) * 100) : 0;
}

const TEXTOS_ALERTA: Record<TipoAlerta, (dias: number) => string> = {
  porSuscribir: (d) => `Por suscribir hace ${d} ${d === 1 ? 'día' : 'días'}`,
  suscrito: (d) => `Suscrito hace ${d} ${d === 1 ? 'día' : 'días'}, sin legalizar`,
  legalizado: (d) =>
    `Legalizado hace ${d} ${d === 1 ? 'día' : 'días'}, sin acta de inicio`,
  enEjecucion: (d) =>
    d === 0 ? 'Vence hoy' : `Vence en ${d} ${d === 1 ? 'día' : 'días'}`,
};

export function alertaDe(
  c: ContratoTablero,
  hoy: Date
): AlertaContrato | null {
  if (!c.estado || c.estado === 'declinado') return null;
  const umbral = diasAlerta(c.estado);

  if (c.estado === 'enEjecucion') {
    if (!c.fechaFinal) return null;
    const restantes = diasEntre(hoy, c.fechaFinal);
    if (restantes < 0 || restantes > umbral) return null;
    return {
      tipo: 'enEjecucion',
      contrato: c,
      dias: restantes,
      texto: TEXTOS_ALERTA.enEjecucion(restantes),
      prioridad: restantes <= 1 ? 'alta' : 'media',
    };
  }

  if (c.diasEnEstado <= umbral) return null;
  return {
    tipo: c.estado,
    contrato: c,
    dias: c.diasEnEstado,
    texto: TEXTOS_ALERTA[c.estado](c.diasEnEstado),
    prioridad: c.diasEnEstado > DIAS_ALERTA_MAXIMO ? 'alta' : 'media',
  };
}

// Más urgente primero: más días detenido, o menos días para vencer
const urgencia = (a: AlertaContrato) =>
  a.tipo === 'enEjecucion' ? DIAS_ALERTA_MAXIMO - a.dias : a.dias;

export function calcularAlertas(
  contratos: ContratoTablero[],
  hoy: Date
): AlertaContrato[] {
  return contratos
    .map((c) => alertaDe(c, hoy))
    .filter((a): a is AlertaContrato => a !== null)
    .sort(
      (a, b) =>
        Number(b.prioridad === 'alta') - Number(a.prioridad === 'alta') ||
        urgencia(b) - urgencia(a)
    );
}
