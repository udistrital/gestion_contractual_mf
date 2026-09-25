import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'app-registro-poliza',
  templateUrl: './registro-poliza.component.html',
  styleUrls: ['./registro-poliza.component.css'],
  standalone: false,
})
export class RegistroPolizaComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  fifthFormGroup: FormGroup;
  sixthFormGroup: FormGroup;
  seventhFormGroup: FormGroup;
  eighthFormGroup: FormGroup;

  constructor(private _formBuilder: FormBuilder) {
    this.firstFormGroup = this._formBuilder.group({});
    this.secondFormGroup = this._formBuilder.group({});
    this.thirdFormGroup = this._formBuilder.group({});
    this.fourthFormGroup = this._formBuilder.group({});
    this.fifthFormGroup = this._formBuilder.group({});
    this.sixthFormGroup = this._formBuilder.group({});
    this.seventhFormGroup = this._formBuilder.group({});
    this.eighthFormGroup = this._formBuilder.group({});
  }

  ngOnInit(): void {}
}
