import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './modules/material.module';
import { CommonModule } from '@angular/common';
import { PlantillaTarjetaContenedoraComponent } from './templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component';
import { PlantillaModalComponent } from './templates/plantilla-modal/plantilla-modal.component';

@NgModule({
  declarations: [PlantillaTarjetaContenedoraComponent, PlantillaModalComponent],
  imports: [MaterialModule, CommonModule],
  exports: [
    PlantillaTarjetaContenedoraComponent,
    PlantillaModalComponent,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
})
export class SharedModule {}
