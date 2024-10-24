import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { ClausulasParagrafosService } from 'src/app/services/clausulas-paragrafos.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { MatStepper } from '@angular/material/stepper';
import { NgZone } from '@angular/core';

interface Indice { Id: string; Nombre: string; }
interface Clausula { _id?: string; nombre: string; descripcion: string; predeterminado: boolean; paragrafos: Paragrafo[]; }
interface Paragrafo { _id?: string; nombre?: string; descripcion: string; predeterminado: boolean; }

@Component({
  selector: 'app-paso-clausulas-paragrafos',
  templateUrl: './paso-clausulas-paragrafos.component.html',
  styleUrls: ['./paso-clausulas-paragrafos.component.css']
})
export class PasoClausulasParagrafosComponent {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  form: FormGroup;
  indices: Indice[] = [];
  contratoId: number = 4869;
  tipoContratoId: number = 1;
  reversionSaldo: boolean = false;
  usuarioId: number = 25;

  constructor(
    private fb: FormBuilder,
    private clausulasParagrafosService: ClausulasParagrafosService,
    private parametrosService: ParametrosService,
    private stepper: MatStepper,
    private zone: NgZone
  ) {
    this.form = this.fb.group({ clausulas: this.fb.array([]) });
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
      error: (error) => this.handleError('Error al cargar índices', error)
    });
  }

  private cargarContrato() {
    this.clausulasParagrafosService.get(`contratos/${this.contratoId}`).subscribe({
      next: (response: { Success: boolean, Data: Clausula[] }) => {
        if (response.Success && response.Data?.length > 0) {
          this.cargarContratoExistente(response.Data);
        } else {
          this.cargarPlantillaPorTipoContrato();
        }
      },
      error: (error) => this.handleError('Error al cargar el contrato', error, () => this.cargarPlantillaPorTipoContrato())
    });
  }

  private cargarPlantillaPorTipoContrato() {
    this.clausulasParagrafosService.get(`plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}?query=reversion_saldo:${this.reversionSaldo}`).subscribe({
      next: (response: { Success: boolean, Data: Clausula[] }) => {
        if (response.Success && response.Data?.length > 0) {
          this.crearContratoDesdePlantilla(response.Data);
        } else {
          this.showErrorAlert('No se encontró una plantilla para este tipo de contrato');
        }
      },
      error: (error) => this.handleError('Error al cargar la plantilla por tipo de contrato', error)
    });
  }

  private crearContratoDesdePlantilla(clausulas: Clausula[]) {
    const nuevoContrato = {
      clausula_ids: clausulas.map(c => c._id),
      paragrafos: clausulas.map(c => ({
        clausula_id: c._id,
        paragrafo_ids: c.paragrafos.map(p => p._id)
      })).filter(p => p.paragrafo_ids.length > 0),
      creado_por: this.usuarioId,
      actualizado_por: this.usuarioId
    };

    this.clausulasParagrafosService.post(`contratos/${this.contratoId}`, nuevoContrato).subscribe({
      next: (response: any) => {
        if (response.Success && response.Data) {
          this.contratoId = response.Data.ordenClausula.contrato_id;
          this.cargarContratoNuevo(response.Data, clausulas);
          Swal.fire({
            icon: 'success',
            title: 'Contrato creado',
            text: 'El contrato se ha creado exitosamente desde la plantilla.'
          });
        } else {
          this.showErrorAlert('Error al crear el contrato: Respuesta inválida');
        }
      },
      error: (error) => this.handleError('Error al crear el contrato desde la plantilla', error)
    });
  }

  private cargarContratoNuevo(data: any, clausulasOriginales: Clausula[]) {
    this.clausulas.clear();
    data.ordenClausula.clausula_ids.forEach((clausulaId: string, index: number) => {
      const clausula = clausulasOriginales.find(c => c._id === clausulaId);
      if (clausula) {
        const clausulaGroup = this.crearClausulaFormGroup(clausula, this.indices[index]?.Id || '');
        this.clausulas.push(clausulaGroup);
        const ordenParagrafo = data.ordenParagrafos.find((op: any) => op.clausula_id === clausulaId);
        if (ordenParagrafo) {
          const paragrafosArray = clausulaGroup.get('paragrafos') as FormArray;
          paragrafosArray.clear();
          ordenParagrafo.paragrafo_ids.forEach((paragrafoId: string, pIndex: number) => {
            const paragrafo = clausula.paragrafos.find(p => p._id === paragrafoId);
            if (paragrafo) {
              paragrafosArray.push(this.crearParagrafoFormGroup(paragrafo, pIndex, ordenParagrafo.paragrafo_ids.length));
            }
          });
        }
      }
    });

    this.actualizarIndices();
    this.form.updateValueAndValidity();
  }

  private cargarContratoExistente(clausulas: Clausula[]) {
    this.zone.run(() => {
      this.clausulas.clear();
      clausulas.forEach((clausula, index) => {
        const indiceId = this.indices[index]?.Id || '';
        const clausulaFormGroup = this.crearClausulaFormGroup(clausula, indiceId);
        this.clausulas.push(clausulaFormGroup);
      });
      this.actualizarIndices();
      this.form.updateValueAndValidity();
      this.form.markAsDirty();
    });
  }

  private crearClausulaFormGroup(clausula: Clausula, indiceId: string): FormGroup {
    const clausulaGroup = this.fb.group({
      id: [clausula._id || null],
      index: [indiceId, Validators.required],
      nombre: [clausula.nombre, Validators.required],
      descripcion: [clausula.descripcion, Validators.required],
      predeterminado: [clausula.predeterminado],
      paragrafos: this.fb.array([])
    });

    const paragrafosArray = clausulaGroup.get('paragrafos') as FormArray;
    clausula.paragrafos?.forEach((paragrafo: Paragrafo, index: number) => {
      paragrafosArray.push(this.crearParagrafoFormGroup(paragrafo, index, clausula.paragrafos?.length || 0));
    });

    return clausulaGroup;
  }

  private crearParagrafoFormGroup(paragrafo: Paragrafo, index: number, totalParagrafos: number): FormGroup {
    const paragrafoGroup = this.fb.group({
      _id: [paragrafo._id || null],
      nombre: [this.generarNombreParagrafo(index, totalParagrafos)],
      descripcion: [paragrafo.descripcion, Validators.required],
      predeterminado: [paragrafo.predeterminado]
    });

    return paragrafoGroup;
  }

  private generarNombreParagrafo(index: number, totalParagrafos: number): string {
    if (totalParagrafos === 1) {
      return "PARÁGRAFO.";
    } else {
      const numerales = ["PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO", "SEXTO", "SÉPTIMO", "OCTAVO", "NOVENO", "DÉCIMO"];
      return `PARÁGRAFO ${numerales[index] || (index + 1)}.`;
    }
  }

  private actualizarIndices() {
    this.clausulas.controls.forEach((clausula: AbstractControl, index: number) => {
      clausula.get('index')?.setValue(this.indices[index]?.Id || '');
    });
  }

  getParagrafos(clausula: AbstractControl): FormArray {
    return clausula.get('paragrafos') as FormArray;
  }

  agregarClausula() {
    this.confirmarAccion("¿Está seguro(a) de agregar la cláusula al contrato?", () => {
      const nuevoIndice = this.clausulas.length;
      const indiceId = this.indices[nuevoIndice]?.Nombre || '';
      this.clausulas.push(this.crearClausulaFormGroup({ nombre: '', descripcion: '', predeterminado: false, paragrafos: [] } as Clausula, indiceId));
      this.actualizarIndices();
      Swal.fire({ title: "Cláusula agregada", icon: "success" });
    });
  }

  eliminarClausula(index: number) {
    this.confirmarAccion("¿Está seguro(a) de eliminar la cláusula del contrato?", () => {
      const clausula = this.clausulas.at(index);
      const clausulaId = clausula.get('id')?.value;
      const esPredeterminada = clausula.get('predeterminado')?.value;

      if (this.clausulas.length > 1) {
        if (!esPredeterminada) {
          this.clausulasParagrafosService.delete(`clausulas`, clausulaId).subscribe({
            next: () => console.log('Cláusula eliminada'),
            error: (error) => this.handleError('Error al eliminar cláusula', error)
          });
          this.eliminarParagrafosAnidados(clausulaId);
        }

        this.clausulas.removeAt(index);
        this.actualizarIndices();
        this.actualizarContrato().then(() => {
          Swal.fire({ title: "Cláusula eliminada", icon: "success" });
        }).catch(error => this.handleError('Error al actualizar contrato después de eliminar cláusula', error));
      } else {
        Swal.fire({ icon: 'warning', title: 'Advertencia', text: 'Debe haber al menos una cláusula' });
      }
    });
  }

  private eliminarParagrafosAnidados(clausulaId: string) {
    this.clausulasParagrafosService.get(`orden-paragrafos?query=contrato_id:${this.contratoId};clausula_id:${clausulaId}`).subscribe({
      next: (response: any) => {
        response.Data?.forEach((ordenParagrafo: any) => {
          const paragrafosPrederminados = ordenParagrafo.paragrafo_ids
            .filter((paragrafo: any) => paragrafo && paragrafo.predeterminado === true)
            .map((paragrafo: any) => paragrafo._id);

          const paragrafosNoPredeterminados = ordenParagrafo.paragrafo_ids
            .filter((paragrafo: any) => paragrafo && paragrafo.predeterminado === false)
            .map((paragrafo: any) => paragrafo._id);

          paragrafosPrederminados.forEach((paragrafoId: string) => {
            this.actualizarOrdenParagrafo(clausulaId, paragrafoId);
          });

          paragrafosNoPredeterminados.forEach((paragrafoId: string) => {
            this.eliminarParagrafoYOrden(clausulaId, paragrafoId);
          });

          this.clausulasParagrafosService.delete(`orden-paragrafos`, ordenParagrafo._id).subscribe({
            next: () => console.log('Orden de parágrafos eliminado'),
            error: (error) => this.handleError('Error al eliminar orden de parágrafos', error)
          });
        });
      },
      error: (error) => this.handleError('Error al obtener órdenes de parágrafos', error)
    });
  }

  agregarParagrafo(clausulaIndex: number) {
    this.confirmarAccion("¿Está seguro(a) de agregar el parágrafo a la cláusula?", () => {
      const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
      const nuevoIndex = paragrafos.length;
      const totalParagrafos = nuevoIndex + 1;
      paragrafos.push(this.crearParagrafoFormGroup(
        { nombre: '', descripcion: '', predeterminado: false } as Paragrafo,
        nuevoIndex,
        totalParagrafos
      ));
      Swal.fire({ title: "Parágrafo agregado", icon: "success" });
    });
  }

  eliminarParagrafo(clausulaIndex: number, paragrafoIndex: number) {
    this.confirmarAccion("¿Está seguro(a) de eliminar el parágrafo de la cláusula?", () => {
      const clausula = this.clausulas.at(clausulaIndex);
      const clausulaId = clausula.get('id')?.value;
      const paragrafos = this.getParagrafos(clausula);
      const paragrafo = paragrafos.at(paragrafoIndex);
      const paragrafoId = paragrafo.get('_id')?.value;
      const esPredeterminado = paragrafo.get('predeterminado')?.value;

      esPredeterminado ? this.actualizarOrdenParagrafo(clausulaId, paragrafoId) : this.eliminarParagrafoYOrden(clausulaId, paragrafoId);

      paragrafos.removeAt(paragrafoIndex);

      Swal.fire({ title: "Parágrafo eliminado", icon: "success" });
    });
  }

  private actualizarOrdenParagrafo(clausulaId: string, paragrafoId: string) {
    this.clausulasParagrafosService.get(`orden-paragrafos?query=contrato_id:${this.contratoId};clausula_id:${clausulaId}`).subscribe({
      next: (response: any) => {
        if (response.Data?.length > 0) {
          const ordenParagrafo = response.Data[0];
          const nuevosParagrafos = ordenParagrafo.paragrafo_ids.filter((p: Paragrafo) => p._id !== paragrafoId);
          if (nuevosParagrafos.length > 0) {
            this.clausulasParagrafosService.put(`orden-paragrafos/${ordenParagrafo._id}`, { paragrafo_ids: nuevosParagrafos, actualizado_por: this.usuarioId }).subscribe({
              next: () => console.log('Orden de parágrafos actualizado'),
              error: (error) => this.handleError('Error al actualizar orden de parágrafos', error)
            });
          } else {
            this.clausulasParagrafosService.delete(`orden-paragrafos`, ordenParagrafo._id).subscribe({
              next: () => console.log('Orden de parágrafos eliminado'),
              error: (error) => this.handleError('Error al eliminar orden de parágrafos', error)
            });
          }
        }
      },
      error: (error) => this.handleError('Error al obtener orden de parágrafos', error)
    });
  }

  private eliminarParagrafoYOrden(clausulaId: string, paragrafoId: string) {
    this.actualizarOrdenParagrafo(clausulaId, paragrafoId);
    this.clausulasParagrafosService.delete(`paragrafos`, paragrafoId).subscribe({
      next: () => console.log('Parágrafo eliminado'),
      error: (error) => this.handleError('Error al eliminar parágrafo', error)
    });
  }

  isClausulaModificada(index: number): boolean {
    const clausula = this.clausulas.at(index) as FormGroup;
    const nombreModificado = clausula.get('nombre')?.dirty ?? false;
    const descripcionClausulaModificada = clausula.get('descripcion')?.dirty ?? false;
    const paragrafos = this.getParagrafos(clausula);
    const algunParagrafoModificado = paragrafos.controls.some(paragrafo =>
      paragrafo.get('descripcion')?.dirty ?? false
    );
    return nombreModificado || descripcionClausulaModificada || algunParagrafoModificado;
  }

  guardarClausula(index: number): void {
    this.confirmarAccion("¿Está seguro(a) que desea guardar la cláusula?", () => {
      const clausula = this.clausulas.at(index) as FormGroup;
      const clausulaId = clausula.get('id')?.value;
      const esPredeterminada = clausula.get('predeterminado')?.value;
      const nombreModificado = clausula.get('nombre')?.dirty;
      const descripcionModificada = clausula.get('descripcion')?.dirty;

      console.log("nombreModificado:" + nombreModificado);
      console.log("descripcionModificada:" + descripcionModificada);

      if ((esPredeterminada || clausulaId === null) && (nombreModificado || descripcionModificada)) {
        this.crearNuevaClausula(clausula);
      } else if ((!esPredeterminada && clausulaId !== null) && (nombreModificado || descripcionModificada)) {
        this.actualizarClausulaExistente(clausula);
      }

      this.actualizarParagrafos(clausulaId, clausula);
      Swal.fire({ title: "Cláusula guardada correctamente", icon: "success" });
    });
  }

  private crearNuevaClausula(clausula: FormGroup) {
    const nuevaClausula = {
      nombre: clausula.get('nombre')?.value,
      descripcion: clausula.get('descripcion')?.value,
      predeterminado: false,
      creado_por: this.usuarioId,
      actualizado_por: this.usuarioId
    };

    console.log(nuevaClausula);

    this.clausulasParagrafosService.post('clausulas', nuevaClausula).subscribe({
      next: (response: any) => {
        const nuevoClausulaId = response.Data._id;
        this.actualizarOrdenClausulaConNueva(clausula.get('id')?.value, nuevoClausulaId);
      },
      error: (error) => this.handleError('Error al crear nueva cláusula', error)
    });
  }

  private actualizarClausulaExistente(clausula: FormGroup) {
    const clausulaActualizada = {
      nombre: clausula.get('nombre')?.value,
      descripcion: clausula.get('descripcion')?.value,
      predeterminado: clausula.get('predeterminado')?.value,
      actualizado_por: this.usuarioId
    };

    this.clausulasParagrafosService.put(`clausulas/${clausula.get('id')?.value}`, clausulaActualizada).subscribe({
      next: () => console.log('Cláusula actualizada'),
      error: (error) => this.handleError('Error al actualizar cláusula', error)
    });
  }

  private actualizarOrdenClausulaConNueva(viejaClausulaId: string, nuevoClausulaId: string) {
    this.clausulasParagrafosService.get(`orden-clausulas?query=contrato_id:${this.contratoId}`).subscribe({
      next: (response: any) => {
        if (response.Data?.length > 0) {
          const ordenClausula = response.Data[0];
          let nuevasClausulas: string[];

          if (viejaClausulaId === null) {
            nuevasClausulas = [...ordenClausula.clausula_ids.map((c: Clausula) => c._id), nuevoClausulaId];
          } else {
            nuevasClausulas = ordenClausula.clausula_ids.map((c: Clausula) =>
              c._id === viejaClausulaId ? nuevoClausulaId : c._id
            );
          }

          const ordenActualizado = {
            clausula_ids: nuevasClausulas,
            contrato_id: this.contratoId,
            actualizado_por: this.usuarioId
          };
          this.clausulasParagrafosService.put(`orden-clausulas/${ordenClausula._id}`, ordenActualizado).subscribe({
            next: () => console.log('Orden de cláusulas actualizado'),
            error: (error) => this.handleError('Error al actualizar orden de cláusulas', error)
          });
        }
      },
      error: (error) => this.handleError('Error al obtener orden de cláusulas', error)
    });
  }

  private actualizarParagrafos(clausulaId: string, clausula: FormGroup) {
    const paragrafos = this.getParagrafos(clausula);
    paragrafos.controls.forEach((paragrafo: AbstractControl) => {
      const paragrafoId = paragrafo.get('_id')?.value;
      const esPredeterminado = paragrafo.get('predeterminado')?.value;
      const descripcionModificada = paragrafo.get('descripcion')?.dirty;

      if (paragrafoId && !esPredeterminado && descripcionModificada) {
        this.actualizarParagrafoExistente(paragrafoId, paragrafo);
      } else if (!paragrafoId || (esPredeterminado && descripcionModificada)) {
        this.crearNuevoParagrafo(clausulaId, paragrafo, paragrafoId);
      }
    });
  }

  private actualizarParagrafoExistente(paragrafoId: string, paragrafo: AbstractControl) {
    const paragrafoActualizado = {
      nombre: paragrafo.get('nombre')?.value,
      descripcion: paragrafo.get('descripcion')?.value,
      predeterminado: paragrafo.get('predeterminado')?.value,
      actualizado_por: this.usuarioId
    };

    this.clausulasParagrafosService.put(`paragrafos/${paragrafoId}`, paragrafoActualizado).subscribe({
      next: () => console.log('Parágrafo actualizado'),
      error: (error) => this.handleError('Error al actualizar parágrafo', error)
    });
  }

  private crearNuevoParagrafo(clausulaId: string, paragrafo: AbstractControl, paragrafoId: string) {
    const nuevoParagrafo = {
      nombre: paragrafo.get('nombre')?.value,
      descripcion: paragrafo.get('descripcion')?.value,
      predeterminado: false,
      creado_por: this.usuarioId,
      actualizado_por: this.usuarioId
    };

    this.clausulasParagrafosService.post('paragrafos', nuevoParagrafo).subscribe({
      next: (response: any) => {
        const nuevoParagrafoId = response.Data._id;
        paragrafo.patchValue({ _id: nuevoParagrafoId, predeterminado: false });
        this.actualizarOrdenParagrafoConNuevo(clausulaId, nuevoParagrafoId, paragrafoId);
      },
      error: (error) => this.handleError('Error al crear nuevo parágrafo', error)
    });
  }

  private actualizarOrdenParagrafoConNuevo(clausulaId: string, nuevoParagrafoId: string, paragrafoId: string) {
    this.clausulasParagrafosService.get(`orden-paragrafos?query=contrato_id:${this.contratoId};clausula_id:${clausulaId}`).subscribe({
      next: (response: any) => {
        if (response.Data?.length > 0) {
          const ordenParagrafo = response.Data[0];
          const nuevosParagrafos = ordenParagrafo.paragrafo_ids
            .filter((p: Paragrafo) => p._id !== paragrafoId)
            .concat(nuevoParagrafoId);

          console.log("nuevosParagrafos");
          console.log(nuevosParagrafos);

          const ordenActualizado = {
            paragrafo_ids: nuevosParagrafos,
            contrato_id: this.contratoId,
            clausula_id: clausulaId,
            actualizado_por: this.usuarioId
          };
          this.clausulasParagrafosService.put(`orden-paragrafos/${ordenParagrafo._id}`, ordenActualizado).subscribe({
            next: () => console.log('Orden de parágrafos actualizado'),
            error: (error) => this.handleError('Error al actualizar orden de parágrafos', error)
          });
        } else {
          this.crearNuevoOrdenParagrafo(clausulaId, [nuevoParagrafoId]);
        }
      },
      error: (error) => this.handleError('Error al obtener orden de parágrafos', error)
    });
  }

  private crearNuevoOrdenParagrafo(clausulaId: string, paragrafoIds: string[]) {
    const nuevoOrdenParagrafo = {
      paragrafo_ids: paragrafoIds,
      contrato_id: this.contratoId,
      clausula_id: clausulaId,
      creado_por: this.usuarioId,
      actualizado_por: this.usuarioId
    };

    this.clausulasParagrafosService.post('orden-paragrafos', nuevoOrdenParagrafo).subscribe({
      next: () => console.log('Nuevo orden de parágrafos creado'),
      error: (error) => this.handleError('Error al crear nuevo orden de parágrafos', error)
    });
  }

  private actualizarContrato(): Promise<void> {
    const contratoActualizado = {
      clausula_ids: this.clausulas.controls.map(c => c.get('id')?.value),
      paragrafos: this.clausulas.controls
        .map(c => ({
          clausula_id: c.get('id')?.value,
          paragrafo_ids: this.getParagrafos(c).controls
            .map(p => p.get('_id')?.value)
            .filter(id => id !== undefined && id !== null)
        }))
        .filter(c => c.paragrafo_ids.length > 0),
      actualizado_por: this.usuarioId
    };

    return new Promise((resolve, reject) => {
      this.clausulasParagrafosService.put(`contratos/${this.contratoId}`, contratoActualizado).subscribe({
        next: (response: any) => {
          if (response.Success) {
            console.log('Contrato actualizado exitosamente');
            resolve();
          } else {
            this.showErrorAlert('Error al actualizar el contrato');
            reject(new Error('Error al actualizar el contrato'));
          }
        },
        error: (error) => {
          this.handleError('Error al actualizar el contrato', error);
          reject(error);
        }
      });
    });
  }

  guardarYContinuar() {
    if (this.form.valid) {
      if (!this.validarIndices()) {
        return;
      }
      this.actualizarContrato().then(() => {
        this.stepper.next();
      }).catch((error) => this.handleError('Error al guardar y continuar', error));
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'Por favor, complete todos los campos requeridos',
      });
    }
  }

  private validarIndices(): boolean {
    const indicesSeleccionados = this.clausulas.controls.map(control => control.get('index')?.value);
    const indicesUnicos = new Set(indicesSeleccionados);

    if (indicesSeleccionados.length !== indicesUnicos.size) {
      this.showErrorAlert('No se permiten índices repetidos en las cláusulas.');
      return false;
    }

    const indicesOrdenados = Array.from(indicesUnicos).sort();
    for (let i = 0; i < indicesOrdenados.length - 1; i++) {
      const indiceActual = this.indices.findIndex(ind => ind.Id === indicesOrdenados[i]);
      const indiceSiguiente = this.indices.findIndex(ind => ind.Id === indicesOrdenados[i + 1]);

      if (indiceSiguiente - indiceActual !== 1) {
        this.showErrorAlert('No se permiten saltos en la secuencia de índices de las cláusulas.');
        return false;
      }
    }

    return true;
  }

  private showErrorAlert(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
    });
  }

  private handleError(message: string, error: any, callback?: () => void) {
    console.error(message, error);
    this.showErrorAlert(message);
    if (callback) callback();
  }

  private confirmarAccion(mensaje: string, accion: () => void) {
    Swal.fire({
      text: mensaje,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "Cancelar",
      confirmButtonText: "Aceptar"
    }).then((result) => {
      if (result.isConfirmed) {
        accion();
      }
    });
  }
}