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

// Misma regla que usa consulta-contrato para decidir la vista por rol
export function rolTablero(roles: string[]): RolTablero | null {
  const esJefe = roles.some(
    (r) => r.includes('JEFE') || r === 'ADMIN_ARGO' || r.includes('ORDENADOR')
  );
  if (esJefe) return 'JEFE';
  if (roles.some((r) => r.includes('ABOGADO'))) return 'ABOGADO';
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

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Algoritmo squarify (Bruls et al.): valores ordenados de mayor a menor
export function squarify(valores: number[], area: Rect): Rect[] {
  const salida: Rect[] = [];
  const r = { ...area };
  let fila: number[] = [];

  const peor = (f: number[], lado: number) => {
    const s = f.reduce((a, b) => a + b, 0);
    const max = Math.max(...f);
    const min = Math.min(...f);
    return Math.max((lado * lado * max) / (s * s), (s * s) / (lado * lado * min));
  };

  const ubicar = (f: number[]) => {
    const s = f.reduce((a, b) => a + b, 0);
    if (r.w >= r.h) {
      const ancho = s / r.h;
      let y = r.y;
      f.forEach((v) => {
        const h = v / ancho;
        salida.push({ x: r.x, y, w: ancho, h });
        y += h;
      });
      r.x += ancho;
      r.w -= ancho;
    } else {
      const alto = s / r.w;
      let x = r.x;
      f.forEach((v) => {
        const w = v / alto;
        salida.push({ x, y: r.y, w, h: alto });
        x += w;
      });
      r.y += alto;
      r.h -= alto;
    }
  };

  let i = 0;
  while (i < valores.length) {
    const lado = Math.min(r.w, r.h);
    const v = valores[i];
    if (!fila.length || peor([...fila, v], lado) <= peor(fila, lado)) {
      fila.push(v);
      i++;
    } else {
      ubicar(fila);
      fila = [];
    }
  }
  if (fila.length) ubicar(fila);
  return salida;
}
