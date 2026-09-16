import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './modules/material.module';
import { CommonModule } from '@angular/common';
import { PlantillaTarjetaContenedoraComponent } from './templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component';
import { PlantillaModalComponent } from './templates/plantilla-modal/plantilla-modal.component';
import { CDPListComponent } from './components/cdp-lista/cdp-lista';
import { EditorEnriquecidoComponent } from './components/editor-enriquecido/editor-enriquecido..component';
import { SearchableSelectComponent } from './components/searchable-select/searchable-select.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@NgModule({
  declarations: [
    PlantillaTarjetaContenedoraComponent,
    PlantillaModalComponent,
    CDPListComponent,
    EditorEnriquecidoComponent,
    SearchableSelectComponent
  ],
  imports: [MaterialModule, CommonModule, NgxMatSelectSearchModule, FormsModule, ReactiveFormsModule],
  exports: [
    PlantillaTarjetaContenedoraComponent,
    PlantillaModalComponent,
    CDPListComponent,
    EditorEnriquecidoComponent,
    SearchableSelectComponent,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
})
export class SharedModule {}
