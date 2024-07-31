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
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from "@angular/material/checkbox";
import { GuardarInfoComponent } from './guardar-info/guardar-info.component';
import { RegistroContratoComponent } from './registro-contrato.component';

import { ParametrosService } from 'src/app/services/parametros.service';
import { RequestManager } from 'src/app/managers/requestManager';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    RegistroContratoComponent,
    PasoInfoGeneralComponent,
    PasoGarantiasComponent,
    PasoSupervisoresComponent,
    PasoContratistasComponent,
    PasoInfoPresupuestalComponent,
    PasoObligacionesComponent,
    GuardarInfoComponent
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
    HttpClientModule
  ],
  providers:[
    ParametrosService,
    RequestManager
  ]
})
export class RegistroContratoModule { }