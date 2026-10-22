import { Component, computed, input, output, signal } from '@angular/core';
import { ESTADOS_TABLERO, GrupoContratos } from '../../../types/tablero.models';
import { conteoVacio, porcentaje, squarify } from '../../../utils/tablero.utils';

export interface BloqueTreemap {
  grupo: GrupoContratos;
  otras: boolean;
  tono: number;
  oscuro: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  porcentaje: number;
  nivel: 'grande' | 'medio' | 'pequeno';
  titulo: string;
}

// Proporción del lienzo usada para calcular el diseño (ancho x alto)
const ANCHO = 1000;
const ALTO = 470;
// Las dependencias por debajo de esta participación se agrupan en "Otras"
const MINIMO_PARTICIPACION = 0.03;
const TONOS_DEPENDENCIAS = 7;

@Component({
  selector: 'app-treemap-dependencias',
  templateUrl: './treemap-dependencias.component.html',
  styleUrls: ['../tablero-tokens.css', './treemap-dependencias.component.css'],
  standalone: false,
})
export class TreemapDependenciasComponent {
  readonly grupos = input.required<GrupoContratos[]>();
  readonly seleccionada = input<string | null>(null);
  readonly seleccionar = output<string | null>();

  readonly estados = ESTADOS_TABLERO;
  // Detalle de las dependencias agrupadas en "Otras", visible al hacer clic en ese bloque
  readonly verOtras = signal(false);

  // Dependencias por debajo del mínimo, con su porcentaje del total
  readonly otras = computed(() => {
    const grupos = this.grupos().filter((g) => g.total > 0);
    const total = grupos.reduce((s, g) => s + g.total, 0);
    return grupos
      .filter((g) => g.total / total < MINIMO_PARTICIPACION)
      .map((g) => ({ grupo: g, porcentaje: porcentaje(g.total, total) }));
  });

  readonly bloques = computed<BloqueTreemap[]>(() => {
    const grupos = this.grupos().filter((g) => g.total > 0);
    const total = grupos.reduce((s, g) => s + g.total, 0);
    if (!total) return [];

    const principales = grupos.filter((g) => g.total / total >= MINIMO_PARTICIPACION);
    const resto = this.otras().map((o) => o.grupo);
    const lista = principales.map((g) => ({ grupo: g, otras: false }));
    if (resto.length) {
      const otras: GrupoContratos = {
        clave: '',
        nombre: `Otras ${resto.length} ${resto.length === 1 ? 'dependencia' : 'dependencias'}`,
        ...conteoVacio(),
      };
      resto.forEach((g) => {
        otras.total += g.total;
        this.estados.forEach((e) => (otras[e.clave] += g[e.clave]));
      });
      lista.push({ grupo: otras, otras: true });
    }

    const rects = squarify(
      lista.map((b) => (b.grupo.total * ANCHO * ALTO) / total),
      { x: 0, y: 0, w: ANCHO, h: ALTO }
    );

    return lista.map((b, i) => {
      const r = rects[i];
      const tono = b.otras ? TONOS_DEPENDENCIAS : Math.min(i, TONOS_DEPENDENCIAS - 1);
      const pct = porcentaje(b.grupo.total, total);
      return {
        ...b,
        tono,
        oscuro: tono < 5,
        x: (r.x / ANCHO) * 100,
        y: (r.y / ALTO) * 100,
        w: (r.w / ANCHO) * 100,
        h: (r.h / ALTO) * 100,
        porcentaje: pct,
        nivel: r.w > 150 && r.h > 90 ? 'grande' : r.w > 80 && r.h > 46 ? 'medio' : 'pequeno',
        titulo:
          `${b.grupo.nombre}: ${b.grupo.total} contratos (${pct}%)\n` +
          this.estados.map((e) => `${e.nombre}: ${b.grupo[e.clave]}`).join('\n'),
      };
    });
  });

  elegir(b: BloqueTreemap): void {
    if (b.otras) {
      this.verOtras.update((v) => !v);
      return;
    }
    this.elegirDependencia(b.grupo.clave);
  }

  elegirDependencia(clave: string): void {
    this.seleccionar.emit(this.seleccionada() === clave ? null : clave);
  }
}
