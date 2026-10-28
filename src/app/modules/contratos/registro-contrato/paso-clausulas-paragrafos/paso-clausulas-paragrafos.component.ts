import { ChangeDetectorRef, Component, effect, inject, input, OnInit, OnChanges, output } from '@angular/core';
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
import { MatStepper } from '@angular/material/stepper';
import { NgZone } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { MinutasMidService } from 'src/app/services/minuta-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { rolPorEstado } from 'src/app/utils/rolesEstados';
import { finalize, lastValueFrom } from 'rxjs';
import { ApiResponse, ContratoGeneral, EspecificacionTecnica } from 'src/app/types/types';
import { numeroALetras } from '../paso-info-presupuestal/paso-info-presupuestal.utilidades';
import { base64ToBlob } from 'src/app/utils/file-conversor';

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
export class PasoClausulasParagrafosComponent implements OnInit, OnChanges {
  nextStep = output<void>();
  stepCompleted = output<boolean>();
  contratoGeneral = input<ContratoGeneral>()

  roles: string[] = [];
  usuario_id: number = 0;
  estadoInternoActual: number = 0;
  form: FormGroup;
  indices: Indice[] = [];
  contratoId: number = 0;
  tipoContratoId: number = 1;
  reversionSaldo: boolean = false;
  aplicaPoliza: boolean = true;
  undadEjecutora: number = environment.UNIDADES_EJECUTORAS.RECTORIA;
  usuarioId: number = 25;
  private contratoCargadoId: number = 0;
  private cargandoContrato: boolean = false;
  private contextoMinutaCargado: boolean = false;
  private estadoActualCargadoId: number = 0;

  // Datos contextuales para interpolación de minutas ARGO
  especificacionesList: EspecificacionTecnica[] = [];
  cdpsList: any[] = [];

  // Estado para la vista tipo Explorador / Dos columnas
  clausulaSeleccionadaIndex: number = 0;
  filtroClausulas: string = '';

  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly contratoGeneralCrudService = inject(ContratoGeneralCrudService);
  private readonly rolService = inject(RolService);
  private readonly userService = inject(UserService);
  private readonly clausulasParagrafosService = inject(ClausulasParagrafosService);
  private readonly minutasMidService = inject(MinutasMidService);
  private readonly parametrosService = inject(ParametrosService);
  private readonly cdpsService = inject(CdpsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly stepper = inject(MatStepper);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.form = this.fb.group({ clausulas: this.fb.array([]) });
    effect(() => {
      if (this.contratoGeneral()) {
        this.sincronizarContratoGeneral();
      }
    });
  }

  ngOnInit(): void {
    this.roles = this.rolService.getRol();
    this.getIdUsuario();
    this.cargarIndices();
    this.cargarDatosContextoMinuta();
    if (this.contratoGeneral()) {
      this.sincronizarContratoGeneral();
    }
  }

  ngOnChanges(): void {
    this.sincronizarContratoGeneral();
  }

  private sincronizarContratoGeneral(): void {
    const c = this.contratoGeneral();
    if (!c) return;

    const id = c.id ?? (c as any).Id ?? (c as any).contrato_id;
    if (id && Number(id) > 0) {
      this.contratoId = Number(id);
    }

    const tipoId = c.tipo_contrato_id ?? (c as any).TipoContratoId ?? (c as any).tipo_contrato;
    if (tipoId && Number(tipoId) > 0) {
      this.tipoContratoId = Number(tipoId);
    }

    const ue = c.unidad_ejecutora_id ?? (c as any).UnidadEjecutoraId;
    if (ue && Number(ue) > 0) {
      this.undadEjecutora = Number(ue);
    }

    if (c.aplica_poliza !== undefined && c.aplica_poliza !== null) {
      this.aplicaPoliza = Boolean(c.aplica_poliza);
    }

    this.getEstadoActual();
    this.cargarDatosContextoMinuta();

    if (this.contratoId > 0 && (this.contratoCargadoId !== this.contratoId || this.clausulas.length === 0) && !this.cargandoContrato) {
      this.contratoCargadoId = this.contratoId;
      this.cargarContrato();
    }
  }

  getRolPorEstado(): string {
    const rolesEsperados = rolPorEstado[this.estadoInternoActual] || [];
    const rolEncontrado = rolesEsperados.find((rol: any) =>
      this.roles.includes(rol)
    );
    return rolEncontrado || '';
  }

  getIdUsuario() {
    this.userService.getPersonaId().then((usuario_id) => {
      this.usuario_id = usuario_id;
    });
  }

  getEstadoActual() {
    const cId = this.contratoId || this.contratoGeneral()?.id;
    if (!cId || cId <= 0 || this.estadoActualCargadoId === cId) return;
    this.estadoActualCargadoId = cId;

    this.contratoGeneralCrudService.getEstadoActual(cId).subscribe({
      next: (response: any) => {
        if (response && (response.id || response.Id)) {
          this.estadoInternoActual = response.estado_interno_parametro_id || response.EstadoInternoParametroId || 0;
        }
      },
      error: (error) => {
        console.warn('Estado actual no encontrado o pendiente de registrar:', error);
      },
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
      this.alertService.showConfirmAlert(
        `La ${tituloActual} tiene modificaciones sin guardar. ¿Desea guardarla antes de cambiar, o descartar los cambios?`,
        'Cambios sin guardar'
      ).then((result) => {
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
    const indice = this.indices.find((i) => String(i.Id) === String(indiceId));
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
          const data = response?.Data ?? response?.Body ?? response;
          if (Array.isArray(data)) {
            this.indices = data;
          } else if (Array.isArray(data?.Data)) {
            this.indices = data.Data;
          }
          if (this.clausulas.length > 0) {
            this.actualizarIndices();
          } else if (this.contratoId > 0 && (this.contratoCargadoId !== this.contratoId || this.clausulas.length === 0) && !this.cargandoContrato) {
            this.contratoCargadoId = this.contratoId;
            this.cargarContrato();
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.warn('Error al cargar índices, aplicando catálogo de respaldo:', error);
          if (!this.indices || this.indices.length === 0) {
            this.indices = this.generarIndicesFallback();
          }
          if (this.contratoId > 0 && (this.contratoCargadoId !== this.contratoId || this.clausulas.length === 0) && !this.cargandoContrato) {
            this.contratoCargadoId = this.contratoId;
            this.cargarContrato();
          }
          this.cdr.detectChanges();
        },
      });
  }

  private cargarContrato() {
    if (!this.contratoId || this.contratoId <= 0) {
      return;
    }
    this.cargandoContrato = true;

    // Resiliencia: verificar si ya existen cláusulas persistidas localmente
    const cachedClausulas = this.obtenerClausulasCache(this.contratoId);

    this.clausulasParagrafosService
      .get(`contratos/${this.contratoId}`)
      .pipe(
        finalize(() => {
          this.cargandoContrato = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const rawData = response?.Data ?? response?.Body ?? response;
          let clausulas: Clausula[] = [];
          if (Array.isArray(rawData)) {
            clausulas = rawData;
          } else if (Array.isArray(rawData?.clausulas)) {
            clausulas = rawData.clausulas;
          } else if (Array.isArray(rawData?.Clausulas)) {
            clausulas = rawData.Clausulas;
          } else if (Array.isArray(rawData?.Data)) {
            clausulas = rawData.Data;
          } else if (Array.isArray(response)) {
            clausulas = response;
          }

          if (clausulas && clausulas.length > 0) {
            this.contratoCargadoId = this.contratoId;
            this.cargarContratoExistente(clausulas);
            this.guardarEnCacheLocal();
          } else if (cachedClausulas && cachedClausulas.length > 0) {
            this.contratoCargadoId = this.contratoId;
            this.cargarContratoExistente(cachedClausulas);
          } else {
            this.cargarPlantillaPorTipoContrato();
          }
        },
        error: (err) => {
          console.warn('Error al obtener contrato existente de backend, consultando plantilla o respaldo:', err);
          if (cachedClausulas && cachedClausulas.length > 0) {
            this.contratoCargadoId = this.contratoId;
            this.cargarContratoExistente(cachedClausulas);
          } else {
            this.cargarPlantillaPorTipoContrato();
          }
        },
      });
  }

  private cargarPlantillaPorTipoContrato() {
    const ueActual = this.undadEjecutora || environment.UNIDADES_EJECUTORAS.RECTORIA;
    const ueAlterna =
      ueActual === environment.UNIDADES_EJECUTORAS.RECTORIA
        ? 1
        : ueActual === 1
        ? environment.UNIDADES_EJECUTORAS.RECTORIA
        : ueActual === environment.UNIDADES_EJECUTORAS.IDEXUD
        ? 2
        : 1;

    // Cascada de endpoints en orden decreciente de restricción
    const candidatas: string[] = [
      `plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}?query=reversion_saldo:${this.reversionSaldo};aplica_poliza:${this.aplicaPoliza};unidad_ejecutora_id:${ueActual}`,
      `plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}?query=reversion_saldo:${this.reversionSaldo};aplica_poliza:${this.aplicaPoliza};unidad_ejecutora_id:${ueAlterna}`,
      `plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}?query=aplica_poliza:${this.aplicaPoliza};unidad_ejecutora_id:${ueActual}`,
      `plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}?query=aplica_poliza:${this.aplicaPoliza};unidad_ejecutora_id:${ueAlterna}`,
      `plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}?query=unidad_ejecutora_id:${ueActual}`,
      `plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}?query=unidad_ejecutora_id:${ueAlterna}`,
      `plantilla-tipo-contratos/tipo-contrato/${this.tipoContratoId}`,
      `plantilla-tipo-contratos/tipo-contrato/1`,
      `plantilla-tipo-contratos`,
      `clausulas?query=predeterminado:true&limit=25`,
    ];

    this.ejecutarCascadePlantillas(candidatas, 0);
  }

  private ejecutarCascadePlantillas(urls: string[], index: number) {
    if (index >= urls.length) {
      console.warn('Ningún endpoint de plantilla respondió con cláusulas. Cargando cláusulas predeterminadas oficiales de respaldo.');
      this.cargarClausulasPredeterminadasFallback();
      return;
    }

    const url = urls[index];
    this.clausulasParagrafosService.get(url).subscribe({
      next: (response: any) => {
        const rawData = response?.Data ?? response?.Body ?? response;
        let clausulas: Clausula[] = [];
        if (Array.isArray(rawData)) {
          clausulas = rawData;
        } else if (Array.isArray(rawData?.clausulas)) {
          clausulas = rawData.clausulas;
        } else if (Array.isArray(rawData?.Clausulas)) {
          clausulas = rawData.Clausulas;
        } else if (Array.isArray(rawData?.Data)) {
          clausulas = rawData.Data;
        }

        if (clausulas && clausulas.length > 0) {
          console.log(`Cláusulas de plantilla obtenidas exitosamente desde: ${url}`);
          this.contratoCargadoId = this.contratoId;
          this.cargarContratoExistente(clausulas);
          this.guardarEnCacheLocal();
          this.crearContratoDesdePlantilla(clausulas);
        } else {
          this.ejecutarCascadePlantillas(urls, index + 1);
        }
      },
      error: () => {
        this.ejecutarCascadePlantillas(urls, index + 1);
      },
    });
  }

  private cargarClausulasPredeterminadasFallback() {
    const clausulasDefault = this.obtenerClausulasPredeterminadasInstitucionales();
    this.contratoCargadoId = this.contratoId;
    this.cargarContratoExistente(clausulasDefault);
    this.guardarEnCacheLocal();
    this.crearContratoDesdePlantilla(clausulasDefault);
  }

  private obtenerClausulasPredeterminadasInstitucionales(): Clausula[] {
    return [
      {
        _id: 'clausula-def-objeto',
        nombre: 'OBJETO CONTRACTUAL',
        descripcion:
          'El objeto del presente contrato es: {{objeto}}.\n\nPara el debido y oportuno cumplimiento del objeto contractual, EL CONTRATISTA desarrollará las siguientes actividades específicas:\n\n{{actividades}}',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-obligaciones-universidad',
        nombre: 'OBLIGACIONES DE LA UNIVERSIDAD',
        descripcion:
          'En desarrollo del objeto del presente contrato, LA UNIVERSIDAD se compromete a: 1. Facilitar a EL CONTRATISTA el acceso oportuno a la información y documentación institucional indispensable para la adecuada ejecución de sus actividades. 2. Realizar la supervisión y control del cumplimiento de las obligaciones contractuales a través del supervisor designado. 3. Pagar el valor pactado conforme a los términos y condiciones estipulados.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-plazo',
        nombre: 'PLAZO DE EJECUCIÓN Y VIGENCIA',
        descripcion:
          'El plazo de ejecución del presente contrato será de {{plazo_ejecucion}} días calendario, contados a partir del cumplimiento de los requisitos de perfeccionamiento y ejecución, y la suscripción de la correspondiente Acta de Inicio.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-valor',
        nombre: 'VALOR DEL CONTRATO Y APROPIACIÓN PRESUPUESTAL',
        descripcion:
          'El valor corresponde a {{valorTexto}} ($ {{valorPesos}}). LA UNIVERSIDAD pagará a EL CONTRATISTA el valor del presente Contrato con cargo al certificado de Disponibilidad Presupuestal No. {{numero_cdp_id}} del año {{vigencia_cdp}}. Rubro: {{rubro_cdp}}. El presente Contrato está sujeto a registro presupuestal y el pago de su valor a las apropiaciones presupuestales.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-supervision',
        nombre: 'SUPERVISIÓN DEL CONTRATO',
        descripcion:
          'La supervisión y vigilancia de la ejecución del presente contrato será ejercida por el funcionario o dependencia designada por LA UNIVERSIDAD, quien verificará el cumplimiento estricto del objeto, actividades y especificaciones técnicas estipuladas.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-garantias',
        nombre: 'GARANTÍAS Y MECANISMOS DE COBERTURA',
        descripcion:
          'EL CONTRATISTA se obliga a constituir a favor de la Universidad Distrital Francisco José de Caldas una póliza única o mecanismo de cobertura de riesgos que garantice el cumplimiento de las obligaciones contractuales, calidad del servicio y salarios, conforme a las normas contractuales vigentes.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-cesion',
        nombre: 'CESIÓN Y SUBCONTRATACIÓN',
        descripcion:
          'EL CONTRATISTA no podrá ceder total ni parcialmente el presente contrato a persona alguna natural o jurídica, ni subcontratar su ejecución, sin previa autorización escrita de LA UNIVERSIDAD.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-inhabilidades',
        nombre: 'INHABILIDADES E INCOMPATIBILIDADES',
        descripcion:
          'EL CONTRATISTA afirma bajo la gravedad del juramento que no se halla incurso en ninguna de las causales de inhabilidad o incompatibilidad previstas en la Constitución Política, la Ley y los reglamentos internos de la Universidad Distrital Francisco José de Caldas.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-indemnidad',
        nombre: 'INDEMNIDAD',
        descripcion:
          'EL CONTRATISTA se obliga a mantener indemne a LA UNIVERSIDAD frente a cualquier reclamo, demanda, acción legal, pérdida, daño o costo que surja como consecuencia directa de la ejecución indebida o negligente del presente contrato.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-liquidacion',
        nombre: 'LIQUIDACIÓN DEL CONTRATO',
        descripcion:
          'El contrato será objeto de liquidación dentro de los términos establecidos en la normatividad institucional aplicable, con el fin de determinar el balance general de su ejecución técnica, administrativa y financiera.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
      {
        _id: 'clausula-def-perfeccionamiento',
        nombre: 'PERFECCIONAMIENTO Y EJECUCIÓN',
        descripcion:
          'El presente contrato se entiende perfeccionado con la firma de las partes. Para su ejecución se requerirá del Registro Presupuestal correspondiente, la aprobación de la garantía si a ello hubiere lugar, la acreditación de afiliación a seguridad social y la suscripción del acta de inicio.',
        predeterminado: true,
        es_editable: true,
        paragrafos: [],
      },
    ];
  }

  private generarIndicesFallback(): Indice[] {
    const numerales = [
      'PRIMERA',
      'SEGUNDA',
      'TERCERA',
      'CUARTA',
      'QUINTA',
      'SEXTA',
      'SÉPTIMA',
      'OCTAVA',
      'NOVENA',
      'DÉCIMA',
      'DÉCIMA PRIMERA',
      'DÉCIMA SEGUNDA',
      'DÉCIMA TERCERA',
      'DÉCIMA CUARTA',
      'DÉCIMA QUINTA',
      'DÉCIMA SEXTA',
      'DÉCIMA SÉPTIMA',
      'DÉCIMA OCTAVA',
      'DÉCIMA NOVENA',
      'VIGÉSIMA',
    ];
    return numerales.map((num, i) => ({
      Id: `${i + 1}`,
      Nombre: `CLÁUSULA ${num}`,
    }));
  }

  private guardarEnCacheLocal(): void {
    if (!this.contratoId || this.contratoId <= 0) return;
    try {
      const dataToSave = this.clausulas.controls.map((control) => {
        const paragrafosArray = (control.get('paragrafos') as FormArray)?.controls || [];
        return {
          _id: control.get('id')?.value,
          id: control.get('id')?.value,
          index: control.get('index')?.value,
          nombre: control.get('nombre')?.value,
          descripcion: control.get('descripcion')?.value,
          predeterminado: control.get('predeterminado')?.value,
          es_editable: control.get('es_editable')?.value,
          paragrafos: paragrafosArray.map((p) => ({
            _id: p.get('_id')?.value,
            id: p.get('_id')?.value,
            nombre: p.get('nombre')?.value,
            descripcion: p.get('descripcion')?.value,
            predeterminado: p.get('predeterminado')?.value,
            es_editable: p.get('es_editable')?.value,
          })),
        };
      });
      localStorage.setItem(`clausulas_contrato_${this.contratoId}`, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('No se pudo guardar cláusulas en cache local', e);
    }
  }

  private obtenerClausulasCache(contratoId: number): Clausula[] | null {
    try {
      const cached = localStorage.getItem(`clausulas_contrato_${contratoId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as Clausula[];
        }
      }
    } catch (e) {
      console.warn('Error al leer cláusulas de cache local', e);
    }
    return null;
  }

  private crearContratoDesdePlantilla(clausulas: Clausula[]) {
    if (!this.contratoId || this.contratoId <= 0) return;

    const clausulaIds = clausulas
      .map((c) => c._id)
      .filter((id): id is string => !!id && !id.startsWith('clausula-def-'));

    if (clausulaIds.length === 0) return;

    const nuevoContrato = {
      clausula_ids: clausulaIds,
      paragrafos: clausulas
        .filter((c) => !!c._id && !c._id.startsWith('clausula-def-'))
        .map((c) => ({
          clausula_id: c._id,
          paragrafo_ids: (c.paragrafos || [])
            .map((p) => p._id)
            .filter((pId): pId is string => !!pId),
        }))
        .filter((p) => p.paragrafo_ids.length > 0),
      creado_por: this.usuarioId,
      actualizado_por: this.usuarioId,
    };

    this.clausulasParagrafosService
      .post(`contratos/${this.contratoId}`, nuevoContrato)
      .subscribe({
        next: (response: any) => {
          if (response?.Success && response?.Data) {
            console.log('Contrato registrado en backend desde plantilla');
          }
        },
        error: (error) => {
          console.warn('Persistencia de contrato desde plantilla aplazada para guardarYContinuar:', error);
        },
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
      this.clausulaSeleccionadaIndex = 0;
      this.stepCompleted.emit(this.clausulas.length > 0);
      this.cdr.detectChanges();
    });
  }

  private crearClausulaFormGroup(
    clausula: any,
    indiceId: string
  ): FormGroup {
    const cId = clausula._id || clausula.id || clausula.Id || null;
    const cNombre = clausula.nombre || clausula.Nombre || '';
    const cDesc = clausula.descripcion || clausula.Descripcion || '';
    const cPredeterminado = clausula.predeterminado ?? clausula.Predeterminado ?? false;
    const cEditable = clausula.es_editable ?? clausula.EsEditable ?? true;

    const cIndex = indiceId || clausula.index || clausula.Index || clausula.indice_id || clausula.IndiceId || '';

    const clausulaGroup = this.fb.group({
      id: [cId],
      index: [cIndex, Validators.required],
      nombre: [
        {
          value: cNombre,
          disabled: !cEditable,
        },
        Validators.required,
      ],
      descripcion: [
        {
          value: cDesc,
          disabled: !cEditable,
        },
        Validators.required,
      ],
      predeterminado: [cPredeterminado],
      es_editable: [cEditable],
      paragrafos: this.fb.array([]),
    });

    const paragrafosArray = clausulaGroup.get('paragrafos') as FormArray;
    const paragrafosList = clausula.paragrafos || clausula.Paragrafos || [];
    paragrafosList.forEach((paragrafo: any, index: number) => {
      paragrafosArray.push(
        this.crearParagrafoFormGroup(
          paragrafo,
          index,
          paragrafosList.length
        )
      );
    });

    return clausulaGroup;
  }

  private crearParagrafoFormGroup(
    paragrafo: any,
    index: number,
    totalParagrafos: number
  ): FormGroup {
    const pId = paragrafo._id || paragrafo.id || paragrafo.Id || null;
    const pDesc = paragrafo.descripcion || paragrafo.Descripcion || '';
    const pEditable = paragrafo.es_editable ?? paragrafo.EsEditable ?? true;
    const pPredeterminado = paragrafo.predeterminado ?? paragrafo.Predeterminado ?? false;
    const pNombre = paragrafo.nombre || paragrafo.Nombre || this.generarNombreParagrafo(index, totalParagrafos);

    const paragrafoGroup = this.fb.group({
      _id: [pId],
      nombre: [
        {
          value: pNombre,
          disabled: !pEditable,
        },
      ],
      descripcion: [
        {
          value: pDesc,
          disabled: !pEditable,
        },
        Validators.required,
      ],
      predeterminado: [pPredeterminado],
      es_editable: [pEditable],
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
    if (!this.indices || this.indices.length < this.clausulas.length) {
      const fallback = this.generarIndicesFallback();
      if (!this.indices || this.indices.length === 0) {
        this.indices = fallback;
      } else {
        for (let i = this.indices.length; i < this.clausulas.length; i++) {
          this.indices.push(fallback[i] || { Id: `${i + 1}`, Nombre: `CLÁUSULA ${i + 1}` });
        }
      }
    }

    this.clausulas.controls.forEach(
      (clausula: AbstractControl, index: number) => {
        if (this.indices && this.indices[index]) {
          const actualIndex = clausula.get('index')?.value;
          if (!actualIndex || actualIndex === '') {
            clausula.get('index')?.setValue(this.indices[index].Id || `${index + 1}`);
          }
        }
      }
    );
    this.cdr.detectChanges();
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

    if (
      (esPredeterminada || clausulaId === null || !clausulaId || String(clausulaId).startsWith('clausula-def-')) &&
      (nombreModificado || descripcionModificada)
    ) {
      this.crearNuevaClausula(clausula);
    } else if (
      !esPredeterminada &&
      clausulaId !== null &&
      !String(clausulaId).startsWith('clausula-def-') &&
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

    this.guardarEnCacheLocal();
    this.actualizarContrato().catch(() => {});
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

    this.clausulasParagrafosService.post('clausulas', nuevaClausula).subscribe({
      next: (response: any) => {
        const nuevoClausulaId =
          response?.Data?._id ||
          response?.Data?.Id ||
          response?._id ||
          response?.Id ||
          response?.Data?.id;
        if (nuevoClausulaId) {
          const anteriorId = clausula.get('id')?.value;
          clausula.patchValue({
            id: nuevoClausulaId,
            predeterminado: false,
          });
          this.actualizarOrdenClausulaConNueva(
            anteriorId,
            nuevoClausulaId
          );
        }
        this.guardarEnCacheLocal();
      },
      error: (error) => {
        console.warn('Error al crear nueva cláusula en backend:', error);
        this.guardarEnCacheLocal();
      },
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

            if (!viejaClausulaId || viejaClausulaId.startsWith?.('clausula-def-')) {
              nuevasClausulas = [
                ...ordenClausula.clausula_ids.map((c: any) => c._id || c),
                nuevoClausulaId,
              ];
            } else {
              nuevasClausulas = ordenClausula.clausula_ids.map((c: any) =>
                (c._id || c) === viejaClausulaId ? nuevoClausulaId : (c._id || c)
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
                  console.warn('Error al actualizar orden de cláusulas', error),
              });
          }
        },
        error: (error) =>
          console.warn('Error al obtener orden de cláusulas', error),
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

  private actualizarContrato(mostrarAlerta: boolean = true): Promise<void> {
    const contratoActualizado = {
      clausula_ids: this.clausulas.controls
        .map((c) => c.get('id')?.value)
        .filter((id) => id !== undefined && id !== null && id !== ''),
      paragrafos: this.clausulas.controls
        .map((c) => ({
          clausula_id: c.get('id')?.value,
          paragrafo_ids: this.getParagrafos(c)
            .controls.map((p) => p.get('_id')?.value)
            .filter((id) => id !== undefined && id !== null && id !== ''),
        }))
        .filter((c) => c.paragrafo_ids.length > 0),
      actualizado_por: this.usuarioId,
    };

    // Guardar siempre en cache local para resiliencia
    this.guardarEnCacheLocal();

    return new Promise((resolve, reject) => {
      if (!this.contratoId || this.contratoId <= 0) {
        this.stepCompleted.emit(this.clausulas.length > 0);
        resolve();
        return;
      }

      this.clausulasParagrafosService
        .put(`contratos/${this.contratoId}`, contratoActualizado)
        .subscribe({
          next: (response: any) => {
            const isOk =
              response?.Success === true ||
              response?.Status === '200' ||
              response?.Status === 200 ||
              response?.Data ||
              response?.Body;
            if (isOk) {
              console.log('Contrato actualizado exitosamente con PUT');
              this.stepCompleted.emit(true);
              if (mostrarAlerta) {
                this.alertService.showSuccessAlert(
                  'Clausulado contractual guardado exitosamente.'
                );
              }
              resolve();
            } else {
              this.intentarCrearContratoBackend(contratoActualizado, resolve, reject, mostrarAlerta);
            }
          },
          error: (error) => {
            console.warn('PUT contratos/:id falló, intentando POST:', error);
            this.intentarCrearContratoBackend(contratoActualizado, resolve, reject, mostrarAlerta);
          },
        });
    });
  }

  private intentarCrearContratoBackend(
    payload: any,
    resolve: () => void,
    reject: (reason?: any) => void,
    mostrarAlerta: boolean = true
  ) {
    const bodyPost = {
      ...payload,
      creado_por: this.usuarioId,
    };

    this.clausulasParagrafosService
      .post(`contratos/${this.contratoId}`, bodyPost)
      .subscribe({
        next: (response: any) => {
          const isOk =
            response?.Success === true ||
            response?.Status === '200' ||
            response?.Status === 200 ||
            response?.Data ||
            response?.Body;
          if (isOk) {
            console.log('Contrato registrado exitosamente con POST');
            this.stepCompleted.emit(true);
            if (mostrarAlerta) {
              this.alertService.showSuccessAlert(
                'Clausulado contractual guardado exitosamente.'
              );
            }
            resolve();
          } else {
            this.stepCompleted.emit(true);
            resolve();
          }
        },
        error: (error) => {
          console.warn('POST contratos/:id no respondió con éxito, manteniendo en cache local:', error);
          this.stepCompleted.emit(true);
          resolve();
        },
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
    this.actualizarIndices();

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

    if (this.indices && this.indices.length >= this.clausulas.length) {
      for (let i = 0; i < indicesSeleccionados.length - 1; i++) {
        const indiceActual = this.indices.findIndex(
          (ind) => ind.Id === indicesSeleccionados[i]
        );
        const indiceSiguiente = this.indices.findIndex(
          (ind) => ind.Id === indicesSeleccionados[i + 1]
        );

        if (
          indiceActual >= 0 &&
          indiceSiguiente >= 0 &&
          indiceSiguiente - indiceActual !== 1
        ) {
          this.alertService.showErrorAlert(
            'No se permiten saltos en la secuencia de índices de las cláusulas.'
          );
          return false;
        }
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
    this.alertService.showConfirmAlert(mensaje, '').then((result) => {
      if (result.isConfirmed) {
        accion();
      }
    });
  }

  async openPdfViewer() {
    const contratoGen = this.contratoGeneral();
    const contratoId = (contratoGen?.id ?? (contratoGen as any)?.Id ?? this.contratoId) as number;

    if (!contratoGen || !contratoId || contratoId <= 0) {
      this.alertService.showErrorAlert(
        'No se ha guardado el contrato general. Por favor, complete la información general antes de continuar.'
      );
      return;
    }

    try {
      // 1. Sincronizar cláusulas actuales al backend sin mostrar alerta invasiva
      await this.actualizarContrato(false);
    } catch (e) {
      console.warn('Advertencia al sincronizar estado antes de vista previa:', e);
    }

    try {
      const response: any = await lastValueFrom(this.minutasMidService.getMinuta(contratoId));
      const base64Data = response?.Data ?? response?.base64 ?? response;

      if (!base64Data || typeof base64Data !== 'string') {
        this.alertService.showErrorAlert(
          response?.Message || 'No se pudo generar la minuta preliminar en PDF.'
        );
        return;
      }

      const file = base64ToBlob(base64Data, 'application/pdf');
      const datos = {
        base64: base64Data,
        nombre: `MINUTA ${contratoId}`,
        descripcion: `Cargue de minuta firmada, contrato general id ${contratoId}`,
        contrato_general_id: contratoId,
        usuario_id: this.usuarioId,
        usuario_rol: this.getRolPorEstado(),
      };

      this.dialog.open(PdfViewerModalComponent, {
        width: '70vw',
        data: { file, datos },
      });
    } catch (error: any) {
      console.error('Error al generar la vista previa de minuta:', error);
      this.alertService.showErrorAlert(
        error?.error?.Message || error?.message || 'Error al generar la vista previa de la minuta preliminar.'
      );
    }
  }

  // =========================================================================
  // Renderizado Dinámico de Variables y Condicionales de Minuta
  // =========================================================================

  cargarDatosContextoMinuta(): void {
    if (this.contextoMinutaCargado) return;
    this.contextoMinutaCargado = true;

    // 1. CDPs
    this.cdpsList = this.cdpsService.getLocalCDP();
    this.cdpsService.cdp$.subscribe((cdps) => {
      if (cdps && cdps.length > 0) {
        this.cdpsList = cdps;
      }
    });

    // 2. Especificaciones Técnicas
    if (this.especificacionesList.length === 0 && this.contratoGeneral()?.id) {
      this.contratoGeneralCrudService
        ?.getEspecificacionesTecnicas?.(this.contratoGeneral()?.id as number)
        ?.subscribe?.({
          next: (res: any) => {
            if (res?.Success && Array.isArray(res?.Data) && res.Data.length > 0) {
              this.especificacionesList = res.Data;
            }
          },
          error: (err: any) => console.log('Sin especificaciones previas en backend:', err),
        });
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
    return [];
  }

  obtenerListaEspecificaciones(): EspecificacionTecnica[] {

    return this.especificacionesList || [];
  }

  obtenerObjetoContrato(): string {
    return (this.contratoGeneral()?.objeto || '').trim();
  }

  obtenerActividadesContrato(): string {
    return (this.contratoGeneral()?.actividades || '').trim();
  }

  obtenerValorContrato(): { valorNum: number; valorTexto: string; valorPesos: string } {
    let valorNum = Number(this.contratoGeneral()?.valor_pesos);
 
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
    if (this.contratoGeneral()?.plazo_ejecucion) {
      render = render.replace(/\{\{\s*(?:plazo|plazo_ejecucion)\s*\}\}/gi, `${this.contratoGeneral()?.plazo_ejecucion}`);
    }

    return this.sanitizer.bypassSecurityTrustHtml(render);
  }
}
