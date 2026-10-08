import { NgModule } from '@angular/core';
import { ContratosRoutingModule } from './contratos-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { InViewDirective } from 'src/app/directives/InViewDirective';
import { SubirArchivoComponent } from './revision-contrato/cargar-archivo/cargar-archivo.component';
import { CargarArchivoComponent } from './registro-contrato/paso-especificaciones/cargar-archivo/cargar-archivo.component';
import { CDPListComponent } from './registro-contrato/cdp-lista/cdp-lista';
import { ParagrafoDialogComponent } from './registro-contrato/paragrafo-dialog/paragrafo-dialog.component';
import { PasoClausulasParagrafosComponent } from './registro-contrato/paso-clausulas-paragrafos/paso-clausulas-paragrafos.component';
import { PasoContratistasComponent } from './registro-contrato/paso-contratistas/paso-contratistas.component';
import { PasoDocumentosComponent } from './registro-contrato/paso-documentos/paso-documentos.component';
import { ModalEspecificacionComponent } from './registro-contrato/paso-especificaciones/modal-especificacion/modal-especificacion.component';
import { PasoEspecificacionesComponent } from './registro-contrato/paso-especificaciones/paso-especificaciones.component';
import { PasoGarantiasComponent } from './registro-contrato/paso-garantias/paso-garantias.component';
import { PasoInfoGeneralComponent } from './registro-contrato/paso-info-general/paso-info-general.component';
import { PasoInfoPresupuestalComponent } from './registro-contrato/paso-info-presupuestal/paso-info-presupuestal.component';
import { PasoObligacionesComponent } from './registro-contrato/paso-obligaciones/paso-obligaciones.component';
import { PasoSupervisoresComponent } from './registro-contrato/paso-supervisores/paso-supervisores.component';
import { PdfViewerModalComponent } from './registro-contrato/pdf-viewer-modal/pdf-viewer-modal.component';
import { RegistroContratoComponent } from './registro-contrato/registro-contrato.component';
import { RevisionContratoComponent } from './revision-contrato/revision-contrato.component';
import { PdfVisualizadorComponent } from './revision-contrato/pdf-visualizador/pdf-visualizador.component';
import { ModalMotivosRechazoComponent } from './revision-contrato/modal-motivos-rechazo/modal-motivos-rechazo.component';
import { ConsultaContratoComponent } from './consulta-contrato/consulta-contrato.component';
import { ModalObservacionesComponent } from './consulta-contrato/modal-observaciones/modal-observaciones.component';
import { DetalleContratoComponent } from './consulta-contrato/detalle-contrato/detalle-contrato.component';

const registrarComponents = [
  CDPListComponent,
  CargarArchivoComponent,
  RegistroContratoComponent,
  PasoInfoGeneralComponent,
  PasoGarantiasComponent,
  PasoSupervisoresComponent,
  PasoContratistasComponent,
  PasoInfoPresupuestalComponent,
  PasoObligacionesComponent,
  PasoEspecificacionesComponent,
  ModalEspecificacionComponent,
  PasoClausulasParagrafosComponent,
  ParagrafoDialogComponent,
  PasoDocumentosComponent,
  PdfViewerModalComponent,
  InViewDirective,
]

const revisionComponents = [
  RevisionContratoComponent,
  ModalMotivosRechazoComponent,
  PdfVisualizadorComponent,
  SubirArchivoComponent,
]

const consultaComponents = [
  ConsultaContratoComponent,
  ModalObservacionesComponent,
  DetalleContratoComponent
]

@NgModule({
  declarations: [
    ...registrarComponents,
    ...revisionComponents,
    ...consultaComponents,
  ],
  imports: [
    SharedModule,
    ContratosRoutingModule
  ],
  exports: [
    ...registrarComponents,
    ...revisionComponents,
    ...consultaComponents,
  ]
})
export class ContratosModule { }
