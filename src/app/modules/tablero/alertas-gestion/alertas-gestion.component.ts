import { Component, computed, input, output, signal } from '@angular/core';
import {
  AlertaContrato,
  DIAS_ALERTA_MAXIMO,
  DIAS_ALERTA_POR_DEFECTO,
  ESTADOS_TABLERO,
  TipoAlerta,
} from '../../../types/tablero.models';

export interface TipoAlertaVista {
  tipo: TipoAlerta;
  nombre: string;
  icono: string;
  valor: string;
}

export const TIPOS: Array<Omit<TipoAlertaVista, 'valor'>> = [
  { tipo: 'porSuscribir', nombre: `Sin suscribir > ${DIAS_ALERTA_POR_DEFECTO} días`, icono: 'schedule' },
  { tipo: 'suscrito', nombre: 'Suscritos sin legalizar', icono: 'gavel' },
  { tipo: 'legalizado', nombre: 'Sin acta de inicio', icono: 'assignment_late' },
  { tipo: 'enEjecucion', nombre: 'Próximos a vencer', icono: 'event_busy' },
];

@Component({
  selector: 'app-alertas-gestion',
  templateUrl: './alertas-gestion.component.html',
  styleUrls: ['../tablero-tokens.css', './alertas-gestion.component.css'],
  standalone: false,
})
export class AlertasGestionComponent {
  readonly alertas = input.required<AlertaContrato[]>();
  readonly limite = input<number>(4);
  readonly mostrarAbogado = input<boolean>(true);
  // Valor de la pestaña de estado activa, para resaltar el tipo de alerta
  readonly estadoActivo = input<string | null>(null);
  readonly seleccionable = input<boolean>(false);
  // Emite el id del estado general al que corresponde el tipo de alerta
  readonly seleccionarEstado = output<string>();

  readonly diasPorDefecto = DIAS_ALERTA_POR_DEFECTO;
  readonly diasMaximo = DIAS_ALERTA_MAXIMO;

  readonly tipos: TipoAlertaVista[] = TIPOS.map((t) => ({
    ...t,
    valor: String(ESTADOS_TABLERO.find((e) => e.clave === t.tipo)!.id),
  }));

  readonly iconos = Object.fromEntries(TIPOS.map((t) => [t.tipo, t.icono])) as Record<
    TipoAlerta,
    string
  >;

  readonly conteoPorTipo = computed(() => {
    const conteo = { porSuscribir: 0, suscrito: 0, legalizado: 0, enEjecucion: 0 };
    this.alertas().forEach((a) => conteo[a.tipo]++);
    return conteo;
  });

  readonly altas = computed(() => this.alertas().filter((a) => a.prioridad === 'alta').length);
  readonly medias = computed(() => this.alertas().length - this.altas());
  readonly todasVisibles = signal(false);
  readonly visibles = computed(() =>
    this.todasVisibles() ? this.alertas() : this.alertas().slice(0, this.limite())
  );

  alternarTodas(): void {
    this.todasVisibles.update((v) => !v);
  }

  elegir(t: TipoAlertaVista): void {
    if (this.seleccionable()) this.seleccionarEstado.emit(t.valor);
  }
}
