import { contratoPrueba } from '../testing/contratos-prueba';
import { DIAS_ALERTA_POR_ESTADO } from '../types/tablero.models';
import {
  agruparPor,
  alertaDe,
  calcularAlertas,
  contarPorEstado,
  diasAlerta,
  diasEntre,
  estadoPorId,
  porcentaje,
  rolTablero,
  squarify,
} from './tablero.utils';

describe('tablero.utils', () => {
  const hoy = new Date(2026, 9, 20);

  it('calcula días calendario entre dos fechas', () => {
    expect(diasEntre(new Date(2026, 9, 17, 23, 0), hoy)).toBe(3);
    expect(diasEntre(hoy, new Date(2026, 9, 22))).toBe(2);
  });

  it('traduce los ids de estado general del CRUD', () => {
    expect(estadoPorId(6773)).toBe('porSuscribir');
    expect(estadoPorId(6777)).toBe('enEjecucion');
    expect(estadoPorId(9999)).toBeNull();
    expect(estadoPorId(null)).toBeNull();
  });

  it('usa 3 días por defecto para las alertas sin pasar de 5', () => {
    expect(diasAlerta('porSuscribir')).toBe(3);
    expect(diasAlerta('legalizado')).toBe(3);
  });

  it('decide la vista del tablero según los roles', () => {
    expect(rolTablero(['JEFE_CONTRATACION_RECTOR'])).toBe('JEFE');
    expect(rolTablero(['ADMIN_ARGO'])).toBe('JEFE');
    expect(rolTablero(['ABOGADO_CONTRATACION_IDEXUD'])).toBe('ABOGADO');
    expect(rolTablero(['ABOGADO_CONTRATACION_RECTOR', 'JEFE_CONTRATACION_RECTOR'])).toBe('JEFE');
    expect(rolTablero(['PROVEEDOR'])).toBeNull();
  });

  it('cuenta contratos por estado e ignora los que no tienen estado', () => {
    const conteo = contarPorEstado([
      contratoPrueba({ estado: 'porSuscribir' }),
      contratoPrueba({ estado: 'suscrito' }),
      contratoPrueba({ estado: 'suscrito' }),
      contratoPrueba({ estado: null }),
    ]);
    expect(conteo.total).toBe(3);
    expect(conteo.suscrito).toBe(2);
    expect(conteo.declinado).toBe(0);
    expect(porcentaje(conteo.suscrito, conteo.total)).toBe(67);
    expect(porcentaje(1, 0)).toBe(0);
  });

  it('agrupa y ordena de mayor a menor', () => {
    const grupos = agruparPor(
      [
        contratoPrueba({ dependenciaId: 1, dependencia: 'A' }),
        contratoPrueba({ dependenciaId: 2, dependencia: 'B', estado: 'legalizado' }),
        contratoPrueba({ dependenciaId: 2, dependencia: 'B' }),
      ],
      (c) => String(c.dependenciaId),
      (c) => c.dependencia
    );
    expect(grupos.map((g) => g.nombre)).toEqual(['B', 'A']);
    expect(grupos[0].legalizado).toBe(1);
    expect(grupos[0].total).toBe(2);
  });

  describe('alertas', () => {
    it('escribe «día» en singular cuando un estado tiene un umbral menor', () => {
      const estados = ['porSuscribir', 'suscrito', 'legalizado'] as const;
      estados.forEach((e) => (DIAS_ALERTA_POR_ESTADO[e] = 0));
      try {
        expect(estados.map((estado) => alertaDe(contratoPrueba({ estado, diasEnEstado: 1 }), hoy)?.texto)).toEqual([
          'Por suscribir hace 1 día',
          'Suscrito hace 1 día, sin legalizar',
          'Legalizado hace 1 día, sin acta de inicio',
        ]);
      } finally {
        estados.forEach((e) => delete DIAS_ALERTA_POR_ESTADO[e]);
      }
    });

    it('alerta un contrato con más de 3 días en el estado', () => {
      expect(alertaDe(contratoPrueba({ diasEnEstado: 3 }), hoy)).toBeNull();
      const alerta = alertaDe(contratoPrueba({ diasEnEstado: 4 }), hoy)!;
      expect(alerta.tipo).toBe('porSuscribir');
      expect(alerta.prioridad).toBe('media');
      expect(alerta.texto).toBe('Por suscribir hace 4 días');
    });

    it('marca prioridad alta cuando supera el máximo de 5 días', () => {
      const alerta = alertaDe(contratoPrueba({ estado: 'suscrito', diasEnEstado: 6 }), hoy)!;
      expect(alerta.prioridad).toBe('alta');
      expect(alerta.texto).toContain('sin legalizar');
    });

    it('con exactamente 5 días la prioridad sigue siendo media', () => {
      expect(alertaDe(contratoPrueba({ diasEnEstado: 5 }), hoy)!.prioridad).toBe('media');
    });

    it('alerta los contratos en ejecución que vencen dentro del umbral', () => {
      const vence = (fecha: Date | null) =>
        alertaDe(contratoPrueba({ estado: 'enEjecucion', fechaFinal: fecha, diasEnEstado: 40 }), hoy);
      expect(vence(null)).toBeNull();
      expect(vence(new Date(2026, 9, 30))).toBeNull();
      expect(vence(new Date(2026, 9, 1))).toBeNull();
      expect(vence(new Date(2026, 9, 22))!.texto).toBe('Vence en 2 días');
      expect(vence(new Date(2026, 9, 20))!.prioridad).toBe('alta');
      expect(vence(new Date(2026, 9, 21))!.texto).toBe('Vence en 1 día');
    });

    it('en ejecución alerta hasta 3 días antes de vencer, con prioridad media', () => {
      const vence = (fecha: Date) =>
        alertaDe(contratoPrueba({ estado: 'enEjecucion', fechaFinal: fecha }), hoy);
      const alerta = vence(new Date(2026, 9, 23))!;
      expect(alerta.prioridad).toBe('media');
      expect(alerta.texto).toBe('Vence en 3 días');
      expect(vence(new Date(2026, 9, 24))).toBeNull();
    });

    it('no alerta contratos declinados', () => {
      expect(alertaDe(contratoPrueba({ estado: 'declinado', diasEnEstado: 30 }), hoy)).toBeNull();
    });

    it('ordena primero las de prioridad alta y las más urgentes', () => {
      const alertas = calcularAlertas(
        [
          contratoPrueba({ id: 1, diasEnEstado: 4 }),
          contratoPrueba({ id: 2, diasEnEstado: 9 }),
          contratoPrueba({ id: 3, diasEnEstado: 5 }),
          contratoPrueba({ id: 4, diasEnEstado: 1 }),
        ],
        hoy
      );
      expect(alertas.map((a) => a.contrato.id)).toEqual([2, 3, 1]);
    });
  });

  it('squarify reparte toda el área proporcionalmente', () => {
    const area = { x: 0, y: 0, w: 100, h: 50 };
    const rects = squarify([2500, 1500, 1000], area);
    expect(rects).toHaveLength(3);
    const suma = rects.reduce((s, r) => s + r.w * r.h, 0);
    expect(suma).toBeCloseTo(5000);
    expect(rects[0].w * rects[0].h).toBeCloseTo(2500);
    rects.forEach((r) => {
      expect(r.x + r.w).toBeLessThanOrEqual(100.0001);
      expect(r.y + r.h).toBeLessThanOrEqual(50.0001);
    });
  });

  it('agruparPor ignora los contratos sin estado', () => {
    const grupos = agruparPor([{ ...contratoPrueba(), estado: null }], (c) => String(c.dependenciaId), (c) => c.dependencia);
    expect(grupos).toEqual([]);
  });

  it('squarify sin valores no devuelve rectángulos', () => {
    expect(squarify([], { x: 0, y: 0, w: 100, h: 50 })).toEqual([]);
  });
});
