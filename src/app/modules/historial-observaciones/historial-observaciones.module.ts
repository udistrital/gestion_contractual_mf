import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HistorialObservacionesComponent } from './historial-observaciones.component';
import { ModalObservacionesComponent } from './modal-observaciones/modal-observaciones.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@NgModule({
  declarations: [HistorialObservacionesComponent, ModalObservacionesComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatDialogActions,
    MatButtonModule,
    MatDividerModule,
  ],
})
export class HistorialObservacionesModule {}
