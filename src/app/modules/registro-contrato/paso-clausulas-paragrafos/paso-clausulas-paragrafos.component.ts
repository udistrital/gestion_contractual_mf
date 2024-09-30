import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { ClausulasParagrafosService } from 'src/app/services/clausulas-paragrafos.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

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

interface EstructuraContrato {
  clausula_ids: string[];
  paragrafos: ParagrafoEstructura[];
}

interface ParagrafoEstructura {
  clausula_id: string;
  paragrafo_ids: string[];
}

@Component({
  selector: 'app-paso-clausulas-paragrafos',
  templateUrl: './paso-clausulas-paragrafos.component.html',
  styleUrls: ['./paso-clausulas-paragrafos.component.css']
})
export class PasoClausulasParagrafosComponent implements OnInit {
  form: FormGroup;
  indices: Indice[] = [];
  contratoId: number = 465414;
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

  private cargarIndices() {
    this.parametrosService.get(`parametro?query=TipoParametroId:${environment.ENUMERACION_CLAUSULAS_ID}&limit=0`).subscribe({
      next: (response: any) => {
        if (response.Status === "200") {
          this.indices = response.Data;
          this.cargarContrato();
        }
      },
      error: (error) => {
        console.error('Error al cargar índices:', error);
        this.showErrorAlert('Error al cargar índices');
      }
    });
  }

  private cargarContrato() {
    this.clausulasParagrafosService.get(`contratos/${this.contratoId}`).subscribe({
      next: (response: any) => {
        if (response.Success && response.Data?.clausulas?.length > 0) {
          this.cargarClausulasYParagrafos(response.Data.clausulas);
        } else {
          this.cargarPlantillaPorTipoContrato();
        }
      },
      error: (error) => {
        console.error('Error al cargar el contrato:', error);
        this.cargarPlantillaPorTipoContrato();
      }
    });
  }

  private cargarPlantillaPorTipoContrato() {
    this.clausulasParagrafosService.get(`plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}`).subscribe({
      next: (response: any) => {
        if (response.Success && response.Data?.length > 0) {
          this.cargarClausulasYParagrafos(response.Data[0].clausulas);
        }
      },
      error: (error) => {
        console.error('Error al cargar la plantilla por tipo de contrato:', error);
        this.showErrorAlert('Error al cargar la plantilla');
      }
    });
  }

  // Métodos para manejar cláusulas y párrafos
  private cargarClausulasYParagrafos(clausulas: Clausula[]) {
    this.clausulas.clear();
    clausulas.forEach((clausula, index) => {
      const indiceId = this.indices[index]?.Id || '';
      const clausulaGroup = this.crearClausulaFormGroup(clausula, indiceId);
      this.clausulas.push(clausulaGroup);
    });
  }

  private crearClausulaFormGroup(clausula: Clausula, indiceId: string): FormGroup {
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
  
  private crearParagrafoFormGroup(paragrafo: Paragrafo): FormGroup {
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
    const indiceId = this.indices[nuevoIndice]?.Id || '';
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
      // Si la cláusula existe en el backend, la marcamos para eliminar
      clausula.patchValue({ marcadaParaEliminar: true });
    }
    
    this.eliminarClausulaLocal(index);
    this.actualizarIndices();

    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: esPredeterminada ? 'Cláusula predeterminada retirada del formulario' : 'Cláusula eliminada del formulario',
    });
  }

  private eliminarClausulaLocal(index: number) {
    if (this.clausulas.length > 1) {
      this.clausulas.removeAt(index);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'Debe haber al menos una cláusula',
      });
    }
  }

  private eliminarParagrafoLocal(clausulaIndex: number, paragrafoIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    paragrafos.removeAt(paragrafoIndex);
  }

  eliminarParagrafo(clausulaIndex: number, paragrafoIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    const paragrafo = paragrafos.at(paragrafoIndex);
    const paragrafoId = paragrafo.get('id')?.value;
    const esPredeterminado = paragrafo.get('predeterminado')?.value;

    if (paragrafoId) {
      // Si el parágrafo existe en el backend, lo marcamos para eliminar
      paragrafo.patchValue({ marcadoParaEliminar: true });
    }

    this.eliminarParagrafoLocal(clausulaIndex, paragrafoIndex);

    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: esPredeterminado ? 'Parágrafo predeterminado retirado del formulario' : 'Parágrafo eliminado del formulario',
    });
  }

  private actualizarIndices() {
    this.clausulas.controls.forEach((clausula: AbstractControl, index: number) => {
      const indiceId = this.indices[index]?.Id || '';
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

  // Métodos para guardar y actualizar
  guardarYContinuar() {
    if (this.form.valid) {
      const estructuraContrato = this.prepararEstructuraContrato();
      this.actualizarBackend(estructuraContrato);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'Por favor, complete todos los campos requeridos',
      });
    }
  }

  private async eliminarElementosMarcados(): Promise<void> {
    const eliminarClausulas = this.clausulas.controls
      .filter(c => c.get('id')?.value && c.get('marcadaParaEliminar')?.value && !c.get('predeterminado')?.value)
      .map(c => this.clausulasParagrafosService.delete('clausulas', c.get('id')?.value).toPromise());

    const eliminarParagrafos = this.clausulas.controls.flatMap(c => 
      this.getParagrafos(c).controls
        .filter(p => p.get('id')?.value && p.get('marcadoParaEliminar')?.value && !p.get('predeterminado')?.value)
        .map(p => this.clausulasParagrafosService.delete('paragrafos', p.get('id')?.value).toPromise())
    );

    await Promise.all([...eliminarClausulas, ...eliminarParagrafos]);
  }

  private actualizarBackend(estructuraContrato: EstructuraContrato) {
    // Primero, eliminamos las cláusulas y párrafos marcados para eliminar
    const eliminaciones = this.eliminarElementosMarcados();

    // Luego, actualizamos las órdenes
    eliminaciones.then(() => {
      this.verificarYActualizarOrdenes(estructuraContrato);
    });
  }

  private verificarYActualizarOrdenes(estructuraContrato: EstructuraContrato) {
    this.clausulasParagrafosService.get(`orden-clausulas?query=contrato_id:${this.contratoId}&limit=1`).subscribe({
      next: (responseClausulas: any) => {
        if (responseClausulas.Data.length === 0) {
          this.crearOrdenClausulas(estructuraContrato.clausula_ids);
        } else {
          this.actualizarOrdenClausulas(responseClausulas.Data[0]._id, estructuraContrato.clausula_ids);
        }
  
        this.actualizarOrdenesParagrafos(estructuraContrato.paragrafos);
      },
      error: (error) => {
        console.error('Error al verificar orden de cláusulas:', error);
        this.showErrorAlert('Error al verificar orden de cláusulas');
      }
    });
  }

  private actualizarOrdenesParagrafos(paragrafos: ParagrafoEstructura[]) {
    paragrafos.forEach(paragrafo => {
      this.clausulasParagrafosService.get(`orden-paragrafos?query=contrato_id:${this.contratoId}&query=clausula_id:${paragrafo.clausula_id}&limit=1`).subscribe({
        next: (responseParagrafos: any) => {
          if (responseParagrafos.Data.length === 0) {
            this.crearOrdenParagrafos(paragrafo.clausula_id, paragrafo.paragrafo_ids);
          } else {
            this.actualizarOrdenParagrafos(responseParagrafos.Data[0]._id, paragrafo.paragrafo_ids);
          }
        },
        error: (error) => {
          console.error('Error al verificar orden de párrafos:', error);
          this.showErrorAlert('Error al verificar orden de párrafos');
        }
      });
    });

    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: 'Contrato y órdenes guardados exitosamente',
    });
  }
  
  private crearOrdenClausulas(clausulaIds: string[]) {
    const nuevaOrdenClausulas = {
      contrato_id: this.contratoId,
      clausula_ids: clausulaIds
    };
    this.clausulasParagrafosService.post('orden-clausulas', nuevaOrdenClausulas).subscribe({
      next: (response) => console.log('Nueva orden de cláusulas creada:', response),
      error: (error) => {
        console.error('Error al crear nueva orden de cláusulas:', error);
        this.showErrorAlert('Error al crear orden de cláusulas');
      }
    });
  }
  
  private actualizarOrdenClausulas(ordenId: string, clausulaIds: string[]) {
    const actualizacionOrdenClausulas = { clausula_ids: clausulaIds };
    this.clausulasParagrafosService.put(`orden-clausulas/${ordenId}`, actualizacionOrdenClausulas).subscribe({
      next: () => console.log('Orden de cláusulas actualizada'),
      error: (error) => {
        console.error('Error al actualizar orden de cláusulas:', error);
        this.showErrorAlert('Error al actualizar orden de cláusulas');
      }
    });
  }
  
  private crearOrdenParagrafos(clausulaId: string, paragrafoIds: string[]) {
    const nuevaOrdenParagrafos = {
      contrato_id: this.contratoId,
      clausula_id: clausulaId,
      paragrafo_ids: paragrafoIds
    };
    this.clausulasParagrafosService.post('orden-paragrafos', nuevaOrdenParagrafos).subscribe({
      next: (response) => console.log('Nueva orden de párrafos creada:', response),
      error: (error) => {
        console.error('Error al crear nueva orden de párrafos:', error);
        this.showErrorAlert('Error al crear orden de párrafos');
      }
    });
  }
  
  private actualizarOrdenParagrafos(ordenId: string, paragrafoIds: string[]) {
    const actualizacionOrdenParagrafos = { paragrafo_ids: paragrafoIds };
    this.clausulasParagrafosService.put(`orden-paragrafos/${ordenId}`, actualizacionOrdenParagrafos).subscribe({
      next: (response) => console.log('Orden de párrafos actualizada:', response),
      error: (error) => {
        console.error('Error al actualizar orden de párrafos:', error);
        this.showErrorAlert('Error al actualizar orden de párrafos');
      }
    });
  }

  private prepararEstructuraContrato(): EstructuraContrato {
    const clausulasValue = this.form.get('clausulas')?.value;
    return {
      clausula_ids: clausulasValue
        .filter((c: any) => c.id && !c.marcadaParaEliminar)
        .map((c: any) => c.id),
      paragrafos: clausulasValue
        .filter((c: any) => c.id && !c.marcadaParaEliminar)
        .map((c: any) => ({
          clausula_id: c.id,
          paragrafo_ids: c.paragrafos
            .filter((p: any) => p.id && !p.marcadoParaEliminar)
            .map((p: any) => p.id)
        }))
    };
  }

  private showErrorAlert(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: message,
    });
  }
}