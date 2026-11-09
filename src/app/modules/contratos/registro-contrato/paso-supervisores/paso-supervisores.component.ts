import {
  ChangeDetectorRef,
  Component,
  output,
  OnInit,
  OnChanges,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
} from '@angular/core';
import {FormBuilder, Validators, FormArray, AbstractControl, FormGroup} from '@angular/forms';
import { distinctUntilChanged, filter, finalize } from 'rxjs/operators';
import {
  ApiResponse,
  ContratoGeneral,
  DependenciaContratoMidResponse,
  ParametroResponse,
  SedeContratoMidResponse, SupervisorResponse, SupervisorToSave,
} from 'src/app/types/types';
import { environment } from 'src/environments/environment';
import { ParametrosService } from 'src/app/services/parametros.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { AlertService } from 'src/app/services/alert.service';
import {
  OrdenadoresSupervisoresContratacionMidService
} from "src/app/services/ordenadores-supervisores-contratacion-mid.service";
import {firstValueFrom} from "rxjs";

@Component({
    selector: 'app-paso-supervisores',
    templateUrl: './paso-supervisores.component.html',
    styleUrls: ['./paso-supervisores.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PasoSupervisoresComponent implements OnInit {
  nextStep = output<void>();
  stepCompleted = output<boolean>();
  contratoGeneral = input<ContratoGeneral>();
  viewMode = input<boolean>(false);

  solicitanteId: number | null = null;
  supervisoresIds: number[] = [];
  supervisorLegacy = [{
    documento: '',
    sede_legado: '',
    dependencia_legado: '',
    cargo_legado: '',
  }]
  sedes: SedeContratoMidResponse[] = [];
  dependenciasPorSede: { [key: number]: DependenciaContratoMidResponse[] } = {};
  // El CRUD v2 ya no guarda la sede (crud#51 3a1e5ab): la sede solo filtra las dependencias.
  // Al cargar un contrato, el MID da el nombre de la dependencia guardada y sus sedes: con una
  // sola se precarga; con varias, o si el MID falla, la sede queda vacía y la dependencia
  // guardada se ofrece sola, para que se vea sin borrarla.
  dependenciaGuardadaSolicitante: DependenciaContratoMidResponse | null = null;
  dependenciasGuardadasSupervisor: (DependenciaContratoMidResponse | null)[] = [];
  solicitanteSaved = false;
  cargandoDatosGuardados = false;
  private contratoCargadoId: number = 0;

  form: FormGroup;
  
  private readonly alertService = inject(AlertService);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly contratoGeneralMidService = inject(ContratoGeneralMidService);
  private readonly contratoGeneralCrudService = inject(ContratoGeneralCrudService);
  private readonly ordenadoresSupervisoresMidService = inject(OrdenadoresSupervisoresContratacionMidService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly parametrosService = inject(ParametrosService);

  /** Opciones de "Tipo y Alcance del Control" (Parámetros, tipo 119). */
  tiposControl: ParametroResponse[] = [];

  constructor() {
    this.form = this._formBuilder.group({
      solicitante: this._formBuilder.group({
        sede: [null],
        dependencia: [null, Validators.required],
      }),
      supervisores: this._formBuilder.array([this.crearSupervisorFormGroup()]),
    });
    effect(() => {
      if (this.contratoGeneral()) {
        this.loadSavedData();
      }
    })
  }

  ngOnInit(): void {
    this.cargarSedes();
    this.cargarTiposControl();
    this.setupFormListeners();
    this.aplicarModoVisualizacion();
  }

  private cargarTiposControl(): void {
    this.parametrosService
      .getParametrosPorTipo([environment.TIPO_CONTROL_ID])
      .then((parametros) => {
        this.tiposControl = parametros[environment.TIPO_CONTROL_ID] ?? [];
        this.cdRef.detectChanges();
      })
      .catch(() => console.log('No se pudieron cargar los tipos de control.'));
  }

  /** En modo visualización el formulario queda en solo lectura. */
  private aplicarModoVisualizacion(): void {
    if (this.viewMode()) {
      this.form.disable({ emitEvent: false });
    }
  }

  private loadSavedData(): void {
    const contratoId = this.contratoGeneral()?.id;
    if (!contratoId || this.contratoCargadoId === contratoId || this.cargandoDatosGuardados) return;

    this.contratoCargadoId = contratoId;
    this.cargandoDatosGuardados = true;

    // Cargar datos del solicitante (viven en contrato_general, modelo v2)
    this.contratoGeneralCrudService
      .get(contratoId)
      .subscribe({
        next: (response: any) => {
          const data = response?.Data;
          if (data?.dependencia_solicitante_id) {
            const depId = Number(data.dependencia_solicitante_id);
            this.solicitanteId = contratoId;
            this.solicitanteSaved = true;
            this.dependenciaGuardadaSolicitante = dependenciaGuardada(depId);
            this.form.get('solicitante')?.patchValue({ dependencia: depId });
            this.precargarSede(depId, 'solicitante');
            this.cdRef.detectChanges();
            this.aplicarModoVisualizacion();
          }
        },
        error: () => {
          console.log('No se pudo cargar el solicitante.');
        },
      });

    // Cargar supervisores
    this.contratoGeneralCrudService
      .getSupervisores({
        query: `contrato_general_id.id:${contratoId},activo:true`,
        sortby: 'id',
        order: 'asc',
        limit: 0,
      })
      .subscribe({
        next: (response: ApiResponse<SupervisorToSave[]>) => {
          const supervisores =
            response?.Data || (Array.isArray(response) ? response : []);
          if (supervisores && supervisores.length > 0) {
            this.supervisoresIds = supervisores.map(
              (sup) => sup?.id as number
            );
            if (
              supervisores.length > 1 &&
              this.getSupervisoresFormArray().length < 2
            ) {
              this.agregarSupervisor();
            }

            supervisores.forEach((supervisor, index) => {
              const supervisorForm = this.getSupervisoresFormArray().at(index);
              if (!supervisorForm) return;

              this.supervisorLegacy[index] = {
                documento: String(supervisor.documento ?? ''),
                sede_legado: supervisor.sede_legado,
                dependencia_legado: supervisor.dependencia_legado,
                cargo_legado: supervisor.cargo_legado,
              };

              const depId = Number(supervisor.dependencia_id);

              if (depId) {
                this.dependenciasGuardadasSupervisor[index] = dependenciaGuardada(depId, supervisor.dependencia_legado);
                this.cargarSupervisor(String(depId), index);
                this.precargarSede(depId, 'supervisor', index);
              }

              supervisorForm.patchValue({
                dependencia: depId || null,
                codigoVerificacion: supervisor.digito_verificacion,
                // Se guarda una sola vez en el contrato (ContratoGeneral.TipoControlId).
                tipoControl: this.contratoGeneral()?.tipo_control_id ?? null,
              });
            });

            this.checkStepCompleted();
            this.cdRef.detectChanges();
            this.aplicarModoVisualizacion();
            if (this.viewMode()) {
              this.stepCompleted.emit(supervisores.length > 0);
            }
          }
          this.cargandoDatosGuardados = false;
        },
        error: () => {
          console.log('No se pudo cargar el supervisor.');
          this.cargandoDatosGuardados = false;
        },
      });
  }

  guardarSolicitante() {
    if (!this.contratoGeneral()) {
      this.alertService.showAlert('No se ha guardado el contrato general');
      return;
    }

    if (this.form.get('solicitante')?.invalid) {
      this.form.get('solicitante')?.markAllAsTouched();
      return;
    }

    // El solicitante se guarda en contrato_general (PUT parcial).
    const contratoId = this.contratoGeneral()?.id as number;
    this.contratoGeneralCrudService
      .put(contratoId, {
        dependencia_solicitante_id: Number(
          this.form.get('solicitante.dependencia')?.value
        ),
      })
      .subscribe({
        next: () => {
          const actualizado = !!this.solicitanteId;
          this.solicitanteId = contratoId;
          this.solicitanteSaved = true;
          if (actualizado) {
            this.alertService.showSuccessAlert(
              'La información del solicitante se ha guardado correctamente'
            );
          }
        },
        error: () => {
          this.alertService.showErrorAlert(
            'Ocurrió un error al guardar la información del solicitante'
          );
        },
      });

    this.checkStepCompleted();
    this.cdRef.detectChanges();
  }

  async guardarSupervisores() {
    if (!this.contratoGeneral()) {
      this.alertService.showErrorAlert(
        'No se ha encontrado información del contrato'
      );
      return;
    }

    if (this.form.get('supervisores')?.invalid) {
      this.form.get('supervisores')?.markAllAsTouched();
      this.alertService.showErrorAlert(
        'Por favor, complete todos los campos requeridos de los supervisores'
      );
      return;
    }

    try {
      const supervisoresArray = this.getSupervisoresFormArray();
      const supervisoresPromises = [];

      for (let i = 0; i < supervisoresArray.length; i++) {
        const supervisorGroup = supervisoresArray.at(i);

        // Las columnas numéricas del CRUD se envían como enteros (null si no hay valor).
        const entero = (valor: unknown): number | null =>
          valor === null || valor === undefined || valor === '' ? null : Number(valor);
        const documento = entero(this.supervisorLegacy[i].documento);
        // cargo_id y el documento no vienen del formulario: sin valor no se envían,
        // porque un null en el PUT borra lo guardado.
        const supervisorData: SupervisorToSave = {
          ...(documento === null ? {} : { supervisor_id: documento, documento }), // TODO: Validar Supervisor ID
          sede_legado: this.supervisorLegacy[i].sede_legado,
          dependencia_legado: this.supervisorLegacy[i].dependencia_legado,
          cargo_legado: this.supervisorLegacy[i].cargo_legado,
          digito_verificacion: entero(supervisorGroup.get('codigoVerificacion')?.value),
          dependencia_id: entero(supervisorGroup.get('dependencia')?.value),
          contrato_general_id: { id: this.contratoGeneral()?.id as number },
        };

        // Si ya existe un ID para este supervisor, actualizamos
        const supervisorId = this.supervisoresIds[i];
        let promise;

        if (supervisorId) {
          promise = firstValueFrom(
            this.contratoGeneralCrudService.putSupervisor(
              supervisorId,
              supervisorData
            )
          );
        } else {
          promise = firstValueFrom(
            this.contratoGeneralCrudService.postSupervisor(supervisorData)
          );
        }

        supervisoresPromises.push(promise);
      }

      const results = await Promise.all(supervisoresPromises);

      // Actualizar los IDs de los supervisores guardados
      this.supervisoresIds = results.map((result) => result?.Data?.id);

      // "Tipo y Alcance del Control" se guarda en el contrato (uno para el contrato).
      const tipoControl = supervisoresArray.at(0)?.get('tipoControl')?.value;
      if (tipoControl) {
        await firstValueFrom(
          this.contratoGeneralCrudService.put(
            this.contratoGeneral()?.id as number,
            { tipo_control_id: Number(tipoControl) }
          )
        );
      }

      this.checkStepCompleted();

      this.alertService.showSuccessAlert(
        'La información de los supervisores se ha guardado correctamente'
      );

    } catch (error) {
      console.error('Error saving supervisors:', error);
      this.alertService.showErrorAlert(
        'Ocurrió un error al guardar la información de los supervisores'
      );
    } finally {
      this.cdRef.detectChanges();
    }
  }

  async guardarYContinuar() {
    if (!this.solicitanteSaved) {
      this.alertService.showAlert(
        'Por favor, guarde la información del solicitante antes de continuar',
        'Información incompleta'
      );
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.nextStep.emit();
  }

  // Métodos existentes mantenidos
  getDependenciasSolicitante(): DependenciaContratoMidResponse[] {
    const sedeId = this.form.get('solicitante.sede')?.value;
    const guardada = this.dependenciaGuardadaSolicitante;
    if (sedeId) {
      return conGuardada(this.dependenciasPorSede[Number(sedeId)] || [], guardada, this.form.get('solicitante.dependencia')?.value);
    }
    return guardada ? [guardada] : [];
  }

  getDependenciasSupervisor(index: number): DependenciaContratoMidResponse[] {
    const supervisor = this.getSupervisoresFormArray().at(index);
    const sedeId = supervisor?.get('sede')?.value;
    const guardada = this.dependenciasGuardadasSupervisor[index];
    if (sedeId) {
      return conGuardada(this.dependenciasPorSede[Number(sedeId)] || [], guardada, supervisor?.get('dependencia')?.value);
    }
    return guardada ? [guardada] : [];
  }

  /**
   * Nombre y sede de la dependencia guardada, desde el MID. La sede se fija sin emitir
   * cambios, para que los listeners no borren la dependencia, y luego se cargan las
   * dependencias de esa sede sin reiniciarla. Si el MID falla queda lo que ya se ve.
   */
  private precargarSede(dependenciaId: number, tipo: 'solicitante' | 'supervisor', index = 0): void {
    this.contratoGeneralMidService.getDependencia(dependenciaId).subscribe({
      next: (dependencia) => {
        if (!dependencia?.id) return;
        if (tipo === 'solicitante') {
          this.dependenciaGuardadaSolicitante = dependenciaGuardada(dependenciaId, dependencia.nombre);
        } else if (this.dependenciasGuardadasSupervisor[index]?.nombre === dependenciaGuardada(dependenciaId).nombre) {
          // Al supervisor solo le falta el nombre si no traía dependencia_legado.
          this.dependenciasGuardadasSupervisor[index] = dependenciaGuardada(dependenciaId, dependencia.nombre);
        }
        if (dependencia.sedes?.length === 1) {
          const sedeId = dependencia.sedes[0].id;
          const grupo = tipo === 'solicitante' ? this.form.get('solicitante') : this.getSupervisoresFormArray().at(index);
          grupo?.get('sede')?.setValue(sedeId, { emitEvent: false });
          this.cargarDependencias(sedeId, tipo, index, false);
        }
        this.cdRef.detectChanges();
      },
      error: () => console.warn(`No se pudo consultar la dependencia ${dependenciaId} en el MID.`),
    });
  }

  private crearSupervisorFormGroup() {
    return this._formBuilder.group({
      sede: [null],
      dependencia: [null, Validators.required],
      nombre: [{value: '', disabled: true}, Validators.required],
      cargo: [{value: '', disabled: true}, Validators.required],
      tipoControl: [null, Validators.required],
      codigoVerificacion: [{value: '', disabled: true}, Validators.required],
    });
  }

  private setupFormListeners(): void {
    this.form
      .get('solicitante.sede')
      ?.valueChanges.pipe(
        distinctUntilChanged(),
        filter((sedeId) => sedeId !== null && sedeId !== undefined)
      )
      .subscribe((sedeId) => {
        if (this.cargandoDatosGuardados) return;
        this.cargarDependencias(Number(sedeId), 'solicitante');
      });

    this.setupSupervisorListeners(0);
  }

  private setupSupervisorListeners(index: number): void {
    const supervisor = this.getSupervisoresFormArray().at(index);

    supervisor.get('sede')?.valueChanges.pipe(
      distinctUntilChanged(),
      filter((sedeId) => sedeId !== null && sedeId !== undefined)
    ).subscribe((sedeId) => {
      if (this.cargandoDatosGuardados) return;
      this.cargarDependencias(Number(sedeId), 'supervisor', index);

      supervisor.patchValue({
        dependencia: null,
        nombre: '',
        cargo: '',
        codigoVerificacion: '',
        cargoId: '',
        documento: ''
      }, { emitEvent: false });

    });

    supervisor.get('dependencia')?.valueChanges.pipe(
      distinctUntilChanged(),
      filter((dependenciaId) => dependenciaId !== null && dependenciaId !== undefined)
    ).subscribe((dependenciaId) => {
      if (this.cargandoDatosGuardados) return;
      this.cargarSupervisor(String(dependenciaId), index);
    });
  }

  private cargarSupervisor(dependenciaId: string, index: number): void {
    if (!dependenciaId) return;

    const supervisor = this.getSupervisoresFormArray().at(index);

    this.ordenadoresSupervisoresMidService.getSupervisoresDependencia(dependenciaId)
      .pipe(
        finalize(() => {
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (response: SupervisorResponse) => {
          if (response.Success && response.Data && response.Data.length > 0) {
            const supervisorData = response.Data[0];

            this.supervisorLegacy[index] = {
              documento: supervisorData.documento,
              sede_legado: supervisorData.sede_supervisor,
              dependencia_legado: supervisorData.dependencia_supervisor,
              cargo_legado: supervisorData.cargo_id
            }
            supervisor.patchValue({
              nombre: supervisorData.nombre,
              cargo: supervisorData.cargo,
              codigoVerificacion: supervisorData.digito_verificacion,
              cargoId: supervisorData.cargo_id,
              documento: supervisorData.documento
            }, { emitEvent: false });
          } else {
            // Limpiar campos si no hay respuesta
            this.limpiarCamposSupervisor(supervisor);
            this.alertService.showAlert(
              'No se encontró información del supervisor para la dependencia seleccionada',
              'Sin datos'
            );
          }
          this.cdRef.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar supervisor:', error);
          this.alertService.showErrorAlert(
            'Ocurrió un error al cargar la información del supervisor',
            'Error'
          );
          this.limpiarCamposSupervisor(supervisor);
          this.cdRef.detectChanges();
        }
      });
  }

  private limpiarCamposSupervisor(supervisorGroup: AbstractControl) {
    supervisorGroup.patchValue({
      nombre: '',
      cargo: '',
      codigoVerificacion: '',
      cargoId: '',
      documento: ''
    }, { emitEvent: false });

    this.supervisorLegacy = []
  }

  private cargarSedes(): void {
    this.contratoGeneralMidService
      .getSedes()
      .pipe(
        finalize(() => {
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (sedes) => {
          this.sedes = sedes;
          this.cdRef.detectChanges();
        },
        error: async (error) => {
          console.error('Error al cargar sedes:', error);
          this.alertService.showErrorAlert(
            'Ocurrió un error al cargar las sedes, por favor intenta más tarde.',
            'Error al cargar sedes'
          );
        },
      });
  }

  private cargarDependencias(
    sedeId: number,
    tipo: 'solicitante' | 'supervisor',
    supervisorIndex?: number,
    resetDependencia: boolean = true
  ): void {
    if (!sedeId) return;

    this.contratoGeneralMidService
      .getDependenciasBySede(sedeId)
      .pipe(
        finalize(() => {
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (dependencias) => {
          this.dependenciasPorSede[sedeId] = dependencias;

          if (resetDependencia) {
            switch (tipo) {
              case 'supervisor':
                if (supervisorIndex !== undefined) {
                  const supervisor = this.getSupervisoresFormArray().at(supervisorIndex);
                  supervisor.get('dependencia')?.setValue(null, { emitEvent: false });
                }
                break;

              case 'solicitante':
                this.form.get('solicitante.dependencia')?.setValue(null, { emitEvent: false });
                break;
            }
          }

          this.cdRef.detectChanges();
        },
        error: async (error) => {
          console.error(`Error al cargar dependencias para sede ${sedeId}:`, error);
        },
      });
  }

  getSupervisoresFormArray() {
    return this.form.get('supervisores') as FormArray;
  }

  agregarSupervisor() {
    if (this.getSupervisoresFormArray().length >= 2) {
      this.alertService.showAlert(
        'Solo se permite un máximo de 2 supervisores por contrato',
        'Límite alcanzado'
      );
      return;
    }
    const supervisorGroup = this.crearSupervisorFormGroup();
    this.getSupervisoresFormArray().push(supervisorGroup);
    const newIndex = this.getSupervisoresFormArray().length - 1;
    this.setupSupervisorListeners(newIndex);
  }

  eliminarSupervisor(index: number) {
    if (this.getSupervisoresFormArray().length > 1) {
      this.getSupervisoresFormArray().removeAt(index);
    }
  }

  private checkStepCompleted(): void {
    const isCompleted = this.solicitanteSaved && this.supervisoresIds.length > 0;
    this.stepCompleted.emit(isCompleted);
  }

  async onInView(inView: boolean) {
    if (inView) {
      // this.loadSavedData();
    } else {
      console.log('Step Info General - out of view');
    }
  }
}

/** La dependencia guardada sigue entre las opciones aunque la sede no la liste. */
function conGuardada(
  lista: DependenciaContratoMidResponse[],
  guardada: DependenciaContratoMidResponse | null | undefined,
  valor: unknown
): DependenciaContratoMidResponse[] {
  if (!guardada || Number(valor) !== guardada.id || lista.some((d) => d.id === guardada.id)) return lista;
  return [...lista, guardada];
}

/** Opción de la dependencia guardada cuando no hay sede; sin nombre se muestra el Id. */
function dependenciaGuardada(id: number, nombre?: string | null): DependenciaContratoMidResponse {
  return { id, nombre: nombre || `Dependencia guardada (Id ${id})` };
}
