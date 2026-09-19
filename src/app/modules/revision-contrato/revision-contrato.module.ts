import { NgModule } from '@angular/core';
import { RevisionContratoComponent } from './revision-contrato.component';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { PdfVisualizadorComponent } from './pdf-visualizador/pdf-visualizador.component';
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
    SharedModule,
  ],
})
export class RevisionContratoModule {}
