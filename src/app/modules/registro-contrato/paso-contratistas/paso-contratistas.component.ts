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

interface DatosContratista {
  tipoPersona: string;
  nombre: string;
  documento: string;
  ciudadContacto: string;
  direccion: string;
  correo: string;
  sitioWeb: string;
  asesor: string;
  telefonoAsesor: string;
  descripcion: string;
  puntajeEvaluacion: string;
  tipoCuentaBancaria: string;
  numeroCuenta: string;
  entidadBancaria: string;
}

@Component({
  selector: 'app-paso-contratistas',
  standalone: true,
  templateUrl: './paso-contratistas.component.html',
  styleUrls: ['./paso-contratistas.component.css'],
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
export class PasoContratistasComponent {
  fourthFormGroup!: FormGroup;
  tiposContratista: any[] = [
    { value: 'clase1', viewValue: 'Clase 1' },
    { value: 'clase2', viewValue: 'Clase 2' }
  ];
  datosContratista: any = {};

  // Datos mock
  contratosMock: { [key: string]: { [key: string]: DatosContratista } } = {
    'clase1': {
      '12345': {
        tipoPersona: 'Aa',
        nombre: 'Bcde',
        documento: '12345',
        ciudadContacto: 'Fghi',
        direccion: 'Klmn',
        correo: 'Pqrst@example.com',
        sitioWeb: 'Www.uvwxy.com',
        asesor: 'Zabcd',
        telefonoAsesor: '98765',
        descripcion: 'Efghijklmn',
        puntajeEvaluacion: '90',
        tipoCuentaBancaria: 'Opqrs',
        numeroCuenta: '11223344',
        entidadBancaria: 'Tuvwx'
      }
    },
    'clase2': {
      '67890': {
        tipoPersona: 'Bb',
        nombre: 'Wxyz',
        documento: '67890',
        ciudadContacto: 'Defgh',
        direccion: 'Ijklm',
        correo: 'Nopqr@example.com',
        sitioWeb: 'Www.stuvw.com',
        asesor: 'Xyzab',
        telefonoAsesor: '54321',
        descripcion: 'Cdefghijkl',
        puntajeEvaluacion: '85',
        tipoCuentaBancaria: 'Mnopq',
        numeroCuenta: '99887766',
        entidadBancaria: 'Rstuv'
      }
    }
  };

  buscarContratista() {
    const { claseContratista, documentoContratista } = this.fourthFormGroup.value;
    if (claseContratista && documentoContratista) {
      const contratosTipo = this.contratosMock[claseContratista];
      if (contratosTipo) {
        this.datosContratista = contratosTipo[documentoContratista] || {};
      } else {
        this.datosContratista = {};
      }
    } else {
      this.datosContratista = {};
    }
  }
  
  ngOnInit() {

    this.fourthFormGroup = this._formBuilder.group({
      thirdCtrl: ['', Validators.required],
      claseContratista: [''],
      documentoContratista: ['']
    });

    this.fourthFormGroup.valueChanges.subscribe(() => this.buscarContratista());
  }

  constructor(private _formBuilder: FormBuilder) { }

}
