import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RevisionJefeComponent } from './revision-jefe.component';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { PdfVisualizadorComponent } from './pdf-visualizador/pdf-visualizador.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
    RevisionJefeComponent,
    ModalMotivosRechazoComponent,
    PdfVisualizadorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatDialogActions,
    MatButtonModule,
    PdfViewerModule
  ]
})
export class RevisionJefeModule { }
