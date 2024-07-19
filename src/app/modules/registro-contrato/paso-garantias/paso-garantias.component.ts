import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';


interface Fila {
  amparo: string;
  suficiencia: string;
  descripcion: string;
}

@Component({
  selector: 'app-paso-garantias',
  templateUrl: './paso-garantias.component.html',
  styleUrls: ['./paso-garantias.component.css'],
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
