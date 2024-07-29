import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

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
export class PasoGarantiasComponent implements OnInit {
  secondFormGroup: FormGroup;

  amparos: { value: string; viewValue: string }[] = [
    { value: '0', viewValue: 'Aa' },
    { value: '1', viewValue: 'Bb' },
    { value: '2', viewValue: 'Cc' },
  ];

  displayedColumns = ['id', 'amparo', 'suficiencia', 'descripcion', 'acciones'];
  dataSource: Fila[] = [];

  constructor(private _formBuilder: FormBuilder) {
    this.secondFormGroup = this._formBuilder.group({
      filas: this._formBuilder.array([])
    });
  }

  ngOnInit() {
    // Agregar una fila inicial
    this.agregarFila();
  }

  get filasFormArray(): FormArray {
    return this.secondFormGroup.get('filas') as FormArray;
  }

  crearFilaFormGroup(): FormGroup {
    return this._formBuilder.group({
      amparo: ['', Validators.required],
      suficiencia: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  agregarFila() {
    this.filasFormArray.push(this.crearFilaFormGroup());
    this.actualizarDataSource();
  }

  eliminarFila(index: number) {
    this.filasFormArray.removeAt(index);
    this.actualizarDataSource();
  }

  actualizarDataSource() {
    this.dataSource = this.filasFormArray.controls.map(control => control.value);
  }
}