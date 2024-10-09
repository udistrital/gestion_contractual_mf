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
  nombre?: string;
  descripcion: string;
  predeterminado: boolean;
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
  contratoId: number = 15485;
  tipoContratoId: number = 1;
  clausulaModificada: boolean[] = [];
  formularioInicial: any;

  cambiosTemporales: {
    clausulas: Partial<Clausula>[];
    paragrafos: { [clausulaId: string]: Partial<Paragrafo>[] };
  } = { clausulas: [], paragrafos: {} };

  elementosEliminados: {
    clausulas: string[];
    paragrafos: { [clausulaId: string]: string[] };
  } = { clausulas: [], paragrafos: {} };

  constructor(
    private _formBuilder: FormBuilder,
    private clausulasParagrafosService: ClausulasParagrafosService,
    private parametrosService: ParametrosService
  ) {
    this.form = this._formBuilder.group({
      clausulas: this._formBuilder.array([])
    });

    this.form.valueChanges.subscribe(() => {
      this.detectarCambiosEnFormulario();
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
      next: (response: { Success: boolean, Data: Clausula[] }) => {
        if (response.Success && response.Data && response.Data.length > 0) {
          this.cargarClausulasYParagrafos(response.Data);
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
      next: (response: { Success: boolean, Data: Clausula[] }) => {
        if (response.Success && response.Data && response.Data.length > 0) {
          this.cargarClausulasYParagrafos(response.Data);
        } else {
          this.showErrorAlert('No se encontró una plantilla para este tipo de contrato');
        }
      },
      error: (error) => {
        console.error('Error al cargar la plantilla por tipo de contrato:', error);
        this.showErrorAlert('Error al cargar la plantilla');
      }
    });
  }

  private cargarClausulasYParagrafos(clausulas: Clausula[]) {
    this.clausulas.clear();
    this.clausulaModificada = clausulas.map(() => false);
    clausulas.forEach((clausula, index) => {
      const indiceId = this.indices[index]?.Id || '';
      const clausulaGroup = this.crearClausulaFormGroup(clausula, indiceId);
      this.clausulas.push(clausulaGroup);
      this.actualizarNombresParagrafos(index);
    });
    this.actualizarFormularioInicial();
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
    if (clausula.paragrafos && clausula.paragrafos.length > 0) {
      clausula.paragrafos.forEach((paragrafo: Paragrafo, index: number) => {
        paragrafosArray.push(this.crearParagrafoFormGroup(paragrafo, index));
      });
    }

    return clausulaGroup;
  }

  private crearParagrafoFormGroup(paragrafo: Paragrafo, index: number): FormGroup {
    const nombre = this.generarNombreParagrafo(index);
    return this._formBuilder.group({
      _id: [paragrafo._id || null],
      nombre: [nombre],
      descripcion: [paragrafo.descripcion, Validators.required],
      predeterminado: [paragrafo.predeterminado]
    });
  }

  private generarNombreParagrafo(index: number): string {
    if (index === 0) return "PARÁGRAFO.";
    const numerales = ["PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO", "SEXTO", "SÉPTIMO", "OCTAVO", "NOVENO", "DÉCIMO"];
    return `PARÁGRAFO ${numerales[index - 1] || (index + 1)}.`;
  }

  private detectarCambiosEnFormulario() {
    this.clausulaModificada = this.clausulas.controls.map((clausula) => {
      const clausulaTemp = this.cambiosTemporales.clausulas.find(c => c._id === clausula.get('id')?.value);
      if (!clausulaTemp) return true;

      const nombreModificado = clausula.get('nombre')?.value !== clausulaTemp.nombre;
      const descripcionModificada = clausula.get('descripcion')?.value !== clausulaTemp.descripcion;

      const paragrafosTemp = this.cambiosTemporales.paragrafos[clausulaTemp._id || ''] || [];
      const paragrafosActuales = this.getParagrafos(clausula).controls;
      const paragrafosModificados = this.paragrafosModificados(paragrafosActuales, paragrafosTemp);

      return nombreModificado || descripcionModificada || paragrafosModificados;
    });
  }

  private paragrafosModificados(paragrafosActuales: AbstractControl[], paragrafosTemp: Partial<Paragrafo>[]): boolean {
    if (paragrafosActuales.length !== paragrafosTemp.length) return true;

    return paragrafosActuales.some((paragrafo, index) => {
      const paragrafoTemp = paragrafosTemp[index];
      return paragrafo.get('nombre')?.value !== paragrafoTemp.nombre ||
        paragrafo.get('descripcion')?.value !== paragrafoTemp.descripcion ||
        paragrafo.get('predeterminado')?.value !== paragrafoTemp.predeterminado;
    });
  }

  private actualizarFormularioInicial() {
    this.formularioInicial = JSON.parse(JSON.stringify(this.form.value));
    this.detectarCambiosEnFormulario();
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

    this.clausulaModificada.push(true);
    this.actualizarFormularioInicial();
  }

  eliminarClausula(index: number) {
    const clausula = this.clausulas.at(index);
    const clausulaId = clausula.get('id')?.value;
    const esPredeterminada = clausula.get('predeterminado')?.value;

    if (this.clausulas.length > 1) {
      if (!esPredeterminada) {
        this.elementosEliminados.clausulas.push(clausulaId);
      }
      this.clausulas.removeAt(index);
      this.actualizarIndices();
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: esPredeterminada ? 'Cláusula predeterminada retirada del formulario' : 'Cláusula eliminada del formulario',
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'Debe haber al menos una cláusula',
      });
    }
  }

  eliminarParagrafo(clausulaIndex: number, paragrafoIndex: number) {
    const clausula = this.clausulas.at(clausulaIndex);
    const clausulaId = clausula.get('id')?.value;
    const paragrafos = this.getParagrafos(clausula);
    const paragrafo = paragrafos.at(paragrafoIndex);
    const paragrafoId = paragrafo.get('_id')?.value;
    const esPredeterminado = paragrafo.get('predeterminado')?.value;

    if (!esPredeterminado) {
      if (!this.elementosEliminados.paragrafos[clausulaId]) {
        this.elementosEliminados.paragrafos[clausulaId] = [];
      }
      this.elementosEliminados.paragrafos[clausulaId].push(paragrafoId);
    }

    paragrafos.removeAt(paragrafoIndex);
    this.actualizarNombresParagrafos(clausulaIndex);
    this.clausulaModificada[clausulaIndex] = true;
    this.detectarCambiosEnFormulario();

    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: esPredeterminado ? 'Parágrafo predeterminado retirado del formulario' : 'Parágrafo eliminado del formulario',
    });
  }

  private actualizarIndices() {
    this.clausulas.controls.forEach((clausula: AbstractControl, index: number) => {
      clausula.get('index')?.setValue(this.indices[index]?.Id || '');
    });
  }

  agregarParagrafo(clausulaIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    const nuevoIndex = paragrafos.length;
    paragrafos.push(this.crearParagrafoFormGroup({
      nombre: '',
      descripcion: '',
      predeterminado: false
    } as Paragrafo, nuevoIndex));
    this.actualizarNombresParagrafos(clausulaIndex);
    this.clausulaModificada[clausulaIndex] = true;
    this.detectarCambiosEnFormulario();
  }

  private actualizarNombresParagrafos(clausulaIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    paragrafos.controls.forEach((paragrafo, index) => {
      paragrafo.get('nombre')?.setValue(this.generarNombreParagrafo(index));
    });
  }

  guardarYContinuar() {
    if (this.form.valid) {
      this.guardarCambiosEnBD().then(() => {
        const estructuraContrato = this.prepararEstructuraContrato();
        this.actualizarBackend(estructuraContrato);
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'Por favor, complete todos los campos requeridos',
      });
    }
  }

  private async guardarCambiosEnBD(): Promise<void> {
    const nuevasClausulas: Partial<Clausula>[] = [];

    for (const clausulaTemp of this.cambiosTemporales.clausulas) {
      const nuevaClausula = {
        nombre: clausulaTemp.nombre,
        descripcion: clausulaTemp.descripcion,
        predeterminado: false
      };

      const responseClausula = await this.clausulasParagrafosService.post('clausulas', nuevaClausula).toPromise();
      const nuevoClausulaId = responseClausula.Data._id;

      const paragrafosTemp = this.cambiosTemporales.paragrafos[clausulaTemp._id || ''] || [];
      const nuevosParagrafos = [];

      for (const paragrafoTemp of paragrafosTemp) {
        const nuevoParagrafo = {
          nombre: paragrafoTemp.nombre,
          descripcion: paragrafoTemp.descripcion,
          predeterminado: false,
          clausula_id: nuevoClausulaId
        };

        const responseParagrafo = await this.clausulasParagrafosService.post('paragrafos', nuevoParagrafo).toPromise();
        nuevosParagrafos.push(responseParagrafo.Data);
      }

      nuevasClausulas.push({
        ...nuevaClausula,
        _id: nuevoClausulaId,
        paragrafos: nuevosParagrafos
      });

      const clausulaIndex = this.clausulas.controls.findIndex(c => c.get('id')?.value === clausulaTemp._id);
      if (clausulaIndex !== -1) {
        const clausulaGroup = this.clausulas.at(clausulaIndex) as FormGroup;
        clausulaGroup.patchValue({ id: nuevoClausulaId });

        const paragrafosArray = clausulaGroup.get('paragrafos') as FormArray;
        nuevosParagrafos.forEach((nuevoParagrafo, index) => {
          if (paragrafosArray.at(index)) {
            paragrafosArray.at(index).patchValue({ _id: nuevoParagrafo._id });
          }
        });
      }
    }

    this.cambiosTemporales = {
      clausulas: nuevasClausulas,
      paragrafos: nuevasClausulas.reduce((acc, clausula) => {
        acc[clausula._id!] = clausula.paragrafos!;
        return acc;
      }, {} as { [clausulaId: string]: Partial<Paragrafo>[] })
    };

    this.actualizarFormularioInicial();

    for (const clausulaId of this.elementosEliminados.clausulas) {
      await this.clausulasParagrafosService.delete('clausulas', clausulaId).toPromise();
    }

    for (const [clausulaId, paragrafos] of Object.entries(this.elementosEliminados.paragrafos)) {
      for (const paragrafoId of paragrafos) {
        await this.clausulasParagrafosService.delete('paragrafos', paragrafoId).toPromise();
      }
    }

    this.elementosEliminados = { clausulas: [], paragrafos: {} };
  }

  public guardarClausula(index: number): void {
    const clausula = this.clausulas.at(index) as FormGroup;
    const clausulaData: Partial<Clausula> = {
      _id: clausula.get('id')?.value,
      nombre: clausula.get('nombre')?.value,
      descripcion: clausula.get('descripcion')?.value,
      predeterminado: clausula.get('predeterminado')?.value
    };

    this.cambiosTemporales.clausulas.push(clausulaData);

    const paragrafos = this.getParagrafos(clausula);
    this.cambiosTemporales.paragrafos[clausulaData._id || ''] = paragrafos.controls.map(p => ({
      _id: p.get('id')?.value,
      nombre: p.get('nombre')?.value,
      descripcion: p.get('descripcion')?.value,
      predeterminado: p.get('predeterminado')?.value
    }));

    this.clausulaModificada[index] = false;
    this.actualizarFormularioInicial();

    Swal.fire({ icon: 'success', title: 'Éxito', text: 'Cláusula guardada temporalmente' });
  }

  private actualizarBackend(estructuraContrato: EstructuraContrato) {
    this.verificarYActualizarOrdenes(estructuraContrato);
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

  private async actualizarOrdenesParagrafos(paragrafos: ParagrafoEstructura[]) {
    for (const paragrafo of paragrafos) {
      try {
        const responseParagrafos = await this.clausulasParagrafosService.get(`orden-paragrafos?query=contrato_id:${this.contratoId}&query=clausula_id:${paragrafo.clausula_id}&limit=1`).toPromise();

        if (responseParagrafos.Data.length === 0) {
          await this.crearOrdenParagrafos(paragrafo.clausula_id, paragrafo.paragrafo_ids);
        } else {
          await this.actualizarOrdenParagrafos(responseParagrafos.Data[0]._id, paragrafo.paragrafo_ids);
        }
      } catch (error) {
        console.error(`Error al procesar orden de párrafos para cláusula ${paragrafo.clausula_id}:`, error);
        this.showErrorAlert('Error al procesar orden de párrafos');
      }
    }

    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: 'Contrato y órdenes guardados exitosamente',
    });
  }

  private async crearOrdenParagrafos(clausulaId: string, paragrafoIds: string[]) {
    try {
      const response = await this.clausulasParagrafosService.post('orden-paragrafos', {
        contrato_id: this.contratoId,
        clausula_id: clausulaId,
        paragrafo_ids: paragrafoIds
      }).toPromise();
      console.log(`Orden de párrafos creada para cláusula ${clausulaId}:`, response);
    } catch (error) {
      console.error(`Error al crear orden de párrafos para cláusula ${clausulaId}:`, error);
      this.showErrorAlert('Error al crear orden de párrafos. Por favor, intente nuevamente.');
    }
  }

  private async actualizarOrdenParagrafos(ordenId: string, paragrafoIds: string[]) {
    try {
      const response = await this.clausulasParagrafosService.put(`orden-paragrafos/${ordenId}`, { paragrafo_ids: paragrafoIds }).toPromise();
      console.log(`Orden de párrafos actualizada para orden ${ordenId}:`, response);
    } catch (error) {
      console.error(`Error al actualizar orden de párrafos ${ordenId}:`, error);
      this.showErrorAlert('Error al actualizar orden de párrafos');
    }
  }

  private crearOrdenClausulas(clausulaIds: string[]) {
    this.clausulasParagrafosService.post('orden-clausulas', { contrato_id: this.contratoId, clausula_ids: clausulaIds }).subscribe({
      next: (response) => console.log('Nueva orden de cláusulas creada:', response),
      error: (error) => {
        console.error('Error al crear nueva orden de cláusulas:', error);
        this.showErrorAlert('Error al crear orden de cláusulas');
      }
    });
  }

  private actualizarOrdenClausulas(ordenId: string, clausulaIds: string[]) {
    this.clausulasParagrafosService.put(`orden-clausulas/${ordenId}`, { clausula_ids: clausulaIds }).subscribe({
      next: () => console.log('Orden de cláusulas actualizada'),
      error: (error) => {
        console.error('Error al actualizar orden de cláusulas:', error);
        this.showErrorAlert('Error al actualizar orden de cláusulas');
      }
    });
  }

  private prepararEstructuraContrato(): EstructuraContrato {
  interface ParagrafoEstructura {
    clausula_id: string;
    paragrafo_ids: string[];
  }

  const clausulasValue = this.form.get('clausulas')?.value;

  return {
    clausula_ids: clausulasValue
      .filter((c: any) => c.id != null)
      .map((c: any) => c.id),
    paragrafos: clausulasValue
      .filter((c: any) => c.id != null)
      .map((c: any) => ({
        clausula_id: c.id,
        paragrafo_ids: c.paragrafos
          .filter((p: any) => p._id != null)
          .map((p: any) => p._id)
      }))
      .filter((p: ParagrafoEstructura) => p.paragrafo_ids.length > 0)
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