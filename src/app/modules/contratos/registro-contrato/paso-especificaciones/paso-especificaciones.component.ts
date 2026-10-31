import { Component, effect, EventEmitter, inject, input, OnChanges, output, Output } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalEspecificacionComponent } from './modal-especificacion/modal-especificacion.component';
import { ApiResponse, ContratoGeneral, EspecificacionTecnica } from 'src/app/types/types';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { CargarArchivoComponent } from './cargar-archivo/cargar-archivo.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-paso-especificaciones',
    templateUrl: './paso-especificaciones.component.html',
    styleUrls: ['./paso-especificaciones.component.css'],
    standalone: false
})
export class PasoEspecificacionesComponent {
  nextStep = output<void>();
  stepCompleted = output<boolean>();
  contratoGeneral = input<ContratoGeneral>()
  viewMode = input<boolean>(false);

  displayedColumns = [
    'item',
    'descripcion',
    'cantidad',
    'valorUnitario',
    'valorTotal',
    'acciones',
  ];
  editando: boolean = false;
  especificaciones: EspecificacionTecnica[] = [];
  private contratoCargadoId: number | null = null;

  public readonly dialog = inject(MatDialog);
  private readonly alertService = inject(AlertService);
  private readonly contratoGeneralCrudService = inject(ContratoGeneralCrudService);
  private readonly gestorDocumentalService = inject(GestorDocumentalService);
  constructor() {
    effect(() => {
      if (this.contratoGeneral()) {
        this.getEspecificaciones();
      }
    });
  }

  /** En modo visualización se omite la columna de acciones. */
  get columnasVisibles(): string[] {
    return this.viewMode()
      ? this.displayedColumns.filter((columna) => columna !== 'acciones')
      : this.displayedColumns;
  }

  get valorTotalGeneral(): number {
    return this.especificaciones.reduce(
      (acc, curr) => acc + (Number(curr.valor_total) || 0),
      0
    );
  }

  guardarYContinuar() {
    this.stepCompleted.emit(this.especificaciones.length > 0);
    this.nextStep.emit();
  }

  private handleError(message: string, error: any, callback?: () => void) {
    console.error(message, error);
    this.alertService.showErrorAlert(message);
    if (callback) callback();
  }

  preguntarConfirmacionEliminacion(index: number) {
    this.alertService
      .showConfirmAlert('¿Está seguro(a) de eliminar la especificación?')
      .then((confirmado: any) => {
        if (confirmado.value) {
          this.eliminarEspecificacion(index);
        }
      });
  }

  getEspecificaciones() {
    const contratoId = this.contratoGeneral()?.id;
    if (!contratoId || this.contratoCargadoId === contratoId) return;
    this.contratoCargadoId = contratoId;
    this.contratoGeneralCrudService
      .getEspecificacionesTecnicas(contratoId)
      .subscribe({
        next: (response: ApiResponse<EspecificacionTecnica[]>) => {
          if (response.Success && response.Data.length > 0) {
            this.especificaciones = response.Data;
          }
          // En visualización no hay guardado: el estado del paso sale de los datos cargados.
          if (this.viewMode()) {
            this.stepCompleted.emit(this.especificaciones.length > 0);
          }
        },
        error: (error) =>
          this.handleError('Error al obtener especificaciones técnicas', error),
      });
  }

  crearEspecificacion(especificacion: EspecificacionTecnica) {
    const { id, ...especificacionSinId } = especificacion;
    this.contratoGeneralCrudService
      .postEspecificacionTecnica({
        ...especificacionSinId,
        contrato_general_id: this.contratoGeneral()?.id,
      })
      .subscribe({
        next: (response: ApiResponse<EspecificacionTecnica>) => {
          if (response.Success && response.Data.id) {
            const nuevaEspecificacion = response.Data;
            this.especificaciones = [
              ...this.especificaciones,
              nuevaEspecificacion,
            ];
            this.alertService.showSuccessAlert(
              'La actividad fue creada exitosamente',
              'ACTIVIDAD CREADA'
            );
          } else {
            this.alertService.showErrorAlert(
              'No se pudo crear la especificación técnica'
            );
          }
        },
        error: (error) =>
          this.handleError('Error al crear la especificación técnica', error),
      });
  }

  actualizarEspecificacion(especificacion: EspecificacionTecnica) {
    const { id, ...especificacionSinId } = especificacion;
    this.contratoGeneralCrudService
      .putEspecificacionTecnica(especificacion.id, especificacionSinId)
      .subscribe({
        next: (response: ApiResponse<EspecificacionTecnica> ) => {
          if (response.Success && response.Data.id) {
            const nuevaEspecificacion = response.Data;
            const index = this.especificaciones.findIndex(
              (element) => element.id === especificacion.id
            );
            if (index !== -1) {
              this.especificaciones[index] = nuevaEspecificacion;
            }
            this.especificaciones = [...this.especificaciones];
            this.alertService.showSuccessAlert(
              'La actividad fue actualizada exitosamente',
              'ACTIVIDAD ACTUALIZADA'
            );
          } else {
            this.alertService.showErrorAlert(
              'No se pudo actualizar la especificación técnica'
            );
          }
        },
        error: (error) =>
          this.handleError(
            'Error al actualizar la especificación técnica',
            error
          ),
      });
  }

  eliminarEspecificacion(index: number) {
    const especificacion = this.especificaciones[index];
    this.contratoGeneralCrudService
      .deleteEspecificacionTecnica(especificacion.id)
      .subscribe({
        next: (response: ApiResponse<EspecificacionTecnica[]>) => {
          if (response.Success && response.Data) {
            this.especificaciones.splice(index, 1);
            this.especificaciones = [...this.especificaciones];
            this.alertService.showSuccessAlert(
              'La actividad fue eliminada exitosamente',
              'ACTIVIDAD ELIMINADA'
            );
          } else {
            this.alertService.showErrorAlert(
              'No se pudo eliminar la especificación técnica'
            );
          }
        },
        error: (error) =>
          this.handleError('Error al eliminar especificación técnica', error),
      });
  }

  editarEspecificacion(index: number) {
    this.editando = true;
    const especificacion = this.especificaciones[index];
    this.openModalEspecificacion(especificacion);
  }

  openModalEspecificacion(especificacion?: EspecificacionTecnica): void {
    const dialog = this.dialog.open(ModalEspecificacionComponent, {
      width: '680px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { especificacion },
    });

    dialog.afterClosed().subscribe((especificacion: EspecificacionTecnica) => {
      if (especificacion) {
        if (this.editando) {
          this.actualizarEspecificacion(especificacion);
        } else {
          this.crearEspecificacion(especificacion);
        }
        this.editando = false;
      }
    });
  }

  abrirModalCargarArchivo(): void {
    const dialog = this.dialog.open(CargarArchivoComponent, {
      width: '800px',
      data: { contrato_general_id: this.contratoGeneral()?.id },
    });

    dialog.afterClosed().subscribe(() => {
      this.getEspecificaciones();
    });
  }

  obtenerPlantilla() {
    const enlace = environment.ESPECIFICACIONES_ENLACE_XLSX;
    this.gestorDocumentalService.getDocumento(enlace).subscribe({
      next: (response: any) => {
        if (response?.file) {
          this.descargarPlantilla(response.file);
        } else {
          this.alertService.showErrorAlert(
            'No se pudo descargar plantilla de especificaciones técnicas'
          );
        }
      },
      error: (error) => this.handleError('Error al descargar plantilla', error),
    });
  }

  descargarPlantilla(base64String: string) {
    // Decodificar Base64 y convertirlo en un array de bytes
    const byteArray = Uint8Array.from(atob(base64String), (char) =>
      char.charCodeAt(0)
    );

    // Crear un Blob con el contenido y el tipo MIME
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Crear un enlace temporal para descargar el archivo
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla cargue especificaciones técnicas';
    a.click();

    // Liberar el objeto URL para evitar fugas de memoria
    URL.revokeObjectURL(url);
  }
}
