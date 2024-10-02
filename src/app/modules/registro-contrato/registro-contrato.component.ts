import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {PasoContratistasComponent} from "./paso-contratistas/paso-contratistas.component";
import {MatStepper} from "@angular/material/stepper";
import {PasoInfoGeneralComponent} from "./paso-info-general/paso-info-general.component";


@Component({
  selector: 'app-registro-contrato',
  templateUrl: './registro-contrato.component.html',
  styleUrls: ['./registro-contrato.component.css'],

})

export class RegistroContratoComponent implements OnInit{

  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild(PasoContratistasComponent) pasoContratistas!: PasoContratistasComponent;
  @ViewChild(PasoInfoGeneralComponent) pasoInfoGeneral!: PasoInfoGeneralComponent;

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  fifthFormGroup: FormGroup;
  sixthFormGroup: FormGroup;
  seventhFormGroup: FormGroup;
  eighthFormGroup: FormGroup;
  ninthFormGroup: FormGroup;


  constructor(private _formBuilder: FormBuilder) {
    this.firstFormGroup = this._formBuilder.group({});
    this.secondFormGroup = this._formBuilder.group({});
    this.thirdFormGroup = this._formBuilder.group({});
    this.fourthFormGroup = this._formBuilder.group({});
    this.fifthFormGroup = this._formBuilder.group({});
    this.sixthFormGroup = this._formBuilder.group({});
    this.seventhFormGroup = this._formBuilder.group({});
    this.eighthFormGroup = this._formBuilder.group({});
    this.ninthFormGroup = this._formBuilder.group({});
  }

  ngOnInit() {
    // Paso 1
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required],
    });

    // Paso 2
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required],
    });

    // Paso 3
    this.thirdFormGroup = this._formBuilder.group({
      thirdCtrl: ['', Validators.required],
    });

    // Paso 4
    this.fourthFormGroup = this._formBuilder.group({
      fourthCtrl: ['', Validators.required],
    });

    // Paso 5
    this.fifthFormGroup = this._formBuilder.group({
      fifthCtrl: ['', Validators.required],
    });

    // Paso 6
    this.sixthFormGroup = this._formBuilder.group({
      sixthCtrl: ['', Validators.required],
    });

    // Paso 7
    this.seventhFormGroup = this._formBuilder.group({
      seventhCtrl: ['', Validators.required],
    });

    // Paso 8
    this.eighthFormGroup = this._formBuilder.group({
      eighthCtrl: ['', Validators.required],
    });

    // Paso 8
    this.ninthFormGroup = this._formBuilder.group({
      ninthCtrl: ['', Validators.required],
    });

  }

  isLinear = false;

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      //Reset del componente (ligado al orden)
      if (event.previouslySelectedIndex === 3 && event.selectedIndex !== 3) {
        this.pasoContratistas.onStepLeave();
      }
    });
  }

}
