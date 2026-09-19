import { NgModule } from '@angular/core';
import { PasoInfoGeneralComponent } from './paso-info-general/paso-info-general.component';
import { PasoGarantiasComponent } from './paso-garantias/paso-garantias.component';
import { PasoSupervisoresComponent } from './paso-supervisores/paso-supervisores.component';
import { PasoContratistasComponent } from './paso-contratistas/paso-contratistas.component';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal/paso-info-presupuestal.component';
import { PasoObligacionesComponent } from './paso-obligaciones/paso-obligaciones.component';
import { PasoEspecificacionesComponent } from './paso-especificaciones/paso-especificaciones.component';
import { PasoClausulasParagrafosComponent } from './paso-clausulas-paragrafos/paso-clausulas-paragrafos.component';
import { PasoDocumentosComponent } from './paso-documentos/paso-documentos.component';
import { GuardarInfoComponent } from './guardar-info/guardar-info.component';
import { RegistroContratoComponent } from './registro-contrato.component';

import { ParametrosService } from 'src/app/services/parametros.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';
import { RequestManager } from 'src/app/managers/requestManager';
import { ParagrafoDialogComponent } from './paragrafo-dialog/paragrafo-dialog.component';
import { PdfViewerModalComponent } from './pdf-viewer-modal/pdf-viewer-modal.component';
import { InViewDirective } from '../../directives/InViewDirective';


import { CDPListComponent } from './cdp-lista/cdp-lista';
import { ModalEspecificacionComponent } from './paso-especificaciones/modal-especificacion/modal-especificacion.component';
import { CargarArchivoComponent } from './paso-especificaciones/cargar-archivo/cargar-archivo.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    CDPListComponent,
    RegistroContratoComponent,
    PasoInfoGeneralComponent,
    PasoGarantiasComponent,
    PasoSupervisoresComponent,
    PasoContratistasComponent,
    PasoInfoPresupuestalComponent,
    PasoObligacionesComponent,
    GuardarInfoComponent,
    PasoEspecificacionesComponent,
    ModalEspecificacionComponent,
    CargarArchivoComponent,
    PasoClausulasParagrafosComponent,
    ParagrafoDialogComponent,
    PasoDocumentosComponent,
    PdfViewerModalComponent,
    InViewDirective,
  ],
  imports: [
    SharedModule,
  ],
  exports: [
    CDPListComponent,
    PasoInfoGeneralComponent,
    PasoInfoPresupuestalComponent,
    PasoSupervisoresComponent,
    PasoContratistasComponent,
    PasoObligacionesComponent,
    PasoEspecificacionesComponent,
    PasoGarantiasComponent,
    PasoClausulasParagrafosComponent,
    PasoDocumentosComponent,
  ],
  providers: [ParametrosService, UbicacionService, RequestManager],
})
export class RegistroContratoModule {}
