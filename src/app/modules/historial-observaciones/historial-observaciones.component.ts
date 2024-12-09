import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalObservacionesComponent } from './modal-observaciones/modal-observaciones.component';

@Component({
  selector: 'app-historial-observaciones',
  templateUrl: './historial-observaciones.component.html',
  styleUrls: ['./historial-observaciones.component.css'],
})
export class HistorialObservacionesComponent {
  constructor(public dialog: MatDialog) {}

  ngOnInit(): void {}

  openModalRechazo(): void {
    this.dialog.open(ModalObservacionesComponent, {
      width: '70vw',
      height: '35vw',
      data: {},
    });
  }
}
