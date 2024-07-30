import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {PasoContratistasComponent} from "./paso-contratistas/paso-contratistas.component";
import {MatStepper} from "@angular/material/stepper";


@Component({
  selector: 'app-registro-contrato',
  templateUrl: './registro-contrato.component.html',
  styleUrls: ['./registro-contrato.component.css'],

})

export class RegistroContratoComponent implements OnInit{

  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild(PasoContratistasComponent) pasoContratistas!: PasoContratistasComponent;

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  fifthFormGroup: FormGroup;
  sixthFormGroup: FormGroup;
  seventhFormGroup: FormGroup;


  constructor(private _formBuilder: FormBuilder) {
    this.firstFormGroup = this._formBuilder.group({});
    this.secondFormGroup = this._formBuilder.group({});
    this.thirdFormGroup = this._formBuilder.group({});
    this.fourthFormGroup = this._formBuilder.group({});
    this.fifthFormGroup = this._formBuilder.group({});
    this.sixthFormGroup = this._formBuilder.group({});
    this.seventhFormGroup = this._formBuilder.group({});
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
