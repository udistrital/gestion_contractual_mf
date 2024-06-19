import { Component } from '@angular/core';
import { FormBuilder, Validators} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { PasoInfoGeneralComponent } from './paso-info-general/paso-info-general.component';
import { PasoGarantiasComponent } from './paso-garantias/paso-garantias.component';
import { PasoSupervisoresComponent } from './paso-supervisores/paso-supervisores.component';
import { PasoContratistasComponent } from './paso-contratistas/paso-contratistas.component';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal/paso-info-presupuestal.component';
import { PasoObjetoComponent } from './paso-objeto/paso-objeto.component';
import { PasoObservacionesComponent } from './paso-observaciones/paso-observaciones.component';

@Component({
  selector: 'app-registro-contrato',
  templateUrl: './registro-contrato.component.html',
  styleUrls: ['./registro-contrato.component.css'],
  standalone: true,
  imports: [
    MatStepperModule,
    PasoInfoGeneralComponent,
    PasoGarantiasComponent,
    PasoSupervisoresComponent,
    PasoContratistasComponent,
    PasoInfoPresupuestalComponent,
    PasoObjetoComponent,
    PasoObservacionesComponent
  ],
})

export class RegistroContratoComponent {
  // Paso 1 
  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });

  // Paso 2
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });

  // Paso 3
  thirdFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });

  // Paso 4  
  fourthFormGroup = this._formBuilder.group({
    fourthCtrl: ['', Validators.required],
  });

  // Paso 5
  fifthFormGroup = this._formBuilder.group({
    fifthCtrl: ['', Validators.required],
  });

  // Paso 6
  sixthFormGroup = this._formBuilder.group({
    sixthCtrl: ['', Validators.required],
  });

  // Paso 7
  seventhFormGroup = this._formBuilder.group({
    seventhCtrl: ['', Validators.required],
  });

  constructor(private _formBuilder: FormBuilder) { }
  isLinear = false;
}