import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-paso-info-general',
  standalone: true,
  templateUrl: './paso-info-general.component.html',
  styleUrls: ['./paso-info-general.component.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgFor,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class PasoInfoGeneralComponent {
  // Paso 1 
  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });

  compromisos: any[] = [
    { value: '0', viewValue: 'Aa' },
    { value: '1', viewValue: 'Bb' },
    { value: '2', viewValue: 'Cc' },
  ];

  contratos: any[] = [
    { value: '0', viewValue: 'Aa' },
    { value: '1', viewValue: 'Bb' },
    { value: '2', viewValue: 'Cc' },
  ];

  constructor(private _formBuilder: FormBuilder) { }
}
