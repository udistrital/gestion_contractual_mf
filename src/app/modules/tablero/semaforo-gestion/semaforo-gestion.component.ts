import { Component, computed, input } from '@angular/core';
import { AlertaContrato, TipoAlerta } from '../../../types/tablero.models';
import { TIPOS } from '../alertas-gestion/alertas-gestion.component';

// Semáforo de la página de inicio: prioridades, tipos de alerta y lista con scroll
@Component({
  selector: 'app-semaforo-gestion',
  templateUrl: './semaforo-gestion.component.html',
  styleUrls: ['../tablero-tokens.css', './semaforo-gestion.component.css'],
  standalone: false,
})
export class SemaforoGestionComponent {
  readonly alertas = input.required<AlertaContrato[]>();
  // Contratos considerados, para calcular los que están al día
  readonly total = input.required<number>();
  readonly mostrarAbogado = input<boolean>(true);

  readonly tipos = TIPOS;
  readonly iconos = Object.fromEntries(TIPOS.map((t) => [t.tipo, t.icono])) as Record<
    TipoAlerta,
    string
  >;

  readonly altas = computed(() => this.alertas().filter((a) => a.prioridad === 'alta').length);
  readonly medias = computed(() => this.alertas().length - this.altas());
  readonly alDia = computed(() => Math.max(0, this.total() - this.alertas().length));

  readonly conteoPorTipo = computed(() => {
    const conteo = { porSuscribir: 0, suscrito: 0, legalizado: 0, enEjecucion: 0 };
    this.alertas().forEach((a) => conteo[a.tipo]++);
    return conteo;
  });

  formato(n: number): string {
    return n.toLocaleString('es-CO');
  }
}
