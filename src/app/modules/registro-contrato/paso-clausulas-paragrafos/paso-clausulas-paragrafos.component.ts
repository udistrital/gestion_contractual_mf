import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { ClausulasParagrafosService } from 'src/app/services/clausulas-paragrafos.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

interface Indice {
  Id: string;
  Nombre: string;
}

@Component({
  selector: 'app-paso-clausulas-paragrafos',
  templateUrl: './paso-clausulas-paragrafos.component.html',
  styleUrls: ['./paso-clausulas-paragrafos.component.css']
})
export class PasoClausulasParagrafosComponent implements OnInit {
  form: FormGroup;
  indices: Indice[] = [];
  contratoId: string = '66f06032982c57db0cbb8612';

  constructor(
    private _formBuilder: FormBuilder,
    private clausulasParagrafosService: ClausulasParagrafosService,
    private parametrosService: ParametrosService
  ) {
    this.form = this._formBuilder.group({
      clausulas: this._formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.cargarIndices();
  }

  get clausulas(): FormArray {
    return this.form.get('clausulas') as FormArray;
  }

  cargarIndices() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.ENUMERACION_CLAUSULAS_ID + '&limit=0').subscribe(
      (response: any) => {
        if (response.Status == "200") {
          this.indices = response.Data;
          this.cargarContrato();
        }
      },
      error => {
        console.error('Error al cargar índices:', error);
      }
    );
  }

  cargarContrato() {
    this.clausulasParagrafosService.get(`contratos/${this.contratoId}`).subscribe(
      (response: any) => {
        if (response.Success && response.Data) {
          this.cargarClausulasYParagrafos(response.Data.clausulas);
        }
      },
      error => {
        console.error('Error al cargar el contrato:', error);
      }
    );
  }

  cargarClausulasYParagrafos(clausulas: any[]) {
    clausulas.forEach((clausula: any, index: number) => {
      const indiceId = this.indices[index] ? this.indices[index].Id : '';
      const clausulaGroup = this._formBuilder.group({
        index: [indiceId, Validators.required],
        nombre: [clausula.nombre, Validators.required],
        descripcion: [clausula.descripcion, Validators.required],
        paragrafos: this._formBuilder.array([])
      });

      const paragrafosArray = clausulaGroup.get('paragrafos') as FormArray;
      clausula.paragrafos.forEach((paragrafo: any) => {
        paragrafosArray.push(this._formBuilder.group({
          descripcion: [paragrafo.descripcion, Validators.required]
        }));
      });

      this.clausulas.push(clausulaGroup);
    });
  }

  getParagrafos(clausula: AbstractControl): FormArray {
    return clausula.get('paragrafos') as FormArray;
  }

  agregarClausula() {
    const nuevoIndice = this.clausulas.length;
    const indiceId = this.indices[nuevoIndice] ? this.indices[nuevoIndice].Id : '';
    this.clausulas.push(this._formBuilder.group({
      index: [indiceId, Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      paragrafos: this._formBuilder.array([])
    }));
  }

  eliminarClausula(index: number) {
    if (this.clausulas.length > 1) {
      this.clausulas.removeAt(index);
      this.actualizarIndices();
    }
  }

  actualizarIndices() {
    this.clausulas.controls.forEach((clausula: AbstractControl, index: number) => {
      const indiceId = this.indices[index] ? this.indices[index].Id : '';
      clausula.get('index')?.setValue(indiceId);
    });
  }

  agregarParagrafo(clausulaIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    paragrafos.push(this._formBuilder.group({
      descripcion: ['', Validators.required]
    }));
  }

  eliminarParagrafo(clausulaIndex: number, paragrafoIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    paragrafos.removeAt(paragrafoIndex);
  }

  guardarYContinuar() {
    if (this.form.valid) {
      console.log(this.form.value);
      // Aquí iría la lógica para guardar los cambios usando el clausulasParagrafosService
    } else {
      console.error('Formulario inválido');
    }
  }
}