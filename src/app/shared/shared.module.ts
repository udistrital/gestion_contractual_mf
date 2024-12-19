import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantillaTarjetaContenedoraComponent } from './templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [PlantillaTarjetaContenedoraComponent],
  imports: [CommonModule, MatCardModule, MatIconModule],
  exports: [PlantillaTarjetaContenedoraComponent],
})
export class SharedModule {}
