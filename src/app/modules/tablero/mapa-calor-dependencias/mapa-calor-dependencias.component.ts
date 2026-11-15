import { Component, computed, input, output } from '@angular/core';
import { ESTADOS_TABLERO, EstadoClave, GrupoContratos } from '../../../types/tablero.models';

export interface CeldaMapaCalor {
  estado: EstadoClave;
  valor: number;
  // Tono de la escala (0 = más contratos); null si la celda no tiene contratos
  tono: number | null;
  titulo: string;
}

export interface FilaMapaCalor {
  grupo: GrupoContratos;
  celdas: CeldaMapaCalor[];
  anchoTotal: number;
}

// Tonos de la escala --tb-tono-0 (más oscuro) a --tb-tono-7 (más claro)
const TONOS = 8;
// Los tonos por debajo de este tienen fondo oscuro y el texto va en blanco
const TONO_CLARO = 5;

@Component({
  selector: 'app-mapa-calor-dependencias',
  templateUrl: './mapa-calor-dependencias.component.html',
  styleUrls: ['../tablero-tokens.css', './mapa-calor-dependencias.component.css'],
  standalone: false,
})
export class MapaCalorDependenciasComponent {
  readonly grupos = input.required<GrupoContratos[]>();
  readonly seleccionada = input<string | null>(null);
  readonly seleccionar = output<string | null>();

  readonly estados = ESTADOS_TABLERO;
  readonly tonos = Array.from({ length: TONOS }, (_, i) => TONOS - 1 - i);
  readonly tonoClaro = TONO_CLARO;

  readonly filas = computed<FilaMapaCalor[]>(() => {
    const grupos = this.grupos().filter((g) => g.total > 0);
    const maxCelda = Math.max(0, ...grupos.flatMap((g) => this.estados.map((e) => g[e.clave])));
    const maxTotal = Math.max(0, ...grupos.map((g) => g.total));
    return grupos.map((g) => ({
      grupo: g,
      anchoTotal: (g.total / maxTotal) * 100,
      celdas: this.estados.map((e) => {
        const valor = g[e.clave];
        return {
          estado: e.clave,
          valor,
          tono: valor ? Math.round((1 - valor / maxCelda) * (TONOS - 1)) : null,
          titulo: `${g.nombre} · ${e.nombre}: ${valor} ${valor === 1 ? 'contrato' : 'contratos'}`,
        };
      }),
    }));
  });

  // Filtra por la dependencia de la fila; al repetir la selección quita el filtro
  elegir(clave: string): void {
    this.seleccionar.emit(this.seleccionada() === clave ? null : clave);
  }
}
