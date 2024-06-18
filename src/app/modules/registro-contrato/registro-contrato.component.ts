import { Component } from '@angular/core';
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
  selector: 'app-registro-contrato',
  templateUrl: './registro-contrato.component.html',
  styleUrls: ['./registro-contrato.component.css'],
  standalone: true,
  imports: [
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
export class RegistroContratoComponent {
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
  // Paso 2
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
  // Paso 3
  thirdFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });

  supervisores: any[] = [{
    dependencia: '',
    sede: '',
    nombre: '',
    cargo: '',
    tipoControl: '',
    codigoVerificacion: ''
  }];

  agregarSupervisor() {
    this.supervisores.push({
      dependencia: '',
      sede: '',
      nombre: '',
      cargo: '',
      tipoControl: '',
      codigoVerificacion: ''
    });
  }

  eliminarSupervisor(index: number) {
    if (this.supervisores.length > 1) {
      this.supervisores.splice(index, 1);
    } else {
      // Opcional: mostrar un mensaje si intentan eliminar el último supervisor
      console.log('No se puede eliminar el último supervisor');
    }
  }
  // Paso 4  
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

  // Paso 5
  fifthFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });

  // Paso 6
  sixthFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });
  
  // Paso 7
  seventhFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });

  // General 

  ngOnInit() {
    this.dataSource = [
      { amparo: 'Opción 1', suficiencia: 'Suficiencia 1', descripcion: 'Descripción 1' }
    ];

    this.fourthFormGroup = this._formBuilder.group({
      thirdCtrl: ['', Validators.required],
      claseContratista: [''],
      documentoContratista: ['']
    });

    this.fourthFormGroup.valueChanges.subscribe(() => this.buscarContratista());
  }


  isLinear = false;
  constructor(private _formBuilder: FormBuilder) { }

}