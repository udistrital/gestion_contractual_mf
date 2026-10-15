import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PdfViewerModalComponent } from '../pdf-viewer-modal/pdf-viewer-modal.component';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { ClausulasParagrafosService } from 'src/app/services/clausulas-paragrafos.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { CdpsService } from 'src/app/services/cdps.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { MatStepper } from '@angular/material/stepper';
import { NgZone } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import  { MinutasMidService } from 'src/app/services/minuta-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { rolPorEstado } from 'src/app/utils/rolesEstados';
import { lastValueFrom } from 'rxjs';
import { ApiResponse, ContratoGeneral, EspecificacionTecnica } from 'src/app/types/types';
import { numeroALetras } from '../paso-info-presupuestal/paso-info-presupuestal.utilidades';

interface Indice {
  Id: string;
  Nombre: string;
}
interface Clausula {
  _id?: string;
  nombre: string;
  descripcion: string;
  predeterminado: boolean;
  es_editable: boolean;
  paragrafos: Paragrafo[];
}
interface Paragrafo {
  _id?: string;
  nombre?: string;
  descripcion: string;
  predeterminado: boolean;
  es_editable: boolean;
}

@Component({
    selector: 'app-paso-clausulas-paragrafos',
    templateUrl: './paso-clausulas-paragrafos.component.html',
    styleUrls: ['./paso-clausulas-paragrafos.component.css'],
    standalone: false
})
export class PasoClausulasParagrafosComponent implements OnInit {
  @Input() contratoGeneral: ContratoGeneral | undefined;
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  roles: string[] = [];
  usuario_id: number = 0;
  estadoInternoActual: number = 0;
  form: FormGroup;
  indices: Indice[] = [];
  contratoId: number = 9512;
  contratoGeneralId: number = 0;
  tipoContratoId: number = 1;
  reversionSaldo: boolean = false;
  aplicaPoliza: boolean = true;
  undadEjecutora: number = environment.UNIDADES_EJECUTORAS.RECTORIA;
  usuarioId: number = 25;

  // Datos contextuales para interpolación de minutas ARGO
  especificacionesList: EspecificacionTecnica[] = [];
  cdpsList: any[] = [];

  // Estado para la vista tipo Explorador / Dos columnas
  clausulaSeleccionadaIndex: number = 0;
  filtroClausulas: string = '';

  constructor(
    private alertService: AlertService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private rolService: RolService,
    private userService: UserService,
    private clausulasParagrafosService: ClausulasParagrafosService,
    private minutasMidService: MinutasMidService,
    private parametrosService: ParametrosService,
    private cdpsService: CdpsService,
    private sanitizer: DomSanitizer,
    private stepper: MatStepper,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({ clausulas: this.fb.array([]) });
  }

  ngOnInit(): void {
    this.roles = this.rolService.getRol();
    this.getIdUsuario();
    this.getContratoGeneralId();
    if (this.contratoGeneralId) {
      this.getEstadoActual();
    }
    this.cargarIndices();
    this.cargarDatosContextoMinuta();
  }

  getRolPorEstado(): string {
    const rolesEsperados = rolPorEstado[this.estadoInternoActual] || [];
    const rolEncontrado = rolesEsperados.find((rol: any) =>
      this.roles.includes(rol)
    );
    return rolEncontrado || '';
  }

  getContratoGeneralId() {
    const contratoGeneral = localStorage.getItem('paso-info-general');
    if (contratoGeneral) {
      const parsedContrato: any = JSON.parse(contratoGeneral);
      this.contratoGeneralId = parsedContrato.id;
    }
  }

  getIdUsuario() {
    this.userService.getPersonaId().then((usuario_id) => {
      this.usuario_id = usuario_id;
    });
  }

  getEstadoActual() {
    this.contratoGeneralCrudService.getEstadoActual(this.contratoGeneralId).subscribe({
      next: (response: any) => {
        if (response.id) {
          this.estadoInternoActual = response.estado_interno_parametro_id || 0;
          console.log(this.estadoInternoActual);
        }
      },
      error: (error) =>
        this.handleError('Error al crear estado de contrato', error),
    });
  }

  get clausulas(): FormArray {
    return this.form.get('clausulas') as FormArray;
  }

  get clausulaActual(): FormGroup | null {
    if (
      this.clausulaSeleccionadaIndex >= 0 &&
      this.clausulaSeleccionadaIndex < this.clausulas.length
    ) {
      return this.clausulas.at(this.clausulaSeleccionadaIndex) as FormGroup;
    }
    return null;
  }

  get clausulasFiltradas(): { control: AbstractControl; index: number }[] {
    const query = (this.filtroClausulas || '').trim().toLowerCase();
    return this.clausulas.controls
      .map((control, index) => ({ control, index }))
      .filter(({ control, index }) => {
        if (!query) return true;
        const nombre = (control.get('nombre')?.value || '').toLowerCase();
        const descripcion = (control.get('descripcion')?.value || '').toLowerCase();
        const indice = this.getIndiceNombre(control.get('index')?.value).toLowerCase();
        const numStr = `clausula ${index + 1}`;
        return (
          nombre.includes(query) ||
          descripcion.includes(query) ||
          indice.includes(query) ||
          numStr.includes(query)
        );
      });
  }

  limpiarFiltro(): void {
    this.filtroClausulas = '';
  }

  getTituloClausula(index: number): string {
    const clausula = this.clausulas.at(index);
    if (!clausula) return `Cláusula ${index + 1}`;
    const indiceNombre = this.getIndiceNombre(clausula.get('index')?.value);
    const nombre = clausula.get('nombre')?.value;
    if (indiceNombre && nombre) {
      return `${indiceNombre}: ${nombre}`;
    }
    return indiceNombre || nombre || `Cláusula ${index + 1}`;
  }

  seleccionarClausula(index: number): void {
    if (this.clausulaSeleccionadaIndex === index) {
      return;
    }

    if (this.isClausulaModificada(this.clausulaSeleccionadaIndex)) {
      const tituloActual = this.getTituloClausula(this.clausulaSeleccionadaIndex);
      Swal.fire({
        title: 'Cambios sin guardar',
        text: `La ${tituloActual} tiene modificaciones sin guardar. ¿Desea guardarla antes de cambiar, o descartar los cambios?`,
        icon: 'warning',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonColor: '#801313',
        denyButtonColor: '#b71c1c',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Guardar y cambiar',
        denyButtonText: 'Descartar y cambiar',
        cancelButtonText: 'Permanecer aquí',
      }).then((result) => {
        if (result.isConfirmed) {
          this.ejecutarGuardarClausula(this.clausulaSeleccionadaIndex);
          this.clausulaSeleccionadaIndex = index;
          this.cdr.detectChanges();
        } else if (result.isDenied) {
          this.clausulaSeleccionadaIndex = index;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.clausulaSeleccionadaIndex = index;
      this.cdr.detectChanges();
    }
  }

  getIndiceNombre(indiceId: string): string {
    if (!indiceId || !this.indices) return '';
    const indice = this.indices.find((i) => i.Id === indiceId);
    return indice ? indice.Nombre : '';
  }

  /**
   * Retorna la lista de índices disponibles para una cláusula específica.
   * Excluye aquellos índices que ya han sido seleccionados por OTRAS cláusulas,
   * preservando únicamente los índices libres y el índice actualmente asignado a esta cláusula.
   */
  getIndicesDisponibles(clausulaIndex: number): Indice[] {
    if (!this.indices || this.indices.length === 0) {
      return [];
    }

    const clausulaActual = this.clausulas.at(clausulaIndex);
    const indiceActualId = clausulaActual?.get('index')?.value?.toString();

    const indicesOcupadosPorOtras = new Set<string>();
    this.clausulas.controls.forEach((control, idx) => {
      if (idx !== clausulaIndex) {
        const val = control.get('index')?.value;
        if (val !== null && val !== undefined && val !== '') {
          indicesOcupadosPorOtras.add(val.toString());
        }
      }
    });

    return this.indices.filter((indice) => {
      const idStr = indice.Id?.toString();
      return idStr === indiceActualId || !indicesOcupadosPorOtras.has(idStr);
    });
  }

  private cargarIndices() {
    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${environment.ENUMERACION_CLAUSULAS_ID},Activo:true&limit=0&sortby=numeroOrden&order=asc&fields=Id,Nombre`
      )
      .subscribe({
        next: (response: any) => {
          if (response.Status === '200') {
            this.indices = response.Data;
            this.cargarContrato();
          }
        },
        error: (error) => this.handleError('Error al cargar índices', error),
      });
  }

  private cargarContrato() {
    this.clausulasParagrafosService
      .get(`contratos/${this.contratoId}`)
      .subscribe({
        next: (response: { Success: boolean; Data: Clausula[] }) => {
          if (response.Success && response.Data?.length > 0) {
            this.cargarContratoExistente(response.Data);
          } else {
            this.cargarPlantillaPorTipoContrato();
          }
        },
        error: (error) =>
          this.handleError('Error al cargar el contrato', error, () =>
            this.cargarPlantillaPorTipoContrato()
          ),
      });
  }

  private cargarPlantillaPorTipoContrato() {
    this.clausulasParagrafosService
      .get(
        `plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}?query=reversion_saldo:${this.reversionSaldo};aplica_poliza:${this.aplicaPoliza};unidad_ejecutora_id:${this.undadEjecutora}`
      )
      .subscribe({
        next: (response: { Success: boolean; Data: Clausula[] }) => {
          if (response.Success && response.Data?.length > 0) {
            this.crearContratoDesdePlantilla(response.Data);
          } else {
            this.alertService.showErrorAlert(
              'No se encontró una plantilla para este tipo de contrato'
            );
          }
        },
        error: (error) =>
          this.handleError(
            'Error al cargar la plantilla por tipo de contrato',
            error
          ),
      });
  }

  private crearContratoDesdePlantilla(clausulas: Clausula[]) {
    const nuevoContrato = {
      clausula_ids: clausulas.map((c) => c._id),
      paragrafos: clausulas
        .map((c) => ({
          clausula_id: c._id,
          paragrafo_ids: c.paragrafos.map((p) => p._id),
        }))
        .filter((p) => p.paragrafo_ids.length > 0),
      creado_por: this.usuarioId,
      actualizado_por: this.usuarioId,
    };

    this.clausulasParagrafosService
      .post(`contratos/${this.contratoId}`, nuevoContrato)
      .subscribe({
        next: (response: any) => {
          if (response.Success && response.Data) {
            this.contratoId = response.Data.ordenClausula.contrato_id;
            this.cargarContratoNuevo(response.Data, clausulas);
            this.alertService.showSuccessAlert(
              'El contrato se ha creado exitosamente desde la plantilla.',
              'Contrato creado'
            );
          } else {
            this.alertService.showErrorAlert(
              'Error al crear el contrato: Respuesta inválida'
            );
          }
        },
        error: (error) =>
          this.handleError(
            'Error al crear el contrato desde la plantilla',
            error
          ),
      });
  }

  private cargarContratoNuevo(data: any, clausulasOriginales: Clausula[]) {
    this.clausulas.clear();
    data.ordenClausula.clausula_ids.forEach(
      (clausulaId: string, index: number) => {
        const clausula = clausulasOriginales.find((c) => c._id === clausulaId);
        if (clausula) {
          const clausulaGroup = this.crearClausulaFormGroup(
            clausula,
            this.indices[index]?.Id || ''
          );
          this.clausulas.push(clausulaGroup);
          const ordenParagrafo = data.ordenParagrafos.find(
            (op: any) => op.clausula_id === clausulaId
          );
          if (ordenParagrafo) {
            const paragrafosArray = clausulaGroup.get(
              'paragrafos'
            ) as FormArray;
            paragrafosArray.clear();
            ordenParagrafo.paragrafo_ids.forEach(
              (paragrafoId: string, pIndex: number) => {
                const paragrafo = clausula.paragrafos.find(
                  (p) => p._id === paragrafoId
                );
                if (paragrafo) {
                  paragrafosArray.push(
                    this.crearParagrafoFormGroup(
                      paragrafo,
                      pIndex,
                      ordenParagrafo.paragrafo_ids.length
                    )
                  );
                }
              }
            );
          }
        }
      }
    );

    this.actualizarIndices();
    this.form.updateValueAndValidity();
  }

  private cargarContratoExistente(clausulas: Clausula[]) {
    this.zone.run(() => {
      this.clausulas.clear();
      clausulas.forEach((clausula, index) => {
        const indiceId = this.indices[index]?.Id || '';
        const clausulaFormGroup = this.crearClausulaFormGroup(
          clausula,
          indiceId
        );
        this.clausulas.push(clausulaFormGroup);
      });
      this.actualizarIndices();
      this.form.updateValueAndValidity();
      this.form.markAsDirty();
    });
  }

  private crearClausulaFormGroup(
    clausula: Clausula,
    indiceId: string
  ): FormGroup {
    const clausulaGroup = this.fb.group({
      id: [clausula._id || null],
      index: [indiceId, Validators.required],
      nombre: [
        {
          value: clausula.nombre,
          disabled: !clausula.es_editable,
        },
        Validators.required,
      ],
      descripcion: [
        {
          value: clausula.descripcion,
          disabled: !clausula.es_editable,
        },
        Validators.required,
      ],
      predeterminado: [clausula.predeterminado],
      es_editable: [clausula.es_editable],
      paragrafos: this.fb.array([]),
    });

    const paragrafosArray = clausulaGroup.get('paragrafos') as FormArray;
    clausula.paragrafos?.forEach((paragrafo: Paragrafo, index: number) => {
      paragrafosArray.push(
        this.crearParagrafoFormGroup(
          paragrafo,
          index,
          clausula.paragrafos?.length || 0
        )
      );
    });

    return clausulaGroup;
  }

  private crearParagrafoFormGroup(
    paragrafo: Paragrafo,
    index: number,
    totalParagrafos: number
  ): FormGroup {
    const paragrafoGroup = this.fb.group({
      _id: [paragrafo._id || null],
      nombre: [
        {
          value: this.generarNombreParagrafo(index, totalParagrafos),
          disabled: !paragrafo.es_editable,
        },
      ],
      descripcion: [
        {
          value: paragrafo.descripcion,
          disabled: !paragrafo.es_editable,
        },
        Validators.required,
      ],
      predeterminado: [paragrafo.predeterminado],
      es_editable: [paragrafo.es_editable],
    });

    return paragrafoGroup;
  }

  isClausulaEditable(index: number): boolean {
    const clausula = this.clausulas.at(index);
    if (!clausula) return false;
    return clausula.get('es_editable')?.value ?? false;
  }

  isParagrafoEditable(clausulaIndex: number, paragrafoIndex: number): boolean {
    const clausula = this.clausulas.at(clausulaIndex);
    if (!clausula) return false;
    const paragrafos = this.getParagrafos(clausula);
    if (!paragrafos) return false;
    const paragrafo = paragrafos.at(paragrafoIndex);
    if (!paragrafo) return false;
    return paragrafo.get('es_editable')?.value ?? false;
  }

  private generarNombreParagrafo(
    index: number,
    totalParagrafos: number
  ): string {
    if (totalParagrafos === 1) {
      return 'PARÁGRAFO.';
    } else {
      const numerales = [
        'PRIMERO',
        'SEGUNDO',
        'TERCERO',
        'CUARTO',
        'QUINTO',
        'SEXTO',
        'SÉPTIMO',
        'OCTAVO',
        'NOVENO',
        'DÉCIMO',
      ];
      return `PARÁGRAFO ${numerales[index] || index + 1}.`;
    }
  }

  private actualizarIndices() {
    this.clausulas.controls.forEach(
      (clausula: AbstractControl, index: number) => {
        clausula.get('index')?.setValue(this.indices[index]?.Id || '');
      }
    );
  }

  getParagrafos(clausula: AbstractControl): FormArray {
    return clausula.get('paragrafos') as FormArray;
  }

  agregarClausula() {
    this.confirmarAccion(
      '¿Está seguro(a) de agregar la cláusula al contrato?',
      () => {
        const nuevoIndice = this.clausulas.length;
        const indiceId = this.indices[nuevoIndice]?.Id || '';
        this.clausulas.push(
          this.crearClausulaFormGroup(
            {
              nombre: '',
              descripcion: '',
              predeterminado: false,
              es_editable: true,
              paragrafos: [],
            } as Clausula,
            indiceId
          )
        );
        this.actualizarIndices();
        this.clausulaSeleccionadaIndex = this.clausulas.length - 1;
        this.cdr.detectChanges();
        this.alertService.showSuccessAlert('Cláusula agregada');
      }
    );
  }

  eliminarClausula(index: number) {
    this.confirmarAccion(
      '¿Está seguro(a) de eliminar la cláusula del contrato?',
      () => {
        const clausula = this.clausulas.at(index);
        const clausulaId = clausula.get('id')?.value;
        const esPredeterminada = clausula.get('predeterminado')?.value;

        if (this.clausulas.length > 1) {
          if (!esPredeterminada) {
            this.clausulasParagrafosService
              .delete(`clausulas`, clausulaId)
              .subscribe({
                next: () => console.log('Cláusula eliminada'),
                error: (error) =>
                  this.handleError('Error al eliminar cláusula', error),
              });
            this.eliminarParagrafosAnidados(clausulaId);
          }

          this.clausulas.removeAt(index);
          this.actualizarIndices();
          if (this.clausulaSeleccionadaIndex >= this.clausulas.length) {
            this.clausulaSeleccionadaIndex = Math.max(0, this.clausulas.length - 1);
          }
          this.cdr.detectChanges();
          this.actualizarContrato()
            .then(() => {
              this.alertService.showSuccessAlert('Cláusula eliminada');
            })
            .catch((error) =>
              this.handleError(
                'Error al actualizar contrato después de eliminar cláusula',
                error
              )
            );
        } else {
          this.alertService.showAlert(
            'Debe haber al menos una cláusula',
            'Advertencia'
          );
        }
      }
    );
  }

  private eliminarParagrafosAnidados(clausulaId: string) {
    this.clausulasParagrafosService
      .get(
        `orden-paragrafos?query=contrato_id:${this.contratoId};clausula_id:${clausulaId}`
      )
      .subscribe({
        next: (response: any) => {
          response.Data?.forEach((ordenParagrafo: any) => {
            const paragrafosPrederminados = ordenParagrafo.paragrafo_ids
              .filter(
                (paragrafo: any) =>
                  paragrafo && paragrafo.predeterminado === true
              )
              .map((paragrafo: any) => paragrafo._id);

            const paragrafosNoPredeterminados = ordenParagrafo.paragrafo_ids
              .filter(
                (paragrafo: any) =>
                  paragrafo && paragrafo.predeterminado === false
              )
              .map((paragrafo: any) => paragrafo._id);

            paragrafosPrederminados.forEach((paragrafoId: string) => {
              this.actualizarOrdenParagrafo(clausulaId, paragrafoId);
            });

            paragrafosNoPredeterminados.forEach((paragrafoId: string) => {
              this.eliminarParagrafoYOrden(clausulaId, paragrafoId);
            });

            this.clausulasParagrafosService
              .delete(`orden-paragrafos`, ordenParagrafo._id)
              .subscribe({
                next: () => console.log('Orden de parágrafos eliminado'),
                error: (error) =>
                  this.handleError(
                    'Error al eliminar orden de parágrafos',
                    error
                  ),
              });
          });
        },
        error: (error) =>
          this.handleError('Error al obtener órdenes de parágrafos', error),
      });
  }

  agregarParagrafo(clausulaIndex: number) {
    this.confirmarAccion(
      '¿Está seguro(a) de agregar el parágrafo a la cláusula?',
      () => {
        const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
        const nuevoIndex = paragrafos.length;
        const totalParagrafos = nuevoIndex + 1;
        paragrafos.push(
          this.crearParagrafoFormGroup(
            {
              nombre: '',
              descripcion: '',
              predeterminado: false,
              es_editable: true,
            } as Paragrafo,
            nuevoIndex,
            totalParagrafos
          )
        );
        this.alertService.showSuccessAlert('Parágrafo agregado');
      }
    );
  }

  eliminarParagrafo(clausulaIndex: number, paragrafoIndex: number) {
    this.confirmarAccion(
      '¿Está seguro(a) de eliminar el parágrafo de la cláusula?',
      () => {
        const clausula = this.clausulas.at(clausulaIndex);
        const clausulaId = clausula.get('id')?.value;
        const paragrafos = this.getParagrafos(clausula);
        const paragrafo = paragrafos.at(paragrafoIndex);
        const paragrafoId = paragrafo.get('_id')?.value;
        const esPredeterminado = paragrafo.get('predeterminado')?.value;

        esPredeterminado
          ? this.actualizarOrdenParagrafo(clausulaId, paragrafoId)
          : this.eliminarParagrafoYOrden(clausulaId, paragrafoId);

        paragrafos.removeAt(paragrafoIndex);

        this.alertService.showSuccessAlert('Parágrafo eliminado');
      }
    );
  }

  private actualizarOrdenParagrafo(clausulaId: string, paragrafoId: string) {
    this.clausulasParagrafosService
      .get(
        `orden-paragrafos?query=contrato_id:${this.contratoId};clausula_id:${clausulaId}`
      )
      .subscribe({
        next: (response: any) => {
          if (response.Data?.length > 0) {
            const ordenParagrafo = response.Data[0];
            const nuevosParagrafos = ordenParagrafo.paragrafo_ids.filter(
              (p: Paragrafo) => p._id !== paragrafoId
            );
            if (nuevosParagrafos.length > 0) {
              this.clausulasParagrafosService
                .put(`orden-paragrafos/${ordenParagrafo._id}`, {
                  paragrafo_ids: nuevosParagrafos,
                  actualizado_por: this.usuarioId,
                })
                .subscribe({
                  next: () => console.log('Orden de parágrafos actualizado'),
                  error: (error) =>
                    this.handleError(
                      'Error al actualizar orden de parágrafos',
                      error
                    ),
                });
            } else {
              this.clausulasParagrafosService
                .delete(`orden-paragrafos`, ordenParagrafo._id)
                .subscribe({
                  next: () => console.log('Orden de parágrafos eliminado'),
                  error: (error) =>
                    this.handleError(
                      'Error al eliminar orden de parágrafos',
                      error
                    ),
                });
            }
          }
        },
        error: (error) =>
          this.handleError('Error al obtener orden de parágrafos', error),
      });
  }

  private eliminarParagrafoYOrden(clausulaId: string, paragrafoId: string) {
    this.actualizarOrdenParagrafo(clausulaId, paragrafoId);
    this.clausulasParagrafosService
      .delete(`paragrafos`, paragrafoId)
      .subscribe({
        next: () => console.log('Parágrafo eliminado'),
        error: (error) =>
          this.handleError('Error al eliminar parágrafo', error),
      });
  }

  isClausulaModificada(index: number): boolean {
    const clausula = this.clausulas.at(index) as FormGroup;
    if (!clausula) {
      return false;
    }
    if (!clausula.get('es_editable')?.value) {
      return false;
    }

    const nombreModificado = clausula.get('nombre')?.dirty ?? false;
    const descripcionClausulaModificada =
      clausula.get('descripcion')?.dirty ?? false;
    const paragrafos = this.getParagrafos(clausula);
    const algunParagrafoModificado = paragrafos
      ? paragrafos.controls.some(
          (paragrafo) =>
            paragrafo.get('es_editable')?.value &&
            (paragrafo.get('descripcion')?.dirty ?? false)
        )
      : false;
    return (
      nombreModificado ||
      descripcionClausulaModificada ||
      algunParagrafoModificado
    );
  }

  guardarClausula(index: number): void {
    this.confirmarAccion(
      '¿Está seguro(a) que desea guardar la cláusula?',
      () => {
        this.ejecutarGuardarClausula(index);
      }
    );
  }

  ejecutarGuardarClausula(index: number): void {
    const clausula = this.clausulas.at(index) as FormGroup;
    if (!clausula) return;
    const clausulaId = clausula.get('id')?.value;
    const esPredeterminada = clausula.get('predeterminado')?.value;
    const nombreModificado = clausula.get('nombre')?.dirty;
    const descripcionModificada = clausula.get('descripcion')?.dirty;

    console.log('nombreModificado:' + nombreModificado);
    console.log('descripcionModificada:' + descripcionModificada);

    if (
      (esPredeterminada || clausulaId === null) &&
      (nombreModificado || descripcionModificada)
    ) {
      this.crearNuevaClausula(clausula);
    } else if (
      !esPredeterminada &&
      clausulaId !== null &&
      (nombreModificado || descripcionModificada)
    ) {
      this.actualizarClausulaExistente(clausula);
    }

    this.actualizarParagrafos(clausulaId, clausula);

    // Reiniciar dirty en los controles guardados
    clausula.markAsPristine();
    this.getParagrafos(clausula).controls.forEach((paragrafo) =>
      paragrafo.markAsPristine()
    );

    this.alertService.showSuccessAlert('Cláusula guardada correctamente');
  }

  private crearNuevaClausula(clausula: FormGroup) {
    const nuevaClausula = {
      nombre: clausula.get('nombre')?.value,
      descripcion: clausula.get('descripcion')?.value,
      predeterminado: false,
      creado_por: this.usuarioId,
      actualizado_por: this.usuarioId,
    };

    console.log(nuevaClausula);

    this.clausulasParagrafosService.post('clausulas', nuevaClausula).subscribe({
      next: (response: any) => {
        const nuevoClausulaId = response.Data._id;
        this.actualizarOrdenClausulaConNueva(
          clausula.get('id')?.value,
          nuevoClausulaId
        );
      },
      error: (error) =>
        this.handleError('Error al crear nueva cláusula', error),
    });
  }

  private actualizarClausulaExistente(clausula: FormGroup) {
    const clausulaActualizada = {
      nombre: clausula.get('nombre')?.value,
      descripcion: clausula.get('descripcion')?.value,
      predeterminado: clausula.get('predeterminado')?.value,
      actualizado_por: this.usuarioId,
    };

    this.clausulasParagrafosService
      .put(`clausulas/${clausula.get('id')?.value}`, clausulaActualizada)
      .subscribe({
        next: () => console.log('Cláusula actualizada'),
        error: (error) =>
          this.handleError('Error al actualizar cláusula', error),
      });
  }

  private actualizarOrdenClausulaConNueva(
    viejaClausulaId: string,
    nuevoClausulaId: string
  ) {
    this.clausulasParagrafosService
      .get(`orden-clausulas?query=contrato_id:${this.contratoId}`)
      .subscribe({
        next: (response: any) => {
          if (response.Data?.length > 0) {
            const ordenClausula = response.Data[0];
            let nuevasClausulas: string[];

            if (viejaClausulaId === null) {
              nuevasClausulas = [
                ...ordenClausula.clausula_ids.map((c: Clausula) => c._id),
                nuevoClausulaId,
              ];
            } else {
              nuevasClausulas = ordenClausula.clausula_ids.map((c: Clausula) =>
                c._id === viejaClausulaId ? nuevoClausulaId : c._id
              );
            }

            const ordenActualizado = {
              clausula_ids: nuevasClausulas,
              contrato_id: this.contratoId,
              actualizado_por: this.usuarioId,
            };
            this.clausulasParagrafosService
              .put(`orden-clausulas/${ordenClausula._id}`, ordenActualizado)
              .subscribe({
                next: () => console.log('Orden de cláusulas actualizado'),
                error: (error) =>
                  this.handleError(
                    'Error al actualizar orden de cláusulas',
                    error
                  ),
              });
          }
        },
        error: (error) =>
          this.handleError('Error al obtener orden de cláusulas', error),
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

  private actualizarParagrafoExistente(
    paragrafoId: string,
    paragrafo: AbstractControl
  ) {
    const paragrafoActualizado = {
      nombre: paragrafo.get('nombre')?.value,
      descripcion: paragrafo.get('descripcion')?.value,
      predeterminado: paragrafo.get('predeterminado')?.value,
      actualizado_por: this.usuarioId,
    };

    this.clausulasParagrafosService
      .put(`paragrafos/${paragrafoId}`, paragrafoActualizado)
      .subscribe({
        next: () => console.log('Parágrafo actualizado'),
        error: (error) =>
          this.handleError('Error al actualizar parágrafo', error),
      });
  }

  private crearNuevoParagrafo(
    clausulaId: string,
    paragrafo: AbstractControl,
    paragrafoId: string
  ) {
    const nuevoParagrafo = {
      nombre: paragrafo.get('nombre')?.value,
      descripcion: paragrafo.get('descripcion')?.value,
      predeterminado: false,
      creado_por: this.usuarioId,
      actualizado_por: this.usuarioId,
    };

    this.clausulasParagrafosService
      .post('paragrafos', nuevoParagrafo)
      .subscribe({
        next: (response: any) => {
          const nuevoParagrafoId = response.Data._id;
          paragrafo.patchValue({
            _id: nuevoParagrafoId,
            predeterminado: false,
          });
          this.actualizarOrdenParagrafoConNuevo(
            clausulaId,
            nuevoParagrafoId,
            paragrafoId
          );
        },
        error: (error) =>
          this.handleError('Error al crear nuevo parágrafo', error),
      });
  }

  private actualizarOrdenParagrafoConNuevo(
    clausulaId: string,
    nuevoParagrafoId: string,
    paragrafoId: string
  ) {
    this.clausulasParagrafosService
      .get(
        `orden-paragrafos?query=contrato_id:${this.contratoId};clausula_id:${clausulaId}`
      )
      .subscribe({
        next: (response: any) => {
          if (response.Data?.length > 0) {
            const ordenParagrafo = response.Data[0];
            const nuevosParagrafos = ordenParagrafo.paragrafo_ids
              .filter((p: Paragrafo) => p._id !== paragrafoId)
              .concat(nuevoParagrafoId);

            console.log('nuevosParagrafos');
            console.log(nuevosParagrafos);

            const ordenActualizado = {
              paragrafo_ids: nuevosParagrafos,
              contrato_id: this.contratoId,
              clausula_id: clausulaId,
              actualizado_por: this.usuarioId,
            };
            this.clausulasParagrafosService
              .put(`orden-paragrafos/${ordenParagrafo._id}`, ordenActualizado)
              .subscribe({
                next: () => console.log('Orden de parágrafos actualizado'),
                error: (error) =>
                  this.handleError(
                    'Error al actualizar orden de parágrafos',
                    error
                  ),
              });
          } else {
            this.crearNuevoOrdenParagrafo(clausulaId, [nuevoParagrafoId]);
          }
        },
        error: (error) =>
          this.handleError('Error al obtener orden de parágrafos', error),
      });
  }

  private crearNuevoOrdenParagrafo(clausulaId: string, paragrafoIds: string[]) {
    const nuevoOrdenParagrafo = {
      paragrafo_ids: paragrafoIds,
      contrato_id: this.contratoId,
      clausula_id: clausulaId,
      creado_por: this.usuarioId,
      actualizado_por: this.usuarioId,
    };

    this.clausulasParagrafosService
      .post('orden-paragrafos', nuevoOrdenParagrafo)
      .subscribe({
        next: () => console.log('Nuevo orden de parágrafos creado'),
        error: (error) =>
          this.handleError('Error al crear nuevo orden de parágrafos', error),
      });
  }

  private actualizarContrato(): Promise<void> {
    const contratoActualizado = {
      clausula_ids: this.clausulas.controls.map((c) => c.get('id')?.value),
      paragrafos: this.clausulas.controls
        .map((c) => ({
          clausula_id: c.get('id')?.value,
          paragrafo_ids: this.getParagrafos(c)
            .controls.map((p) => p.get('_id')?.value)
            .filter((id) => id !== undefined && id !== null),
        }))
        .filter((c) => c.paragrafo_ids.length > 0),
      actualizado_por: this.usuarioId,
    };

    return new Promise((resolve, reject) => {
      this.clausulasParagrafosService
        .put(`contratos/${this.contratoId}`, contratoActualizado)
        .subscribe({
          next: (response: any) => {
            if (response.Success) {
              console.log('Contrato actualizado exitosamente');
              resolve();
            } else {
              this.alertService.showErrorAlert(
                'Error al actualizar el contrato'
              );
              reject(new Error('Error al actualizar el contrato'));
            }
          },
          error: (error) => {
            this.handleError('Error al actualizar el contrato', error);
            reject(error);
          },
        });
    });
  }

  guardarYContinuar() {
    if (this.form.valid) {
      if (!this.validarIndices()) {
        return;
      }
      this.actualizarContrato()
        .then(() => {
          this.stepper.next();
        })
        .catch((error) =>
          this.handleError('Error al guardar y continuar', error)
        );
    } else {
      this.alertService.showAlert(
        'Por favor, complete todos los campos requeridos',
        'Formulario inválido'
      );
    }
  }

  private validarIndices(): boolean {
    const indicesSeleccionados = this.clausulas.controls.map(
      (control) => control.get('index')?.value
    );
    const indicesUnicos = new Set(indicesSeleccionados);

    if (indicesSeleccionados.length !== indicesUnicos.size) {
      this.alertService.showErrorAlert(
        'No se permiten índices repetidos en las cláusulas.'
      );
      return false;
    }

    const indicesOrdenados = Array.from(indicesUnicos).sort();
    for (let i = 0; i < indicesOrdenados.length - 1; i++) {
      const indiceActual = this.indices.findIndex(
        (ind) => ind.Id === indicesOrdenados[i]
      );
      const indiceSiguiente = this.indices.findIndex(
        (ind) => ind.Id === indicesOrdenados[i + 1]
      );

      if (indiceSiguiente - indiceActual !== 1) {
        this.alertService.showErrorAlert(
          'No se permiten saltos en la secuencia de índices de las cláusulas.'
        );
        return false;
      }
    }

    return true;
  }

  private handleError(message: string, error: any, callback?: () => void) {
    console.error(message, error);
    this.alertService.showErrorAlert(message);
    if (callback) callback();
  }

  private confirmarAccion(mensaje: string, accion: () => void) {
    Swal.fire({
      text: mensaje,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar',
    }).then((result) => {
      if (result.isConfirmed) {
        accion();
      }
    });
  }

  // Función para convertir una cadena Base64 en un Blob
  base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  async openPdfViewer() {
    if (!this.contratoGeneralId) {
      this.getContratoGeneralId();
      if (!this.contratoGeneralId) {
        this.alertService.showErrorAlert(
          'No se ha guardado el contrato general. Por favor, complete la información general antes de continuar.'
        )
      }
    }
    const base64: ApiResponse<string> = await lastValueFrom(this.minutasMidService.getMinuta(this.contratoGeneralId));
    const file = this.base64ToBlob(base64.Data, 'application/pdf');
    const datos = {
      base64: base64.Data,
      nombre: `MINUTA ${this.contratoId}`,
      descripcion: `Cargue de minuta firmada, contrato general id ${this.contratoGeneralId}`,
      contrato_general_id: this.contratoGeneralId,
      usuario_id: this.usuarioId,
      usuario_rol: this.getRolPorEstado(),
    };

    this.dialog.open(PdfViewerModalComponent, {
      width: '70vw',
      data: { file, datos },
    });
  }

  // =========================================================================
  // Renderizado Dinámico de Variables y Condicionales de Minuta
  // =========================================================================

  cargarDatosContextoMinuta(): void {
    // 1. CDPs
    this.cdpsList = this.cdpsService.getLocalCDP();
    this.cdpsService.cdp$.subscribe((cdps) => {
      if (cdps && cdps.length > 0) {
        this.cdpsList = cdps;
      }
    });

    // 2. Especificaciones Técnicas
    try {
      const savedEsp = localStorage.getItem('paso-especificaciones-data');
      if (savedEsp) {
        const parsed = JSON.parse(savedEsp);
        if (Array.isArray(parsed)) {
          this.especificacionesList = parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo paso-especificaciones-data local:', e);
    }

    if (this.especificacionesList.length === 0 && this.contratoGeneralId) {
      this.contratoGeneralCrudService
        .getEspecificacionesTecnicas(this.contratoGeneralId)
        .subscribe({
          next: (res) => {
            if (res.Success && Array.isArray(res.Data) && res.Data.length > 0) {
              this.especificacionesList = res.Data;
            }
          },
          error: (err) => console.log('Sin especificaciones previas en backend:', err),
        });
    }

    // 3. Fallback contratoGeneral si no viene como @Input
    if (!this.contratoGeneral) {
      try {
        const savedGen = localStorage.getItem('paso-info-general');
        if (savedGen) {
          this.contratoGeneral = JSON.parse(savedGen);
        }
      } catch (e) {
        console.warn('Error leyendo paso-info-general local:', e);
      }
    }
  }

  obtenerListaCDPs(): any[] {
    const cdpsMem = this.cdpsService.getLocalCDP();
    if (cdpsMem && cdpsMem.length > 0) {
      return cdpsMem;
    }
    if (this.cdpsList && this.cdpsList.length > 0) {
      return this.cdpsList;
    }
    try {
      const saved = localStorage.getItem('paso-info-presupuestal-cdps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [];
  }

  obtenerListaEspecificaciones(): EspecificacionTecnica[] {
    try {
      const saved = localStorage.getItem('paso-especificaciones-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return this.especificacionesList || [];
  }

  obtenerObjetoContrato(): string {
    try {
      const savedObl = localStorage.getItem('paso-obligaciones');
      if (savedObl) {
        const parsed = JSON.parse(savedObl);
        if (parsed.objeto && parsed.objeto.trim()) {
          return parsed.objeto.trim();
        }
      }
    } catch {}
    if (this.contratoGeneral?.objeto && this.contratoGeneral.objeto.trim()) {
      return this.contratoGeneral.objeto.trim();
    }
    try {
      const gen = localStorage.getItem('paso-info-general');
      if (gen) {
        const parsed = JSON.parse(gen);
        if (parsed.objeto && parsed.objeto.trim()) {
          return parsed.objeto.trim();
        }
      }
    } catch {}
    return '';
  }

  obtenerActividadesContrato(): string {
    try {
      const savedObl = localStorage.getItem('paso-obligaciones');
      if (savedObl) {
        const parsed = JSON.parse(savedObl);
        if (parsed.actividades && parsed.actividades.trim()) {
          return parsed.actividades.trim();
        }
      }
    } catch {}
    try {
      const savedActs = localStorage.getItem('paso-obligaciones-actividades');
      if (savedActs) {
        const acts = JSON.parse(savedActs);
        if (Array.isArray(acts) && acts.length > 0) {
          return acts
            .map((act: any, idx: number) => {
              const num = (idx + 1).toString().padStart(2, '0');
              let p = `${num}. ${(act.descripcion || '').trim()}`;
              if (act.entregables && act.entregables.length > 0) {
                const ent = act.entregables
                  .filter((e: any) => !!e && e.trim())
                  .join('; ');
                if (ent) p += ` Entregable(s): ${ent}.`;
              }
              if (act.plazo && act.plazo.trim()) {
                p += ` Plazo/Periodicidad: ${act.plazo.trim()}.`;
              }
              return p;
            })
            .join('\n\n');
        }
      }
    } catch {}
    if (this.contratoGeneral?.actividades && this.contratoGeneral.actividades.trim()) {
      return this.contratoGeneral.actividades.trim();
    }
    return '';
  }

  obtenerValorContrato(): { valorNum: number; valorTexto: string; valorPesos: string } {
    let valorNum = 0;
    if (this.contratoGeneral?.valor_pesos && Number(this.contratoGeneral.valor_pesos) > 0) {
      valorNum = Number(this.contratoGeneral.valor_pesos);
    } else {
      try {
        const gen = localStorage.getItem('paso-info-general');
        if (gen) {
          const parsed = JSON.parse(gen);
          const v = Number(parsed.valor_pesos || parsed.valorContrato);
          if (!isNaN(v) && v > 0) {
            valorNum = v;
          }
        }
      } catch {}
    }

    if (valorNum <= 0) {
      const cdps = this.obtenerListaCDPs();
      if (cdps.length > 0) {
        valorNum = cdps.reduce((acc, curr) => {
          const v = curr.valor_a_tomar !== undefined && curr.valor_a_tomar !== null && curr.valor_a_tomar !== ''
            ? Number(curr.valor_a_tomar)
            : Number(curr.valor_contratacion);
          return acc + (isNaN(v) ? 0 : v);
        }, 0);
      }
    }

    const valorTexto = numeroALetras(valorNum).toUpperCase();
    const valorPesos = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valorNum);
    return { valorNum, valorTexto, valorPesos };
  }

  formatearMoneda(valor: any): string {
    const num = Number(valor);
    if (isNaN(num)) return '$ 0';
    return '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(num);
  }

  renderizarDescripcionClausula(contenido: string): SafeHtml {
    if (!contenido || typeof contenido !== 'string') {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    let render = contenido;

    // 1. Manejo del bloque Jinja2 de especificaciones técnicas:
    // {% if especificaciones %}...{% endif %} o [% if especificaciones %]...[% endif %]
    const regexBloqueEsp = /(?:\{%|\[%|%)\s*if\s+especificaciones\s*(?:%\}|%\]|%)([\s\S]*?)(?:\{%|\[%|%)\s*endif\s*(?:%\}|%\]|%)/gi;
    const especificaciones = this.obtenerListaEspecificaciones();

    if (regexBloqueEsp.test(render)) {
      if (especificaciones && especificaciones.length > 0) {
        const totalEsp = especificaciones.reduce(
          (acc, curr) => acc + (Number(curr.valor_total) || 0),
          0
        );
        const filasHtml = especificaciones
          .map(
            (esp, idx) => `
            <tr>
              <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
              <td style="text-align: left;">${esp.descripcion || ''}</td>
              <td style="text-align: center;">${esp.cantidad ?? 1}</td>
              <td style="text-align: right;">${this.formatearMoneda(esp.valor_unitario)}</td>
              <td style="text-align: right; font-weight: 600;">${this.formatearMoneda(esp.valor_total)}</td>
            </tr>
          `
          )
          .join('');

        const tablaEspHtml = `
          <div class="especificaciones-minuta-render my-3">
            <div class="table-responsive">
              <table class="table-minuta-render">
                <thead>
                  <tr>
                    <th style="width: 8%; text-align: center;">ITEM</th>
                    <th style="text-align: left;">DESCRIPCIÓN</th>
                    <th style="width: 12%; text-align: center;">CANTIDAD</th>
                    <th style="width: 20%; text-align: right;">VALOR UNITARIO</th>
                    <th style="width: 20%; text-align: right;">VALOR TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  ${filasHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <th colspan="4" style="text-align: right; font-weight: bold;">TOTAL ESPECIFICACIONES:</th>
                    <th class="text-right font-bold total-highlight" style="text-align: right; color: #801313;">${this.formatearMoneda(totalEsp)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        `;
        render = render.replace(regexBloqueEsp, tablaEspHtml);
      } else {
        render = render.replace(regexBloqueEsp, '');
      }
    }

    // 2. Interpolación de Objeto del Contrato
    const objeto = this.obtenerObjetoContrato();
    render = render.replace(
      /\{\{\s*objeto\s*\}\}/gi,
      objeto || '<span class="minuta-var-placeholder">[Objeto del contrato pendiente de definir]</span>'
    );

    // 3. Interpolación de Actividades Específicas
    const actividades = this.obtenerActividadesContrato();
    if (/\{\{\s*actividades\s*\}\}/gi.test(render)) {
      if (actividades) {
        const actividadesFormateadas = actividades
          .split(/\n\s*\n/)
          .filter((p) => !!p.trim())
          .map((p) => `<p class="actividad-parrafo mb-2">${p.replace(/\n/g, '<br>')}</p>`)
          .join('');
        const actividadesHtml = `
          <div class="actividades-minuta-render my-2">
            ${actividadesFormateadas}
          </div>
        `;
        render = render.replace(/\{\{\s*actividades\s*\}\}/gi, actividadesHtml);
      } else {
        render = render.replace(
          /\{\{\s*actividades\s*\}\}/gi,
          '<span class="minuta-var-placeholder">[Actividades específicas pendientes de registrar]</span>'
        );
      }
    }

    // 4. Cláusula de Valor y Presupuesto (Manejo singular y Múltiples CDPs)
    const { valorTexto, valorPesos } = this.obtenerValorContrato();
    render = render.replace(/\{\{\s*valorTexto\s*\}\}/gi, valorTexto || '[VALOR EN LETRAS]');
    render = render.replace(/\{\{\s*valorPesos\s*\}\}/gi, valorPesos || '0');

    const cdps = this.obtenerListaCDPs();

    if (cdps && cdps.length > 1) {
      // CASO MÚLTIPLES CDPS:
      // Se transforma la referencia singular a plural e imputación desglosada
      const totalComprometido = cdps.reduce((acc, curr) => {
        const v = curr.valor_a_tomar !== undefined && curr.valor_a_tomar !== null && curr.valor_a_tomar !== ''
          ? Number(curr.valor_a_tomar)
          : Number(curr.valor_contratacion);
        return acc + (isNaN(v) ? 0 : v);
      }, 0);

      const filasCdps = cdps
        .map((cdp) => {
          const noCdp = cdp.numero_disponibilidad || cdp.numero_cdp_id || 'N/A';
          const vig = cdp.vigencia || cdp.vigencia_cdp || 'N/A';
          const rubro = cdp.descripcion || cdp.rubro || cdp.nombre_dependencia || 'N/A';
          const val = cdp.valor_a_tomar !== undefined && cdp.valor_a_tomar !== null && cdp.valor_a_tomar !== ''
            ? Number(cdp.valor_a_tomar)
            : Number(cdp.valor_contratacion);
          return `
            <tr>
              <td style="text-align: center; font-weight: 600;">${noCdp}</td>
              <td style="text-align: center;">${vig}</td>
              <td style="text-align: left;">${rubro}</td>
              <td style="text-align: right; font-weight: 600;">${this.formatearMoneda(val)}</td>
            </tr>
          `;
        })
        .join('');

      const tablaCdpsHtml = `
        con cargo a los siguientes Certificados de Disponibilidad Presupuestal:
        <div class="multiple-cdps-wrapper my-3">
          <div class="table-responsive">
            <table class="table-minuta-render table-cdps">
              <thead>
                <tr>
                  <th style="width: 16%; text-align: center;">No. CDP</th>
                  <th style="width: 14%; text-align: center;">Vigencia</th>
                  <th style="text-align: left;">Rubro / Dependencia</th>
                  <th style="width: 25%; text-align: right;">Valor a Tomar</th>
                </tr>
              </thead>
              <tbody>
                ${filasCdps}
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="3" style="text-align: right; font-weight: bold;">TOTAL PRESUPUESTADO:</th>
                  <th class="text-right font-bold total-highlight" style="text-align: right; color: #801313;">${this.formatearMoneda(totalComprometido)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;

      const regexFraseSingularCdp = /con\s+cargo\s+al\s+certificado\s+de\s+Disponibilidad\s+Presupuestal\s+No\.?\s*\{\{\s*numero_cdp_id\s*\}\}\s*del\s+a(?:ñ|n)o\s*\{\{\s*vigencia_cdp\s*\}\}\.?\s*Rubro:\s*\{\{\s*rubro_cdp\s*\}\}\.?/gi;

      if (regexFraseSingularCdp.test(render)) {
        render = render.replace(regexFraseSingularCdp, tablaCdpsHtml);
      } else {
        render = render.replace(
          /\{\{\s*numero_cdp_id\s*\}\}/gi,
          cdps.map((c) => c.numero_disponibilidad || c.numero_cdp_id).join(', ')
        );
        render = render.replace(
          /\{\{\s*vigencia_cdp\s*\}\}/gi,
          [...new Set(cdps.map((c) => c.vigencia || c.vigencia_cdp))].join(', ')
        );
        render = render.replace(
          /\{\{\s*rubro_cdp\s*\}\}/gi,
          cdps.map((c) => c.descripcion || c.rubro || c.nombre_dependencia).filter(Boolean).join('; ')
        );
      }
    } else if (cdps && cdps.length === 1) {
      // CASO UN SOLO CDP:
      const cdp = cdps[0];
      const noCdp = (cdp.numero_disponibilidad || cdp.numero_cdp_id || '').toString();
      const vig = (cdp.vigencia || cdp.vigencia_cdp || '').toString();
      const rubro = cdp.descripcion || cdp.rubro || cdp.nombre_dependencia || '';

      render = render.replace(/\{\{\s*numero_cdp_id\s*\}\}/gi, noCdp || '<span class="minuta-var-placeholder">[No. CDP]</span>');
      render = render.replace(/\{\{\s*vigencia_cdp\s*\}\}/gi, vig || '<span class="minuta-var-placeholder">[Vigencia]</span>');
      render = render.replace(/\{\{\s*rubro_cdp\s*\}\}/gi, rubro || '<span class="minuta-var-placeholder">[Rubro]</span>');
    } else {
      // CASO SIN CDPS AÚN:
      render = render.replace(/\{\{\s*numero_cdp_id\s*\}\}/gi, '<span class="minuta-var-placeholder">[No. CDP pendiente]</span>');
      render = render.replace(/\{\{\s*vigencia_cdp\s*\}\}/gi, '<span class="minuta-var-placeholder">[Vigencia]</span>');
      render = render.replace(/\{\{\s*rubro_cdp\s*\}\}/gi, '<span class="minuta-var-placeholder">[Rubro pendiente]</span>');
    }

    // 5. Otras variables de minuta
    if (this.contratoGeneral?.plazo_ejecucion) {
      render = render.replace(/\{\{\s*(?:plazo|plazo_ejecucion)\s*\}\}/gi, `${this.contratoGeneral.plazo_ejecucion}`);
    }

    return this.sanitizer.bypassSecurityTrustHtml(render);
  }
}
