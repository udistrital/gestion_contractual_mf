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
  SedeContratoMidResponse, Solicitante, SupervisorResponse, SupervisorToSave,
} from 'src/app/types/types';
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
export class PasoSupervisoresComponent implements OnInit, OnChanges {
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

  constructor() {
    this.form = this._formBuilder.group({
      solicitante: this._formBuilder.group({
        sede: [null, Validators.required],
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
    this.setupFormListeners();
    this.aplicarModoVisualizacion();
  }

  /** En modo visualización el formulario queda en solo lectura. */
  private aplicarModoVisualizacion(): void {
    if (this.viewMode()) {
      this.form.disable({ emitEvent: false });
    }
  }

  ngOnChanges(): void {
    if (this.contratoGeneral()?.id) {
      this.loadSavedData();
    }
  }

  private loadSavedData(): void {
    const contratoId = this.contratoGeneral()?.id;
    if (!contratoId || this.contratoCargadoId === contratoId || this.cargandoDatosGuardados) return;

    this.contratoCargadoId = contratoId;
    this.cargandoDatosGuardados = true;

    // Cargar datos del solicitante
    this.contratoGeneralCrudService
      .getSolicitante(contratoId)
      .subscribe({
        next: (response: any) => {
          const data = response?.Data ?? response;
          if (data && (data.sede_solicitante_id || data.dependencia_solicitante_id || data.id)) {
            const sedeId = data.sede_solicitante_id;
            const depId = data.dependencia_solicitante_id;
            this.solicitanteId = data?.id as number;
            this.solicitanteSaved = true;

            if (sedeId) {
              this.cargarDependencias(Number(sedeId), 'solicitante', undefined, false);
            }
            this.form.get('solicitante')?.patchValue({
              sede: sedeId,
              dependencia: depId,
            });
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
      .getSupervisores(contratoId)
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
                documento: supervisor.documento,
                sede_legado: supervisor.sede_legado,
                dependencia_legado: supervisor.dependencia_legado,
                cargo_legado: supervisor.cargo_legado,
              };

              const sedeId = Number(supervisor.sede_id);
              const depId = Number(supervisor.dependencia_id);

              if (sedeId) {
                this.cargarDependencias(sedeId, 'supervisor', index, false);
              }
              if (depId) {
                this.cargarSupervisor(String(depId), index);
              }

              supervisorForm.patchValue({
                sede: sedeId,
                dependencia: depId,
                codigoVerificacion: supervisor.digito_verificacion,
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

    const solicitanteData: Solicitante = {
      sede_solicitante_id: this.form.get('solicitante.sede')?.value,
      dependencia_solicitante_id: this.form.get('solicitante.dependencia')
        ?.value,
      contrato_general_id: this.contratoGeneral()?.id as number,
    };

    if (this.solicitanteId) {
      this.contratoGeneralCrudService
        .patchSolicitante(this.solicitanteId, solicitanteData)
        .subscribe({
          next: (response: any) => {
            this.solicitanteId = response.id;
            this.alertService.showSuccessAlert(
              'La información del solicitante se ha guardado correctamente'
            );
          }, error: () => {
            this.alertService.showErrorAlert(
              'Ocurrió un error al guardar la información del solicitante'
            );
          }
        });
    } else {
      this.contratoGeneralCrudService
        .postSolicitante(solicitanteData)
        .subscribe({
          next: (response: any) => {
            this.solicitanteId = response.id;
            this.solicitanteSaved = true;
          }, error: () => {
            this.alertService.showErrorAlert(
              'Ocurrió un error al guardar la información del solicitante'
            );
          }
        });
    }

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

        const supervisorData: SupervisorToSave = {
          supervisor_id: this.supervisorLegacy[i].documento, // TODO: Validar Supervisor ID
          sede_legado: this.supervisorLegacy[i].sede_legado,
          dependencia_legado: this.supervisorLegacy[i].dependencia_legado,
          cargo_legado: this.supervisorLegacy[i].cargo_legado,
          cargo_id: supervisorGroup.get('cargoId')?.value, // TODO: Validar Cargo ID
          digito_verificacion: supervisorGroup.get('codigoVerificacion')?.value,
          documento: this.supervisorLegacy[i].documento,
          sede_id: supervisorGroup.get('sede')?.value,
          dependencia_id: supervisorGroup.get('dependencia')?.value,
          contrato_general_id: this.contratoGeneral()?.id as number
        };

        // Si ya existe un ID para este supervisor, actualizamos
        const supervisorId = this.supervisoresIds[i];
        let promise;

        if (supervisorId) {
          promise = firstValueFrom(
            this.contratoGeneralCrudService.patchSupervisor(
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
      this.supervisoresIds = results.map(result => result.id);

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
    return sedeId ? this.dependenciasPorSede[Number(sedeId)] || [] : [];
  }

  getDependenciasSupervisor(index: number): DependenciaContratoMidResponse[] {
    const supervisor = this.getSupervisoresFormArray().at(index);
    const sedeId = supervisor?.get('sede')?.value;
    return sedeId ? this.dependenciasPorSede[Number(sedeId)] || [] : [];
  }

  private crearSupervisorFormGroup() {
    return this._formBuilder.group({
      sede: [null, Validators.required],
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
