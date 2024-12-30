import { NgModule } from '@angular/core';
import { PlantillaTarjetaContenedoraComponent } from './templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './modules/material.module';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [PlantillaTarjetaContenedoraComponent],
  imports: [MaterialModule, CommonModule],
  exports: [
    PlantillaTarjetaContenedoraComponent,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
})
export class SharedModule {}
