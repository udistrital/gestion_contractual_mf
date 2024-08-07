import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

interface Fila {
  descripcion: string;
  cantidad: string;
  valorUnitario: string;
  valorTotal: string;
}

@Component({
  selector: 'app-paso-especificaciones',
  templateUrl: './paso-especificaciones.component.html',
  styleUrls: ['./paso-especificaciones.component.css']
})

export class PasoEspecificacionesComponent {
  form: FormGroup;

  amparos: { value: string; viewValue: string }[] = [
    { value: '0', viewValue: 'Aa' },
    { value: '1', viewValue: 'Bb' },
    { value: '2', viewValue: 'Cc' },
  ];

  displayedColumns = ['item', 'descripcion', 'cantidad', 'valorUnitario', 'valorTotal'];
  dataSource: Fila[] = [];

  constructor(private _formBuilder: FormBuilder) { 

    this.form = this._formBuilder.group({
      filas: this._formBuilder.array([])
    });

  }

  ngOnInit() {
    // Agregar una fila inicial
    this.agregarFila();
  }

  get filasFormArray(): FormArray {
    return this.form.get('filas') as FormArray;
  }

  crearFilaFormGroup(): FormGroup {
    return this._formBuilder.group({
      descripcion: ['', Validators.required],
      cantidad: ['', Validators.required],
      valorUnitario: ['', Validators.required],
      valorTotal: ['', Validators.required]
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
