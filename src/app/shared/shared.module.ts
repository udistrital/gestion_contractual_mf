import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { PlantillaTarjetaContenedoraComponent } from './templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component';
import { PlantillaModalComponent } from './templates/plantilla-modal/plantilla-modal.component';

@NgModule({
  declarations: [PlantillaTarjetaContenedoraComponent, PlantillaModalComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDialogActions,
    MatDialogModule,
  ],
  exports: [PlantillaTarjetaContenedoraComponent, PlantillaModalComponent],
})
export class SharedModule {}
