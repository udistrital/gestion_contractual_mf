import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { AlertService } from 'src/app/services/alert.service';
import { UserService } from 'src/app/services/user.service';
import {
  ApiResponse,
  ContratoGeneral,
  EstadoContrato,
  ParametroResponse,
  SimpleItem,
} from 'src/app/types/types';

@Component({
    selector: 'app-paso-info-general',
    templateUrl: './paso-info-general.component.html',
    styleUrls: ['./paso-info-general.component.css'],
    standalone: false
})
export class PasoInfoGeneralComponent implements OnInit {
  contratoGeneral = input<ContratoGeneral>();
  viewMode = input<boolean>(false);
  stepCompleted = output<boolean>();
  nextStep = output<void>();
  tipoCompromisoChange = output<string>();
  aplicaPolizaChange = output<string>();
  contratoGuardado = output<number>();

  roles: string[] = [];
  showContratoFields = false;
  showConvenioFields = false;
  loadedData = signal<boolean>(false);
  maxDate: Date = new Date();
  formId: number | null = null;

  private initialFormValue: any;
  formSaved: boolean = false;

  get estimacionTermino(): string {
    const fechaVal = this.formInfoGeneral?.get('fechaSuscripcionEstudios')?.value;
    const plazoVal = this.formInfoGeneral?.get('plazoEjecucion')?.value;
    const unidadId = this.formInfoGeneral?.get('unidadEjecucionId')?.value;

    const plazo = parseInt(plazoVal as any, 10);
    if (!fechaVal || isNaN(plazo) || plazo <= 0 || !unidadId) {
      return 'Pendiente de cálculo';
    }

    const fechaBase = new Date(fechaVal);
    if (isNaN(fechaBase.getTime())) {
      return 'Pendiente de cálculo';
    }

    const unidad = this.unidadesEjecucion.find((u) => u.Id === unidadId);
    const nombreUnidad = (unidad?.Nombre || '').toUpperCase();

    if (nombreUnidad.includes('MES')) {
      fechaBase.setMonth(fechaBase.getMonth() + plazo);
    } else if (nombreUnidad.includes('DÍA') || nombreUnidad.includes('DIA')) {
      fechaBase.setDate(fechaBase.getDate() + plazo);
    } else if (nombreUnidad.includes('AÑO') || nombreUnidad.includes('ANO')) {
      fechaBase.setFullYear(fechaBase.getFullYear() + plazo);
    } else {
      fechaBase.setMonth(fechaBase.getMonth() + plazo);
    }

    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return `${fechaBase.getDate()} ${meses[fechaBase.getMonth()]} ${fechaBase.getFullYear()}`;
  }

  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);
  private readonly rolService = inject(RolService);
  private readonly parametrosService = inject(ParametrosService);
  private readonly contratoGeneralCrudService = inject(ContratoGeneralCrudService);
  private readonly contratoGeneralMidService = inject(ContratoGeneralMidService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly userService = inject(UserService);

  formInfoGeneral = this.fb.group({
    unidadEjecutoraId: [0, Validators.required],
    tipoCompromisoId: [0, Validators.required],
    tipoContratoId: [0, Validators.required],
    perfilContratistaId: [0],
    fechaSuscripcionEstudios: [''],
    aplicaPoliza: [''],
    vigenciaConvenio: [''],
    convenio: [''],
    nombreConvenio: [''],
    modalidadSeleccionId: [0, Validators.required],
    tipologiaEspecificaId: [0, Validators.required],
    regimenContratacionId: [0, Validators.required],
    procedimientoId: [0, Validators.required],
    plazoEjecucion: [0, [Validators.required, Validators.pattern('^[0-9]*$')]],
    unidadEjecucionId: [0, Validators.required],
  });

  //Parametros (Opciones)
  tiposCompromisos: ParametroResponse[] = [];
  tiposContratos: ParametroResponse[] = [];
  modalidadesSeleccion: ParametroResponse[] = [];
  tipologiasEspecificas: ParametroResponse[] = [];
  regimenesContratacion: ParametroResponse[] = [];
  procedimientos: ParametroResponse[] = [];
  unidadesEjecucion: ParametroResponse[] = [];
  // orden-contrato
  perfilesContratista: ParametroResponse[] = [];

  unidadesEjecutoras: SimpleItem[] = [];

  tiposParametrosRequeridos = [
    environment.TIPO_COMPROMISO_ID,
    environment.TIPO_CONTRATO_ID,
    environment.MODALIDAD_SELECCION_ID,
    environment.TIPOLOGIA_ESPECIFICA_ID,
    environment.REGIMEN_CONTRATACION_ID,
    environment.PROCEDIMIENTO_ID,
    environment.UNIDAD_EJECUCION_ID,
    environment.PERFIL_CONTRATISTA_ID,
    environment.TIPO_ESTADO_ID,
    environment.TIPO_ESTADO_INTERNO_ID,
  ]

  aplicaPoliza: { value: string; viewValue: string }[] = [
    { value: '0', viewValue: 'No' },
    { value: '1', viewValue: 'Si' },
  ];

  // convenio
  vigenciasConvenio: ParametroResponse[] = [];
  convenios: ParametroResponse[] = [];

  //Estado
  estado_id: number | null = environment.ESTADOS_GENERALES.POR_SUSCRIBIR;
  estado_interno_id: number | null = environment.ESTADOS_INTERNOS.BORRADOR;

  constructor() {
    effect(() => {
      if (this.loadedData() && this.contratoGeneral()) {
        this.setFormData();
      }
    });
  }

  async ngOnInit() {
    this.roles = this.rolService.getRol();
    await this.loadInitialData();
    // Las opciones dependientes (tipo de contrato, tipología, perfil) también
    // se cargan en modo visualización para poder mostrar los valores guardados.
    this.processRoles();
    this.setuptipoCompromisoId();
    this.setuptipoContratoId();
    if (!this.viewMode()) {
      this.setupAplicaPoliza();

      this.initialFormValue = this.formInfoGeneral.value;
      this.formInfoGeneral.valueChanges.subscribe(() => {
        this.formSaved = false;
      });
    }
    this.aplicarModoVisualizacion();
    this.formInfoGeneral.statusChanges.subscribe(() => {
      this.stepCompleted.emit(this.formInfoGeneral.valid);
    });
  }

  private setuptipoCompromisoId() {
    this.formInfoGeneral
      .get('tipoCompromisoId')
      ?.valueChanges.subscribe((id_compromiso) => {
        if (id_compromiso) {
          //Emite el evento para que el padre sepa que se seleccionó un tipo de compromiso
          this.tipoCompromisoChange.emit(id_compromiso.toString());

          this.CargartipoContratoIds(id_compromiso);
          this.showFieldsBasedOnCompromiso(id_compromiso);
          if (id_compromiso) {
            this.CargartipologiaEspecificaId(id_compromiso);

            const idCompromisoStr = id_compromiso.toString();
            const perfilCompromisoIdStr = environment.ORDEN_ID.toString();

            const perfilCompromisoControl =
              this.formInfoGeneral.get('aplicaPoliza');
            if (idCompromisoStr === perfilCompromisoIdStr) {
              perfilCompromisoControl?.setValidators(Validators.required);
              if (!this.viewMode()) {
                perfilCompromisoControl?.enable();
              }
            } else {
              perfilCompromisoControl?.clearValidators();
              perfilCompromisoControl?.disable();
            }
            perfilCompromisoControl?.updateValueAndValidity();

            this.cdRef.detectChanges();
          }
        }
      });
  }

  private setuptipoContratoId() {
    this.formInfoGeneral
      .get('tipoContratoId')
      ?.valueChanges.subscribe((id_contrato) => {
        if (id_contrato) {
          this.CargartipologiaEspecificaId(id_contrato);

          const idContratoStr = id_contrato.toString();
          const tipoContratoIdIdStr = environment.CONTRATO_PSPAG_ID.toString();

          const perfilContratistaControl = this.formInfoGeneral.get(
            'perfilContratistaId'
          );
          const fechaSuscripcionControl = this.formInfoGeneral.get(
            'fechaSuscripcionEstudios'
          );

          if (idContratoStr === tipoContratoIdIdStr) {
            this.CargarPerfilContratista(id_contrato);
            perfilContratistaControl?.setValidators(Validators.required);
            fechaSuscripcionControl?.setValidators(Validators.required);
            if (!this.viewMode()) {
              perfilContratistaControl?.enable();
              fechaSuscripcionControl?.enable();
            }
          } else {
            perfilContratistaControl?.clearValidators();
            perfilContratistaControl?.disable();

            fechaSuscripcionControl?.clearValidators();
            fechaSuscripcionControl?.disable();
          }
          perfilContratistaControl?.updateValueAndValidity();

          this.cdRef.detectChanges();
        }
      });
  }

  private async loadInitialData(): Promise<void> {
    return this.parametrosService.getParametrosPorTipo(this.tiposParametrosRequeridos).then(
      (data: Record<number, ParametroResponse[]>) => {
        this.tiposCompromisos = data[environment.TIPO_COMPROMISO_ID];
        this.modalidadesSeleccion = data[environment.MODALIDAD_SELECCION_ID];
        this.regimenesContratacion = data[environment.REGIMEN_CONTRATACION_ID];
        this.procedimientos = data[environment.PROCEDIMIENTO_ID];
        this.unidadesEjecucion = data[environment.UNIDAD_EJECUCION_ID];
        this.loadedData.set(true);
        this.cdRef.detectChanges();
      })
      .catch((err) => this.handleError(err));
  }

  private processRoles(): void {
    const defaultOptions = [
      {
        Id: environment.UNIDADES_EJECUTORAS.RECTORIA,
        Nombre: 'Rectoría',
      },
      {
        Id: environment.UNIDADES_EJECUTORAS.IDEXUD,
        Nombre: 'IDEXUD',
      },
    ];

    const filteredRoles = this.roles.filter(
      (role) => role.includes('RECTOR') || role.includes('IDEXUD')
    );

    if (filteredRoles.length === 0) {
      this.unidadesEjecutoras = defaultOptions;
      this.formInfoGeneral.patchValue({
        unidadEjecutoraId: defaultOptions[0].Id
      });
      return;
    }

    const mappedItems = filteredRoles
      .map((role) => {
        if (role.includes('RECTOR')) {
          return {
            Id: environment.UNIDADES_EJECUTORAS.RECTORIA,
            Nombre: 'Rectoría',
          };
        }
        if (role.includes('IDEXUD')) {
          return {
            Id: environment.UNIDADES_EJECUTORAS.IDEXUD,
            Nombre: 'IDEXUD',
          };
        }
        return null;
      })
      .filter((item): item is SimpleItem => item !== null);

    const uniqueMap = new Map(mappedItems.map((item) => [item.Id, item]));
    this.unidadesEjecutoras = Array.from(uniqueMap.values());

    if (this.unidadesEjecutoras.length === 1) {
      this.formInfoGeneral.patchValue({
        unidadEjecutoraId: this.unidadesEjecutoras[0].Id
      });
    }
  }


  setupAplicaPoliza() {
    this.formInfoGeneral
      .get('aplicaPoliza')
      ?.valueChanges.subscribe((value) => {
        if (value) {
          this.aplicaPolizaChange.emit(value.toString());
        }
      });
  }

  //Especificos
  showFieldsBasedOnCompromiso(id_compromiso: number) {

    this.showContratoFields =
      id_compromiso === environment.CONTRATO_ID ||
      id_compromiso === environment.ORDEN_ID;
    this.showConvenioFields = id_compromiso === environment.CONVENIO_ID;

    const convenioFields = ['vigenciaConvenio', 'convenio', 'nombreConvenio'];

    [
      ...convenioFields,
      'perfilContratistaId',
      'aplicaPoliza',
      'fechaSuscripcionEstudios',
    ].forEach((field) => {
      const control = this.formInfoGeneral.get(field);
      if (control) {
        control.reset();
        if (this.showConvenioFields && convenioFields.includes(field)) {
          control.setValidators(Validators.required);
          if (!this.viewMode()) {
            control.enable();
          }
        } else {
          control.clearValidators();
          control.disable();
        }
        control.updateValueAndValidity();
      }
    });

    this.cdRef.detectChanges();
  }

  CargartipoContratoIds(id_compromiso: number) {
    this.tiposContratos = this.parametrosService.getParametroPorPadreIdyTipoId(
      id_compromiso,
      environment.TIPO_CONTRATO_ID,
    );
  }

  CargartipologiaEspecificaId(id_contrato: number) {
    this.tipologiasEspecificas = this.parametrosService.getParametroPorPadreIdyTipoId(
      id_contrato,
      environment.TIPOLOGIA_ESPECIFICA_ID
    );
  }

  CargarPerfilContratista(id_contrato: number) {
    if (id_contrato === environment.CONTRATO_PSPAG_ID) {
      this.perfilesContratista = this.parametrosService.getParametroPorPadreIdyTipoId(
        id_contrato,
        environment.PERFIL_CONTRATISTA_ID
      );
    }
  }

  // Método para manejar la entrada de solo números
  validateOnlyNumbers(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'End',
      'Home',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
    ];
    const pattern = /^[0-9]$/;

    if (!allowedKeys.includes(event.key) && !pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  setFormData() {
    const data = this.contratoGeneral();
    if (!data) return;

    const formData = {
      unidadEjecutoraId: data.unidad_ejecutora_id,
      tipoCompromisoId: data.tipo_compromiso_id ?? 0,
      tipoContratoId: data.tipo_contrato_id ?? 0,
      perfilContratistaId: data.perfil_contratista_id ?? 0,
      fechaSuscripcionEstudios:
        data.fecha_suscripcion_estudios?.toLocaleString() ?? '',
      aplicaPoliza: data?.aplica_poliza ? '1' : '0',
      modalidadSeleccionId: data.modalidad_seleccion_id ?? 0,
      tipologiaEspecificaId: data.tipologia_especifica_id ?? 0,
      regimenContratacionId: data.regimen_contratacion_id ?? 0,
      procedimientoId: data.procedimiento_id ?? 0,
      plazoEjecucion: data.plazo_ejecucion ?? 0,
      unidadEjecucionId: data.unidad_ejecucion_id ?? 0,
    };
    this.formInfoGeneral.patchValue(formData);
    this.cdRef.detectChanges();
    this.aplicarModoVisualizacion();
  }

  /** En modo visualización el formulario queda en solo lectura. */
  private aplicarModoVisualizacion(): void {
    if (this.viewMode()) {
      this.formInfoGeneral.disable({ emitEvent: false });
    }
  }

  /**
   * Indica si el campo aplica al contrato. En edición se usa el estado del control;
   * en visualización todo está deshabilitado, así que se decide por los valores.
   */
  campoAplica(campo: 'perfilContratistaId' | 'aplicaPoliza' | 'fechaSuscripcionEstudios'): boolean {
    if (!this.viewMode()) {
      return !!this.formInfoGeneral.get(campo)?.enabled;
    }
    const { tipoCompromisoId, tipoContratoId } = this.formInfoGeneral.getRawValue();
    return campo === 'aplicaPoliza'
      ? tipoCompromisoId === environment.ORDEN_ID
      : tipoContratoId === environment.CONTRATO_PSPAG_ID;
  }

  guardarYContinuar() {
    const formData = this.formInfoGeneral.value;
    const unidad_ejecutora_id = String(formData.unidadEjecutoraId || this.unidadesEjecutoras[0]?.Id);

    // Obtener el consecutivo del contrato
    this.contratoGeneralMidService
      .postConsecutivo({ unidad_ejecutora_id })
      .subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.Success && response.Status === 200) {
            this.guardarContrato(response.Data, parseInt(unidad_ejecutora_id, 10));
          } else {
            this.alertService.showErrorAlert(
              'Error al generar consecutivo de contrato',
              'Por favor, intente de nuevo'
            );
          }
        },
        error: (error) => {
          console.log(error);
          this.alertService.showErrorAlert(
            'Error al generar consecutivo de contrato',
            'Por favor, intente de nuevo'
          );
        },
      });
  }

  guardarContrato(consecutivo: string, unidad_ejecutora_id: number) {
    if (this.viewMode()) return;

    if (this.formInfoGeneral.invalid) {
      this.formInfoGeneral.markAllAsTouched();
      return;
    }

    const formData = this.formInfoGeneral.value;

    const formParsed = {
      tipo_compromiso_id: formData.tipoCompromisoId,
      tipo_contrato_id: formData.tipoContratoId,
      perfil_contratista_id: formData.perfilContratistaId,
      fecha_suscripcion_estudios: formData.fechaSuscripcionEstudios,
      aplica_poliza: formData.aplicaPoliza,
      vigencia_convenio: formData.vigenciaConvenio,
      convenio: formData.convenio,
      nombre_convenio: formData.nombreConvenio,
      modalidad_seleccion_id: formData.modalidadSeleccionId,
      tipologia_especifica_id: formData.tipologiaEspecificaId,
      regimen_contratacion_id: formData.regimenContratacionId,
      procedimiento_id: formData.procedimientoId,
      plazo_ejecucion: formData.plazoEjecucion,
      unidad_ejecucion_id: formData.unidadEjecucionId,
      unidad_ejecutora_id: formData.unidadEjecutoraId || this.unidadesEjecutoras[0]?.Id,
    };

    const saveOperation = this.formId
      ? this.contratoGeneralCrudService.put(this.formId, formParsed)
      : this.contratoGeneralCrudService.post({
          ...formParsed,
          consecutivo_elaboracion: consecutivo,
        });

    saveOperation.subscribe({
      next: async (response: ApiResponse<any>) => {

        await this.guardarEstado(response.Data.id);

        this.alertService.showSuccessAlert(
          'Los datos se guardaron correctamente. IDs: ' + response.Data.id,
          'Datos guardados'
        );

        this.initialFormValue = this.formInfoGeneral.value;
        this.formSaved = true;
        this.contratoGuardado.emit(response.Data.id);
        this.nextStep.emit();
      },
      error: async (error) => {
        this.alertService.showErrorAlert(
          'Ocurrió un error al guardar los datos',
          'Error al guardar los datos'
        );
      },
    });
  }

  private async guardarEstado(contratoId: number) {
    if (this.estado_id === null || this.estado_interno_id === null) return;

    const rol =
      this.roles.find((item) => item.includes('ABOGADO')) || 'ABOGADO';
    const usuarioId = await this.userService.getPersonaId().catch(() => 1);
    const estado: EstadoContrato = {
      contrato_general_id: contratoId,
      usuario_id: usuarioId,
      usuario_rol: rol,
      estado_parametro_id: this.estado_id,
      estado_interno_parametro_id: this.estado_interno_id,
    };

    this.contratoGeneralCrudService.postEstadoContrato(estado).subscribe({
      next: (response: any) => {
        return response;
      },
      error: (error: any) => {
        throw new Error('Error al guardar estado');
      },
    });
  }

  async onInView(inView: boolean) {
    if (inView) {
      //this.loadSavedData();
    } else {
      console.log('Step Info General - out of view');
    }
  }

  private async handleError(error: any): Promise<void> {
    this.alertService.showErrorAlert(
      'Ocurrió un error al cargar los datos iniciales',
      'Error al cargar los datos iniciales'
    );
  }
}
