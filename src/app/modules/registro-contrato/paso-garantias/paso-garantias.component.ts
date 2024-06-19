import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgFor } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

interface Fila {
  amparo: string;
  suficiencia: string;
  descripcion: string;
}

@Component({
  selector: 'app-paso-garantias',
  standalone: true,
  templateUrl: './paso-garantias.component.html',
  styleUrls: ['./paso-garantias.component.css'],
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
    MatTableModule,
    MatIconModule,
  ],
})

export class PasoGarantiasComponent {
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });

  amparos: any[] = [
    { value: '0', viewValue: 'Aa' },
    { value: '1', viewValue: 'Bb' },
    { value: '2', viewValue: 'Cc' },
  ];

  displayedColumns = ['id', 'amparo', 'suficiencia', 'descripcion', 'acciones'];
  dataSource: Fila[] = [];

  agregarFila() {
    this.dataSource = [...this.dataSource, {
      amparo: '',
      suficiencia: '',
      descripcion: ''
    }];
  }

  ngOnInit() {
    this.dataSource = [
      { amparo: 'Opción 1', suficiencia: 'Suficiencia 1', descripcion: 'Descripción 1' }
    ];
  }

  constructor(private _formBuilder: FormBuilder) { }
}
