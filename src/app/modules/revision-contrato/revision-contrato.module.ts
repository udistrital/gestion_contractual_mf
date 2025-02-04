import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RevisionContratoComponent } from './revision-contrato.component';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { PdfVisualizadorComponent } from './pdf-visualizador/pdf-visualizador.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CargarArchivoComponent } from './cargar-archivo/cargar-archivo.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    RevisionContratoComponent,
    ModalMotivosRechazoComponent,
    PdfVisualizadorComponent,
    CargarArchivoComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatDialogActions,
    MatButtonModule,
    PdfViewerModule,
    MatProgressSpinnerModule,
    SharedModule,
  ],
})
export class RevisionContratoModule {}
