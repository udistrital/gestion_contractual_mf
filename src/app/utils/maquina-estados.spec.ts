import { environment } from 'src/environments/environment';
import { flujoEstados } from './rolesEstados';
import {
  EVENTOS,
  Evento,
  ROLES,
  TRANSICIONES,
  TransicionEstado,
  resolverTransicion,
} from './maquina-estados';

const { ESTADOS_INTERNOS: EI, ESTADOS_GENERALES: EG, UNIDADES_EJECUTORAS: UE } = environment;

const UNIDADES = [
  {
    nombre: 'Rectoría',
    id: UE.RECTORIA,
    filas: 14,
    abogado: ROLES.ABOGADO_RECTORIA,
    ultimaFirma: EI.FIRMADO_CONTRATISTA,
  },
  {
    nombre: 'IDEXUD',
    id: UE.IDEXUD,
    filas: 16,
    abogado: ROLES.ABOGADO_IDEXUD,
    ultimaFirma: EI.FIRMADO_ORDENADOR,
  },
];

const TODOS_LOS_ESTADOS: Array<number | null> = [null, ...Object.values(EI)];
const TODOS_LOS_EVENTOS = Object.values(EVENTOS) as Evento[];
const TODOS_LOS_ROLES = [...Object.values(ROLES), 'ADMIN_ARGO'];

const claveDe = (origen: number | null, evento: string, rol?: string) =>
  `${origen}|${evento}|${rol ?? ''}`;

/** Combinaciones (origen, evento, rol) que la tabla permite. */
function permitidas(transiciones: TransicionEstado[]): Set<string> {
  const claves = new Set<string>();
  transiciones.forEach((t) =>
    t.origen.forEach((origen) =>
      t.roles.length === 0
        ? TODOS_LOS_ROLES.forEach((rol) => claves.add(claveDe(origen, t.evento, rol)))
        : t.roles.forEach((rol) => claves.add(claveDe(origen, t.evento, rol)))
    )
  );
  return claves;
}

describe('maquina-estados', () => {
  UNIDADES.forEach(({ nombre, id, filas }) => {
    describe(nombre, () => {
      const transiciones = TRANSICIONES[id];

      it(`define las ${filas} transiciones de la matriz`, () => {
        expect(transiciones).toHaveLength(filas);
      });

      it('resuelve cada fila de la matriz para sus roles y estados de origen', () => {
        transiciones.forEach((t) => {
          t.origen.forEach((origen) => {
            const roles = t.roles.length ? t.roles : [undefined];
            roles.forEach((rol) => {
              expect(resolverTransicion(id, origen, t.evento, rol)).toBe(t);
            });
          });
        });
      });

      it('rechaza toda combinación de estado, evento y rol que no figura en la matriz', () => {
        const validas = permitidas(transiciones);
        TODOS_LOS_ESTADOS.forEach((origen) =>
          TODOS_LOS_EVENTOS.forEach((evento) =>
            TODOS_LOS_ROLES.forEach((rol) => {
              const resultado = resolverTransicion(id, origen, evento, rol);
              if (validas.has(claveDe(origen, evento, rol))) {
                expect(resultado).not.toBeNull();
              } else {
                expect(resultado).toBeNull();
              }
            })
          )
        );
      });

      it('exige un rol cuando la transición tiene actor', () => {
        expect(resolverTransicion(id, EI.EN_REVISION_JEFE, EVENTOS.APROBAR)).toBeNull();
      });

      it('solo crea el contrato en BORRADOR desde un estado inicial vacío', () => {
        const creacion = transiciones.filter((t) => t.origen.includes(null));
        expect(creacion.map((t) => t.destino)).toEqual([EI.BORRADOR]);
      });

      it('no tiene transiciones de salida desde los estados finales', () => {
        [EI.FIRMAS_COMPLETAS, EI.DECLINADO].forEach((final) => {
          expect(transiciones.filter((t) => t.origen.includes(final))).toEqual([]);
        });
      });

      it('trata de forma explícita todos los estados del catálogo que aplican a la unidad', () => {
        const usados = new Set<number>();
        transiciones.forEach((t) => {
          usados.add(t.destino);
          t.origen.forEach((o) => o !== null && usados.add(o));
        });
        const soloIdexud = [EI.EN_REVISION_ORDENADOR, EI.REVISADO_ORDENADOR];
        const esperados = Object.values(EI).filter(
          (estado) => id === UE.IDEXUD || !soloIdexud.includes(estado)
        );
        expect([...usados].sort()).toEqual([...esperados].sort());
      });
    });
  });

  describe('revisión del contrato firmado por el abogado (a)', () => {
    UNIDADES.forEach(({ nombre, id, abogado, ultimaFirma }) => {
      it(`${nombre}: solo el «No» del abogado (a) tras la última firma registra FIRMAS_COMPLETAS`, () => {
        const hacia = TRANSICIONES[id].filter((t) => t.destino === EI.FIRMAS_COMPLETAS);
        expect(hacia).toHaveLength(1);
        expect(hacia[0]).toMatchObject({
          origen: [ultimaFirma],
          evento: EVENTOS.APROBAR,
          roles: [abogado],
        });
      });

      it(`${nombre}: el «Sí» del abogado (a) pasa por EN_AJUSTE_CONTRATISTA y vuelve a la firma del contratista`, () => {
        const ajuste = resolverTransicion(id, ultimaFirma, EVENTOS.SOLICITAR_AJUSTE, abogado);
        expect(ajuste).toMatchObject({
          destino: EI.EN_AJUSTE_CONTRATISTA,
          estadoGeneral: EG.SUSCRITO,
        });
        expect(
          resolverTransicion(id, EI.EN_AJUSTE_CONTRATISTA, EVENTOS.ENVIAR_A_CONTRATISTA, abogado)
            ?.destino
        ).toBe(EI.EN_FIRMA_CONTRATISTA);
      });

      it(`${nombre}: la última firma no avanza sola ni por otro rol`, () => {
        expect(resolverTransicion(id, ultimaFirma, EVENTOS.AUTOMATICO)).toBeNull();
        [ROLES.ORDENADOR, ROLES.PROVEEDOR].forEach((rol) => {
          expect(resolverTransicion(id, ultimaFirma, EVENTOS.APROBAR, rol)).toBeNull();
          expect(resolverTransicion(id, ultimaFirma, EVENTOS.SOLICITAR_AJUSTE, rol)).toBeNull();
        });
      });
    });
  });

  it('no permite al ordenador de IDEXUD rechazar en EN_FIRMA_ORDENADOR (E13 sin compuerta)', () => {
    expect(
      resolverTransicion(UE.IDEXUD, EI.EN_FIRMA_ORDENADOR, EVENTOS.RECHAZAR, ROLES.ORDENADOR)
    ).toBeNull();
  });

  it('no permite declinar desde estados distintos de BORRADOR y RECHAZADO', () => {
    UNIDADES.forEach(({ id }) => {
      const abogado = id === UE.RECTORIA ? ROLES.ABOGADO_RECTORIA : ROLES.ABOGADO_IDEXUD;
      expect(resolverTransicion(id, EI.EN_REVISION_JEFE, EVENTOS.DECLINAR, abogado)).toBeNull();
      expect(resolverTransicion(id, EI.BORRADOR, EVENTOS.DECLINAR, abogado)?.destino).toBe(
        EI.DECLINADO
      );
      expect(resolverTransicion(id, EI.RECHAZADO, EVENTOS.DECLINAR, abogado)?.destino).toBe(
        EI.DECLINADO
      );
    });
  });

  it('no permite a un jefe actuar en la otra unidad ejecutora', () => {
    expect(
      resolverTransicion(UE.IDEXUD, EI.EN_REVISION_JEFE, EVENTOS.APROBAR, ROLES.JEFE_RECTORIA)
    ).toBeNull();
    expect(
      resolverTransicion(UE.RECTORIA, EI.EN_REVISION_JEFE, EVENTOS.APROBAR, ROLES.JEFE_IDEXUD)
    ).toBeNull();
  });

  describe('coherencia con flujoEstados de rolesEstados.ts', () => {
    /**
     * flujoEstados registra [estado automático, siguiente estado] en un solo clic. En la matriz
     * son dos filas consecutivas: la del actor y la siguiente del mismo actor o sin actor.
     * EN_AJUSTE_CONTRATISTA no se encadena: el ajuste ocurre en ese estado.
     */

    /**
     * Pares que flujoEstados aún registra y la tabla ya no encadena desde la corrección del
     * 25/11/2026: la última firma ya no lleva a FIRMAS_COMPLETAS en el mismo clic, porque antes
     * revisa el abogado (a). Se eliminan al conectar la tabla a rolesEstados.ts.
     */
    const SOLO_EN_FLUJO: { [unidad: number]: { [origen: number]: number[] } } = {
      [UE.RECTORIA]: {
        [EI.EN_FIRMA_CONTRATISTA]: [EI.FIRMADO_CONTRATISTA, EI.FIRMAS_COMPLETAS],
      },
      [UE.IDEXUD]: {
        [EI.EN_FIRMA_ORDENADOR]: [EI.FIRMADO_ORDENADOR, EI.FIRMAS_COMPLETAS],
      },
    };

    UNIDADES.forEach(({ nombre, id }) => {
      it(`los pares de ${nombre} coinciden con las filas encadenadas de la tabla`, () => {
        const esperado: { [origen: number]: number[] } = {};
        TRANSICIONES[id]
          .filter((t) => t.origen[0] !== null && t.evento !== EVENTOS.RECHAZAR)
          .filter((t) => t.evento !== EVENTOS.DECLINAR && t.evento !== EVENTOS.ENVIAR_A_JEFE)
          .filter((t) => t.evento !== EVENTOS.SOLICITAR_AJUSTE)
          .forEach((primera) => {
            const siguiente = TRANSICIONES[id].find(
              (t) =>
                t.origen.includes(primera.destino) &&
                (t.roles.length === 0 || t.roles.some((r) => primera.roles.includes(r)))
            );
            if (siguiente && primera.roles.length > 0) {
              esperado[primera.origen[0] as number] = [primera.destino, siguiente.destino];
            }
          });

        Object.keys(SOLO_EN_FLUJO[id]).forEach((origen) =>
          expect(esperado).not.toHaveProperty(origen)
        );
        expect(flujoEstados[id]).toEqual({ ...esperado, ...SOLO_EN_FLUJO[id] });
      });
    });
  });
});
