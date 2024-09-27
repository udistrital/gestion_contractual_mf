import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ClausulasParagrafosService } from 'src/app/services/clausulas-paragrafos.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

interface Indice {
  Id: string;
  Nombre: string;
}

interface Clausula {
  _id?: string;
  nombre: string;
  descripcion: string;
  predeterminado: boolean;
  paragrafos: Paragrafo[];
}

interface Paragrafo {
  _id?: string;
  descripcion: string;
  predeterminado: boolean;
}

interface OrdenElemento {
  _id: string;
  elemento_ids: string[];
}

@Component({
  selector: 'app-paso-clausulas-paragrafos',
  templateUrl: './paso-clausulas-paragrafos.component.html',
  styleUrls: ['./paso-clausulas-paragrafos.component.css']
})
export class PasoClausulasParagrafosComponent implements OnInit {
  form: FormGroup;
  indices: Indice[] = [];
  contratoId: number = 12345;
  tipoContratoId: number = 1;

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
    this.clausulasParagrafosService.get('contratos/' + this.contratoId).subscribe(
      (response: any) => {
        if (response.Success && response.Data && response.Data.clausulas && response.Data.clausulas.length > 0) {
          this.cargarClausulasYParagrafos(response.Data.clausulas);
        } else {
          this.cargarPlantillaPorTipoContrato();
        }
      },
      error => {
        console.error('Error al cargar el contrato:', error);
        this.cargarPlantillaPorTipoContrato();
      }
    );
  }

  cargarPlantillaPorTipoContrato() {
    this.clausulasParagrafosService.get('plantilla-tipo-contratos/tipo-contrato/' + this.tipoContratoId).subscribe(
      (response: any) => {
        if (response.Success && response.Data && response.Data.length > 0) {
          this.cargarClausulasYParagrafos(response.Data[0].clausulas);
        }
      },
      error => {
        console.error('Error al cargar la plantilla por tipo de contrato:', error);
      }
    );
  }

  cargarClausulasYParagrafos(clausulas: Clausula[]) {
    this.clausulas.clear();
    clausulas.forEach((clausula, index) => {
      const indiceId = this.indices[index] ? this.indices[index].Id : '';
      const clausulaGroup = this.crearClausulaFormGroup(clausula, indiceId);
      this.clausulas.push(clausulaGroup);
    });
  }

  crearClausulaFormGroup(clausula: Clausula, indiceId: string): FormGroup {
    const clausulaGroup = this._formBuilder.group({
      id: [clausula._id || null],
      index: [indiceId, Validators.required],
      nombre: [clausula.nombre, Validators.required],
      descripcion: [clausula.descripcion, Validators.required],
      predeterminado: [clausula.predeterminado],
      paragrafos: this._formBuilder.array([])
    });
  
    const paragrafosArray = clausulaGroup.get('paragrafos') as FormArray;
    clausula.paragrafos.forEach(paragrafo => {
      paragrafosArray.push(this.crearParagrafoFormGroup(paragrafo));
    });
  
    return clausulaGroup;
  }
  
  crearParagrafoFormGroup(paragrafo: Paragrafo): FormGroup {
    return this._formBuilder.group({
      id: [paragrafo._id || null],
      descripcion: [paragrafo.descripcion, Validators.required],
      predeterminado: [paragrafo.predeterminado]
    });
  }

  getParagrafos(clausula: AbstractControl): FormArray {
    return clausula.get('paragrafos') as FormArray;
  }

  agregarClausula() {
    const nuevoIndice = this.clausulas.length;
    const indiceId = this.indices[nuevoIndice] ? this.indices[nuevoIndice].Id : '';
    this.clausulas.push(this.crearClausulaFormGroup({
      nombre: '',
      descripcion: '',
      predeterminado: false,
      paragrafos: []
    } as Clausula, indiceId));
  }

  eliminarClausula(index: number) {
    const clausula = this.clausulas.at(index);
    const clausulaId = clausula.get('id')?.value;
    const esPredeterminada = clausula.get('predeterminado')?.value;

    if (clausulaId) {
      if (esPredeterminada) {
        this.eliminarElementoDeOrden('clausulas', clausulaId, index);
      } else {
        this.eliminarClausulaYParagrafosAsociados(clausulaId, index);
      }
    } else {
      this.eliminarClausulaLocal(index);
    }
  }

  eliminarClausulaYParagrafosAsociados(clausulaId: string, index: number) {
    this.clausulasParagrafosService.delete('clausulas', clausulaId).subscribe(
      () => {
        this.obtenerYEliminarParagrafosAsociados(clausulaId, index);
      },
      error => {
        console.error('Error al eliminar la cláusula:', error);
      }
    );
  }

  obtenerYEliminarParagrafosAsociados(clausulaId: string, index: number) {
    this.clausulasParagrafosService.get('orden-paragrafos?query=contrato_id:' + this.contratoId + '&query=clausula_id:' + clausulaId + '&limit=0').subscribe(
      (response: any) => {
        if (response.Success && response.Data) {
          const paragrafos = response.Data;
          const deleteObservables = paragrafos
            .filter((paragrafo: Paragrafo) => !paragrafo.predeterminado)
            .map((paragrafo: Paragrafo) => this.clausulasParagrafosService.delete('paragrafos', paragrafo._id));

          forkJoin(deleteObservables).subscribe(
            () => this.eliminarElementoDeOrden('clausulas', clausulaId, index),
            error => {
              console.error('Error al eliminar parágrafos asociados:', error);
            }
          );
        }
      },
      error => {
        console.error('Error al obtener parágrafos asociados:', error);
      }
    );
  }

  eliminarElementoDeOrden(tipo: 'clausulas' | 'paragrafos', elementoId: string, index: number, clausulaId?: string) {
    const endpoint = tipo === 'clausulas' 
      ? 'orden-clausulas?query=contrato_id:' + this.contratoId
      : 'orden-paragrafos?query=contrato_id:' + this.contratoId + '&query=clausula_id:' + clausulaId;

    this.clausulasParagrafosService.get(endpoint).subscribe(
      (response: any) => {
        if (response.Success && response.Data && response.Data.length > 0) {
          const orden = response.Data[0] as OrdenElemento;
          const nuevosIds = orden.elemento_ids.filter(id => id !== elementoId);
          
          this.clausulasParagrafosService.put('orden-' + tipo + '/' + orden._id, { elemento_ids: nuevosIds }).subscribe(
            () => {
              if (tipo === 'clausulas') {
                this.eliminarClausulaLocal(index);
                this.eliminarOrdenParagrafosAsociada(elementoId);
              } else {
                this.eliminarParagrafoLocal(Number(clausulaId), index);
              }
              console.log(tipo.slice(0, -1) + ' eliminado de la orden exitosamente');
            },
            error => {
              console.error('Error al actualizar la orden de ' + tipo + ':', error);
            }
          );
        } else {
          console.error('No se encontró la orden de ' + tipo);
        }
      },
      error => {
        console.error('Error al obtener la orden de ' + tipo + ':', error);
      }
    );
  }

  eliminarOrdenParagrafosAsociada(clausulaId: string) {
    this.clausulasParagrafosService.get('orden-paragrafos?query=contrato_id:' + this.contratoId + '&query=clausula_id:' + clausulaId).subscribe(
      (response: any) => {
        if (response.Success && response.Data && response.Data.length > 0) {
          const ordenParagrafo = response.Data[0];
          this.clausulasParagrafosService.delete('orden-paragrafos', ordenParagrafo._id).subscribe(
            () => console.log('Orden de parágrafos asociada eliminada exitosamente'),
            error => {
              console.error('Error al eliminar la orden de parágrafos asociada:', error);
            }
          );
        }
      },
      error => {
        console.error('Error al obtener la orden de parágrafos asociada:', error);
      }
    );
  }

  eliminarClausulaLocal(index: number) {
    if (this.clausulas.length > 1) {
      this.clausulas.removeAt(index);
      this.actualizarIndices();
    }
  }

  eliminarParagrafoLocal(clausulaIndex: number, paragrafoIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    paragrafos.removeAt(paragrafoIndex);
  }

  eliminarParagrafo(clausulaIndex: number, paragrafoIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    const paragrafo = paragrafos.at(paragrafoIndex);
    const paragrafoId = paragrafo.get('id')?.value;
    const clausulaId = this.clausulas.at(clausulaIndex).get('id')?.value;
    const esPredeterminado = paragrafo.get('predeterminado')?.value;

    if (paragrafoId) {
      if (esPredeterminado) {
        this.eliminarElementoDeOrden('paragrafos', paragrafoId, paragrafoIndex, clausulaId);
      } else {
        this.clausulasParagrafosService.delete('paragrafos', paragrafoId).subscribe(
          () => this.eliminarElementoDeOrden('paragrafos', paragrafoId, paragrafoIndex, clausulaId),
          error => {
            console.error('Error al eliminar el parágrafo:', error);
          }
        );
      }
    } else {
      this.eliminarParagrafoLocal(clausulaIndex, paragrafoIndex);
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
    paragrafos.push(this.crearParagrafoFormGroup({
      descripcion: '',
      predeterminado: false
    } as Paragrafo));
  }

  guardarYContinuar() {
    if (this.form.valid) {
      const estructuraContrato = this.prepararEstructuraContrato();
      this.clausulasParagrafosService.post('contratos/' + this.contratoId, estructuraContrato).subscribe(
        (response: any) => {
          if (response.Success) {
            console.log('Contrato guardado exitosamente');
          }
        },
        error => {
          console.error('Error al guardar el contrato:', error);
        }
      );
    } else {
      console.error('Formulario inválido');
    }
  }

  prepararEstructuraContrato() {
    const clausulasValue = this.form.get('clausulas')?.value;
    return {
      clausula_ids: clausulasValue.map((c: any) => c.id).filter((id: string) => id !== null),
      paragrafos: clausulasValue.map((c: any) => ({
        clausula_id: c.id,
        paragrafo_ids: c.paragrafos.map((p: any) => p.id).filter((id: string) => id !== null)
      }))
    };
  }
}