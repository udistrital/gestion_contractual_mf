import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './modules/material.module';
import { CommonModule, DatePipe, AsyncPipe } from '@angular/common';
import { PlantillaTarjetaContenedoraComponent } from './templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component';
import { PlantillaModalComponent } from './templates/plantilla-modal/plantilla-modal.component';
import { EditorEnriquecidoComponent } from '../core/components/editor-enriquecido/editor-enriquecido.component';
import { SearchableSelectComponent } from '../core/components/searchable-select/searchable-select.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { QuillModule } from "ngx-quill";
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({
  declarations: [
    PlantillaTarjetaContenedoraComponent,
    PlantillaModalComponent,
    EditorEnriquecidoComponent,
    SearchableSelectComponent
  ],
  imports: [
    MaterialModule,
    CommonModule,
    NgxMatSelectSearchModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule.forRoot(),
    PdfViewerModule,
  ],
  exports: [
    PlantillaTarjetaContenedoraComponent,
    PlantillaModalComponent,
    EditorEnriquecidoComponent,
    SearchableSelectComponent,
    DatePipe,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    QuillModule,
    PdfViewerModule
  ],
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
  ],
})
export class SharedModule {}
