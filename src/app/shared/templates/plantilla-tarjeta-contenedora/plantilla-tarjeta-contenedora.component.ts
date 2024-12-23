import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

/**
 * Componente que actúa como una plantilla contenedora.
 * Permite mostrar un encabezado, un botón opcional, y contenido personalizado a través de un `TemplateRef`.
 */
@Component({
  selector: 'plantilla-tarjeta-contenedora',
  templateUrl: './plantilla-tarjeta-contenedora.component.html',
  styleUrls: ['./plantilla-tarjeta-contenedora.component.css'],
})
export class PlantillaTarjetaContenedoraComponent {
  /**
   * HTML seguro para representar un breadcrumb (ruta de navegación) en la parte superior de la tarjeta.
   * @example
   * `<a href='/inicio'>Inicio</a> > <a href='/seccion'>Sección</a>`
   */
  @Input() breadcrumb!: SafeHtml;

  /**
   * Título que se muestra en el encabezado de la tarjeta.
   * @default ""
   * @example "Mi Título Personalizado"
   */
  @Input() title: string = '';

  /**
   * Contenido dinámico que será renderizado dentro de la tarjeta.
   * Debe ser un TemplateRef que se define en el componente padre.
   * @example
   * <ng-template #miTemplate>
   *   <p>Este es el contenido dinámico</p>
   * </ng-template>
   * <plantilla-tarjeta-contenedora [contenido]="miTemplate"></plantilla-tarjeta-contenedora>
   */
  @Input() contenido!: TemplateRef<any>;

  /**
   * Indica si debe mostrarse el botón "Regresar".
   * @default false
   */
  @Input() mostrarBotonRegresar: boolean = false;

  /**
   * Evento emitido cuando se presiona el botón "Regresar".
   * Útil para manejar acciones en el componente padre, como la navegación.
   * @example
   * <plantilla-tarjeta-contenedora
   *   (regresar)="manejarRegresar()"
   * ></plantilla-tarjeta-contenedora>
   */
  @Output() regresar: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Método que emite el evento `regresar` cuando se presiona el botón.
   */
  emitirEventoRegresar() {
    this.regresar.emit();
  }
}
