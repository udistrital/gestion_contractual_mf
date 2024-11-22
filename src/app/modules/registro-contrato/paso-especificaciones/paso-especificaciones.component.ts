import { Component, EventEmitter, Output } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalEspecificacionComponent } from './modal-especificacion/modal-especificacion.component';
import { Especificacion } from 'src/app/types/types';

@Component({
  selector: 'app-paso-especificaciones',
  templateUrl: './paso-especificaciones.component.html',
  styleUrls: ['./paso-especificaciones.component.css'],
})
export class PasoEspecificacionesComponent {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  especificacionEditarIndex: number | null = null;
  displayedColumns = [
    'item',
    'descripcion',
    'cantidad',
    'valorUnitario',
    'valorTotal',
    'acciones',
  ];
  dataSource: Especificacion[] = [
    {
      descripcion: 'Producto A',
      cantidad: 5,
      valorUnitario: 100,
      valorTotal: 500,
    },
  ];

  constructor(public dialog: MatDialog, private alertService: AlertService) {}

  ngOnInit() {}

  editarEspecificacion(index: number) {
    this.especificacionEditarIndex = index;
    const especificacion = this.dataSource[index];
    this.openModalEspecificacion(especificacion);
  }

  preguntarConfirmacionEliminacion(index: number) {
    this.alertService
      .showConfirmAlert('¿Está seguro(a) de eliminar la especificación?')
      .then((confirmado: any) => {
        if (!confirmado.value) {
          return;
        }
        this.eliminarEspecificacion(index);
      });
  }

  eliminarEspecificacion(index: number) {
    this.dataSource.splice(index, 1);
    this.dataSource = [...this.dataSource];

    this.alertService.showSuccessAlert(
      'La actividad fue eliminada exitosamente',
      'ACTIVIDAD ELIMINADA'
    );

    // this.contratoGeneralCrudService
    //   .postEstadoContrato(planEstado)
    //   .subscribe((res: any) => {
    //     this.alertService.showSuccessAlert(
    //       'El contrato fue enviado al ordenador',
    //       'CONTRATO ENVIADO'
    //     );
    //   });
  }

  openModalEspecificacion(especificacion?: Especificacion): void {
    const dialog = this.dialog.open(ModalEspecificacionComponent, {
      width: '70vw',
      data: { especificacion },
    });

    dialog.afterClosed().subscribe((especificacion) => {
      if (especificacion) {
        if (this.especificacionEditarIndex !== null) {
          // Si estamos editando, actualizamos la especificación
          this.dataSource[this.especificacionEditarIndex] = especificacion;
        } else {
          // Si estamos añadiendo, agregamos la nueva especificación
          this.dataSource.push(especificacion);
        }
        this.dataSource = [...this.dataSource]; // Forzamos la actualización de la tabla
        this.especificacionEditarIndex = null; // Restablecemos el índice de edición
      }
    });
  }
}
