import { Component, EventEmitter, Output } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalEspecificacionComponent } from './modal-especificacion/modal-especificacion.component';
import { EspecificacionTecnica } from 'src/app/types/types';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { CargarArchivoComponent } from './cargar-archivo/cargar-archivo.component';

@Component({
  selector: 'app-paso-especificaciones',
  templateUrl: './paso-especificaciones.component.html',
  styleUrls: ['./paso-especificaciones.component.css'],
})
export class PasoEspecificacionesComponent {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

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
  contrato_general_id = 1;

  constructor(
    public dialog: MatDialog,
    private alertService: AlertService,
    private contratoGeneralCrudService: ContratoGeneralCrudService
  ) {}

  ngOnInit() {
    this.getEspecificaciones();
  }

  private handleError(message: string, error: any, callback?: () => void) {
    console.error(message, error);
    this.alertService.showErrorAlert(message);
    if (callback) callback();
  }

  getDataResponse(data: any): EspecificacionTecnica {
    const { id, descripcion, cantidad, valor_unitario, valor_total } = data;
    return {
      id,
      descripcion,
      cantidad,
      valor_unitario,
      valor_total,
    };
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
    this.contratoGeneralCrudService
      .getEspecificacionesTecnicas(this.contrato_general_id)
      .subscribe({
        next: (response: {
          Success: boolean;
          Data: EspecificacionTecnica[];
        }) => {
          if (response.Success && response.Data.length > 0) {
            this.especificaciones = response.Data.map((element) =>
              this.getDataResponse(element)
            );
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
        contratoGeneralId: this.contrato_general_id,
      })
      .subscribe({
        next: (response: { Success: boolean; Data: EspecificacionTecnica }) => {
          if (response.Success && response.Data.id) {
            const nuevaEspecificacion = this.getDataResponse(response.Data);
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
        next: (response: { Success: boolean; Data: EspecificacionTecnica }) => {
          if (response.Success && response.Data.id) {
            const nuevaEspecificacion = this.getDataResponse(response.Data);
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
        next: (response: {
          Success: boolean;
          Data: EspecificacionTecnica[];
        }) => {
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
      width: '70vw',
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

  abrirModalCargarArchivo(tipoArchivo: string): void {
    this.dialog.open(CargarArchivoComponent, {
      width: '800px',
      data: { tipoArchivo, contrato_general_id: this.contrato_general_id },
    });
  }
}
