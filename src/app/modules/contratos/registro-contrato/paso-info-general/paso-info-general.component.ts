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
import { aFechaCrud, desdeFechaCrud } from 'src/app/utils/fechas-crud';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { VigenciaService } from 'src/app/services/vigencia.service';
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
  guardando = signal<boolean>(false);
  maxDate: Date = new Date();

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
  private readonly vigenciaService = inject(VigenciaService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly userService = inject(UserService);

  formInfoGeneral = this.fb.group({
    unidadEjecutoraId: [0, Validators.required],
    vigenciaId: [null as number | null, Validators.required],
    tipoCompromisoId: [null as number | null, Validators.required],
    tipoContratoId: [null as number | null, Validators.required],
    perfilContratistaId: [null as number | null],
    fechaSuscripcionEstudios: [''],
    aplicaPoliza: [''],
    vigenciaConvenio: [''],
    convenio: [''],
    nombreConvenio: [''],
    modalidadSeleccionId: [null as number | null, Validators.required],
    tipologiaEspecificaId: [null as number | null, Validators.required],
    regimenContratacionId: [null as number | null, Validators.required],
    procedimientoId: [null as number | null, Validators.required],
    plazoEjecucion: [null as number | null, [Validators.required, Validators.pattern('^[0-9]*$')]],
    unidadEjecucionId: [null as number | null, Validators.required],
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
  unidadesEjecutorasParametros: ParametroResponse[] = [];
  vigenciasContrato: ParametroResponse[] = [];

  tiposParametrosRequeridos = [
    environment.UNIDAD_EJECUTORA_ID,
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
    environment.VIGENCIA_ID,
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
        this.guardando.set(false);
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
        this.unidadesEjecutorasParametros = data[environment.UNIDAD_EJECUTORA_ID] || [];
        this.tiposCompromisos = data[environment.TIPO_COMPROMISO_ID];
        this.modalidadesSeleccion = data[environment.MODALIDAD_SELECCION_ID];
        this.regimenesContratacion = data[environment.REGIMEN_CONTRATACION_ID];
        this.procedimientos = data[environment.PROCEDIMIENTO_ID];
        this.unidadesEjecucion = data[environment.UNIDAD_EJECUCION_ID];
        this.vigenciasContrato = (data[environment.VIGENCIA_ID] || []).sort(
          (a, b) => Number(b.Nombre) - Number(a.Nombre)
        );
        this.preseleccionarVigenciaActual();
        this.loadedData.set(true);
        this.cdRef.detectChanges();
      })
      .catch((err) => this.handleError(err));
  }

  private preseleccionarVigenciaActual(): void {
    if (this.contratoGeneral()?.id || this.formInfoGeneral.get('vigenciaId')?.value) {
      return;
    }
    const anioActual = String(new Date().getFullYear());
    const vigenciaActual = this.vigenciasContrato.find(
      (v) => String(v.Nombre) === anioActual
    );
    if (vigenciaActual) {
      this.formInfoGeneral.patchValue({ vigenciaId: Number(vigenciaActual.Id) });
    }
  }

  private obtenerNombreUnidadEjecutora(id: number, fallback: string): string {
    const param = this.unidadesEjecutorasParametros?.find((p) => Number(p.Id) === id);
    return param?.Nombre || fallback;
  }

  private processRoles(): void {
    const nombreRectoria = this.obtenerNombreUnidadEjecutora(
      environment.UNIDADES_EJECUTORAS.RECTORIA,
      'Rectoría'
    );
    const nombreIdexud = this.obtenerNombreUnidadEjecutora(
      environment.UNIDADES_EJECUTORAS.IDEXUD,
      'IDEXUD'
    );

    const catalogoUnidades: SimpleItem[] =
      this.unidadesEjecutorasParametros?.length > 0
        ? this.unidadesEjecutorasParametros.map((p) => ({
            Id: Number(p.Id),
            Nombre: p.Nombre,
          }))
        : [
            {
              Id: environment.UNIDADES_EJECUTORAS.RECTORIA,
              Nombre: nombreRectoria,
            },
            {
              Id: environment.UNIDADES_EJECUTORAS.IDEXUD,
              Nombre: nombreIdexud,
            },
          ];

    const filteredRoles = this.roles.filter(
      (role) => role.includes('RECTOR') || role.includes('IDEXUD')
    );

    const ueIdNavegacion = Number(history.state?.unidadEjecutoraId);

    if (filteredRoles.length === 0) {
      this.unidadesEjecutoras = catalogoUnidades;
      const ueSeleccionada =
        catalogoUnidades.find((u) => u.Id === ueIdNavegacion)?.Id ??
        catalogoUnidades[0]?.Id;
      this.formInfoGeneral.patchValue({
        unidadEjecutoraId: ueSeleccionada
      });
      return;
    }

    const mappedItems = filteredRoles
      .map((role) => {
        if (role.includes('RECTOR')) {
          return {
            Id: environment.UNIDADES_EJECUTORAS.RECTORIA,
            Nombre: nombreRectoria,
          };
        }
        if (role.includes('IDEXUD')) {
          return {
            Id: environment.UNIDADES_EJECUTORAS.IDEXUD,
            Nombre: nombreIdexud,
          };
        }
        return null;
      })
      .filter((item): item is SimpleItem => item !== null);

    if (ueIdNavegacion) {
      const ueDesdeCatalogo = catalogoUnidades.find((u) => u.Id === ueIdNavegacion);
      if (ueDesdeCatalogo) {
        mappedItems.push(ueDesdeCatalogo);
      }
    }

    const uniqueMap = new Map(mappedItems.map((item) => [item.Id, item]));
    this.unidadesEjecutoras = Array.from(uniqueMap.values());

    if (
      ueIdNavegacion &&
      this.unidadesEjecutoras.some((u) => u.Id === ueIdNavegacion)
    ) {
      this.formInfoGeneral.patchValue({
        unidadEjecutoraId: ueIdNavegacion
      });
    } else if (this.unidadesEjecutoras.length === 1) {
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
      vigenciaId: data.vigencia_id ?? null,
      tipoCompromisoId: data.tipo_compromiso_id,
      tipoContratoId: data.tipo_contrato_id,
      perfilContratistaId: data.perfil_contratista_id,
      fechaSuscripcionEstudios: desdeFechaCrud(data.fecha_suscripcion_estudio),
      aplicaPoliza: data.aplica_poliza === true ? '1' : data.aplica_poliza === false ? '0' : '',
      modalidadSeleccionId: data.modalidad_seleccion_id,
      tipologiaEspecificaId: data.tipologia_especifica_id,
      regimenContratacionId: data.regimen_contratacion_id,
      procedimientoId: data.procedimiento_id,
      plazoEjecucion: data.plazo_ejecucion,
      unidadEjecucionId: data.unidad_ejecucion_id,
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
    // Hasta que llegue el contrato recargado no se sabe si el siguiente guardado es POST o PUT.
    if (this.guardando()) return;
    this.guardando.set(true);

    const formData = this.formInfoGeneral.value;
    const unidad_ejecutora_id = String(formData.unidadEjecutoraId || this.unidadesEjecutoras[0]?.Id);

    // Un contrato existente ya tiene consecutivo: no se pide otro.
    if (this.contratoGeneral()?.id) {
      this.guardarContrato(null, parseInt(unidad_ejecutora_id, 10));
      return;
    }

    const vigenciaId = formData.vigenciaId;
    if (vigenciaId) {
      this.pedirConsecutivo(parseInt(unidad_ejecutora_id, 10), Number(vigenciaId));
    } else {
      // El contrato no se guarda sin vigencia.
      this.vigenciaService.vigenciaActualId().subscribe({
        next: (id) => {
          if (id) {
            this.formInfoGeneral.patchValue({ vigenciaId: id });
            this.pedirConsecutivo(parseInt(unidad_ejecutora_id, 10), id);
          } else {
            this.avisarSinVigencia();
          }
        },
        error: () => this.avisarSinVigencia(),
      });
    }
  }

  private avisarSinVigencia() {
    this.guardando.set(false);
    this.alertService.showErrorAlert(
      'No se encontró la vigencia del año actual en Parámetros. El contrato no se guardó.',
      'Error al consultar la vigencia'
    );
  }

  private pedirConsecutivo(unidad_ejecutora_id: number, vigenciaId: number, reintento = false) {
    // Obtener el consecutivo del contrato
    this.contratoGeneralMidService
      .postConsecutivo({ unidad_ejecutora_id, vigencia_id: vigenciaId })
      .subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.Success && response.Status === 200) {
            this.guardarContrato(response.Data, unidad_ejecutora_id, vigenciaId, reintento);
          } else {
            this.guardando.set(false);
            this.alertService.showErrorAlert(
              'Error al generar consecutivo de contrato',
              'Por favor, intente de nuevo'
            );
          }
        },
        error: (error) => {
          console.log(error);
          this.guardando.set(false);
          this.alertService.showErrorAlert(
            'Error al generar consecutivo de contrato',
            'Por favor, intente de nuevo'
          );
        },
      });
  }

  guardarContrato(
    consecutivo: string | null,
    unidad_ejecutora_id: number,
    vigenciaId: number | null = null,
    reintento = false
  ) {
    if (this.viewMode() || this.formInfoGeneral.invalid) {
      this.guardando.set(false);
      this.formInfoGeneral.markAllAsTouched();
      return;
    }

    const formData = this.formInfoGeneral.value;

    const formParsed = {
      tipo_compromiso_id: formData.tipoCompromisoId,
      tipo_contrato_id: formData.tipoContratoId,
      perfil_contratista_id: formData.perfilContratistaId ?? null,
      // Tipos del modelo: fecha, bool y entero; lo que no aplica va como null.
      fecha_suscripcion_estudio: formData.fechaSuscripcionEstudios
        ? aFechaCrud(formData.fechaSuscripcionEstudios)
        : null,
      aplica_poliza: formData.aplicaPoliza ? formData.aplicaPoliza === '1' : null,
      vigencia_convenio: formData.vigenciaConvenio,
      convenio: formData.convenio,
      nombre_convenio: formData.nombreConvenio,
      modalidad_seleccion_id: formData.modalidadSeleccionId,
      tipologia_especifica_id: formData.tipologiaEspecificaId,
      regimen_contratacion_id: formData.regimenContratacionId,
      procedimiento_id: formData.procedimientoId,
      plazo_ejecucion: Number(formData.plazoEjecucion),
      unidad_ejecucion_id: formData.unidadEjecucionId,
      unidad_ejecutora_id: formData.unidadEjecutoraId || this.unidadesEjecutoras[0]?.Id,
    };

    const contratoId = this.contratoGeneral()?.id;
    const vigenciaParaCrear = vigenciaId ?? (Number(formData.vigenciaId) || null);
    const saveOperation = contratoId
      ? this.contratoGeneralCrudService.put(contratoId, formParsed)
      : this.contratoGeneralCrudService.post({
          ...formParsed,
          consecutivo_elaboracion: consecutivo,
          vigencia_id: vigenciaParaCrear,
        });

    saveOperation.subscribe({
      next: async (response: ApiResponse<any>) => {
        // El estado inicial solo se registra al crear: editar no cambia el estado del contrato.
        if (!contratoId) {
          await this.guardarEstado(response.Data.id);
        }

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
        // 409: otro contrato tomó el mismo consecutivo (restricción única). Se pide uno
        // nuevo y se reintenta una sola vez. Ante otros errores, como el 400 genérico
        // del CRUD, no se reintenta.
        if (!contratoId && error?.status === 409 && vigenciaId) {
          if (!reintento) {
            this.pedirConsecutivo(unidad_ejecutora_id, vigenciaId, true);
            return;
          }
          this.guardando.set(false);
          this.alertService.showErrorAlert(
            'Otro contrato tomó el mismo consecutivo dos veces seguidas. El contrato no se guardó; intente de nuevo en unos segundos.',
            'Error al asignar el consecutivo'
          );
          return;
        }
        this.guardando.set(false);
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
      contrato_general_id: { id: contratoId },
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
