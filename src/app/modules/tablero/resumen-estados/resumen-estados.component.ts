import { Component, computed, input, output } from '@angular/core';
import { ConteoEstados, ESTADOS_TABLERO, EstadoTablero } from '../../../types/tablero.models';
import { porcentaje } from '../../../utils/tablero.utils';

// Circunferencia de un círculo de radio 15.9155: 100, así el trazo se mide en %
const RADIO = 15.9155;

@Component({
  selector: 'app-resumen-estados',
  templateUrl: './resumen-estados.component.html',
  styleUrls: ['../tablero-tokens.css', './resumen-estados.component.css'],
  standalone: false,
})
export class ResumenEstadosComponent {
  readonly conteo = input.required<ConteoEstados>();
  readonly detalleTotal = input<string>('');
  // Valor de la pestaña de estado seleccionada ('' = todos); null = sin selección
  readonly estadoActivo = input<string | null>(null);
  readonly seleccionable = input<boolean>(false);
  readonly seleccionar = output<string>();

  readonly estados = ESTADOS_TABLERO;
  readonly radio = RADIO;

  // Segmentos de la dona: largo y desplazamiento de cada estado, en %
  readonly segmentos = computed(() => {
    let acumulado = 0;
    return this.estados.map((e) => {
      const largo = this.conteo().total ? (this.conteo()[e.clave] / this.conteo().total) * 100 : 0;
      const segmento = { estado: e, largo, desde: acumulado };
      acumulado += largo;
      return segmento;
    });
  });

  porcentaje(e: EstadoTablero): number {
    return porcentaje(this.conteo()[e.clave], this.conteo().total);
  }

  valor(e: EstadoTablero | null): string {
    return e === null ? '' : String(e.id);
  }

  elegir(e: EstadoTablero | null): void {
    if (this.seleccionable()) this.seleccionar.emit(this.valor(e));
  }

  formato(n: number): string {
    return n.toLocaleString('es-CO');
  }
}
