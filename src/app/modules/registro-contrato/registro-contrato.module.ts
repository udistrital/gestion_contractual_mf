import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { PasoInfoGeneralComponent } from './paso-info-general/paso-info-general.component';
import { PasoGarantiasComponent } from './paso-garantias/paso-garantias.component';
import { PasoSupervisoresComponent } from './paso-supervisores/paso-supervisores.component';
import { PasoContratistasComponent } from './paso-contratistas/paso-contratistas.component';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal/paso-info-presupuestal.component';
import { PasoObligacionesComponent } from './paso-obligaciones/paso-obligaciones.component';
import { PasoEspecificacionesComponent } from './paso-especificaciones/paso-especificaciones.component';
import { PasoClausulasParagrafosComponent } from './paso-clausulas-paragrafos/paso-clausulas-paragrafos.component';
import { PasoDocumentosComponent } from './paso-documentos/paso-documentos.component';

import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from "@angular/material/checkbox";
import { GuardarInfoComponent } from './guardar-info/guardar-info.component';
import { RegistroContratoComponent } from './registro-contrato.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ParametrosService } from 'src/app/services/parametros.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';
import { RequestManager } from 'src/app/managers/requestManager';
import { HttpClientModule } from '@angular/common/http';
import { ParagrafoDialogComponent } from './paragrafo-dialog/paragrafo-dialog.component';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import { PdfViewerModalComponent } from './pdf-viewer-modal/pdf-viewer-modal.component';
import {MatTooltipModule} from "@angular/material/tooltip";
import {PdfViewerModule} from "ng2-pdf-viewer";
import {EditorEnriquecidoComponent} from "../../components/editor-enriquecido/editor-enriquecido..component";
import {InViewDirective} from "../../directives/InViewDirective";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import {CDPListComponent} from "../../components/cdp-lista/cdp-lista";

@NgModule({
  declarations: [
    RegistroContratoComponent,
    PasoInfoGeneralComponent,
    PasoGarantiasComponent,
    PasoSupervisoresComponent,
    PasoContratistasComponent,
    PasoInfoPresupuestalComponent,
    PasoObligacionesComponent,
    GuardarInfoComponent,
    PasoEspecificacionesComponent,
    PasoClausulasParagrafosComponent,
    ParagrafoDialogComponent,
    PasoDocumentosComponent,
    PdfViewerModalComponent,
    InViewDirective,
    CDPListComponent
  ],
  imports: [
    CommonModule,
    MatStepperModule,
    MatDialogModule,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    NgFor,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatIconModule,
    MatCheckboxModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    BrowserAnimationsModule,
    MatTooltipModule,
    PdfViewerModule,
    EditorEnriquecidoComponent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription
  ],
  exports: [
    PasoInfoGeneralComponent,
    PasoInfoPresupuestalComponent,
    PasoSupervisoresComponent,
    PasoContratistasComponent,
    PasoObligacionesComponent,
    PasoEspecificacionesComponent,
    PasoGarantiasComponent,
    PasoClausulasParagrafosComponent,
    PasoDocumentosComponent
  ],
  providers: [
    ParametrosService,
    UbicacionService,
    RequestManager
  ]
})
export class RegistroContratoModule { }
