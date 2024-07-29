import { Component } from '@angular/core';
import { FormBuilder, Validators} from '@angular/forms';


@Component({
  selector: 'app-registro-contrato',
  templateUrl: './registro-contrato.component.html',
  styleUrls: ['./registro-contrato.component.css'],

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