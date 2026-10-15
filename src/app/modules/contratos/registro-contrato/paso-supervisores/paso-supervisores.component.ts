import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import {FormBuilder, Validators, FormArray, AbstractControl} from '@angular/forms';
import { distinctUntilChanged, filter, finalize } from 'rxjs/operators';
import {
  DependenciaContratoMidResponse,
  SedeContratoMidResponse, SupervisorResponse, SupervisorToSave,
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
export class PasoSupervisoresComponent implements OnInit {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  contratoGeneralId: number | null = null;
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
  loading = false;
  solicitanteSaved = false;

  form = this._formBuilder.group({
    solicitante: this._formBuilder.group({
      sede: [null, Validators.required],
      dependencia: [null, Validators.required],
    }),
    supervisores: this._formBuilder.array([this.crearSupervisorFormGroup()]),
  });

  constructor(
    private alertService: AlertService,
    private _formBuilder: FormBuilder,
    private contratoGeneralMidService: ContratoGeneralMidService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private ordenadoresSupervisoresMidService: OrdenadoresSupervisoresContratacionMidService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSavedData();
    this.cargarSedes();
    this.setupFormListeners();
  }

  private loadSavedData(): void {
    try {
      const contratoGeneral = localStorage.getItem('paso-info-general');
      if (contratoGeneral) {
        const parsedContrato = JSON.parse(contratoGeneral);
        this.contratoGeneralId = parsedContrato.id;
      }

      // Cargar datos del solicitante
      const savedSolicitante = localStorage.getItem('paso-info-solicitante');
      if (savedSolicitante) {
        const parsedSolicitante = JSON.parse(savedSolicitante);
        this.form.get('solicitante')?.patchValue({
          sede: parsedSolicitante.sede_solicitante_id,
          dependencia: parsedSolicitante.dependencia_solicitante_id,
        });
        this.solicitanteId = parsedSolicitante.id;
        this.solicitanteSaved = true;
      }

      const savedSupervisores = localStorage.getItem('paso-supervisores');
      if (savedSupervisores) {
        const parsedSupervisores = JSON.parse(savedSupervisores);
        console.log('Supervisores guardados:', parsedSupervisores);
        this.supervisoresIds = parsedSupervisores.supervisores;
      }
      this.checkStepCompleted();
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }

  async guardarSolicitante() {
    if (!this.contratoGeneralId) {
      console.log('No se ha cargado el contrato general');
      return;
    }

    if (this.form.get('solicitante')?.invalid) {
      this.form.get('solicitante')?.markAllAsTouched();
      return;
    }

    try {
      this.loading = true;
      let solicitanteData = {
        sede_solicitante_id: this.form.get('solicitante.sede')?.value,
        dependencia_solicitante_id: this.form.get('solicitante.dependencia')
          ?.value,
        contrato_general_id: this.contratoGeneralId,
      };

      let solicitante_id = this.solicitanteId;

      if (solicitante_id) {
        this.contratoGeneralCrudService
          .patchSolicitante(solicitante_id, solicitanteData)
          .subscribe((response: any) => {
            solicitante_id = response.id;
          });
      } else {
        this.contratoGeneralCrudService
          .postSolicitante(solicitanteData)
          .subscribe((response: any) => {
            solicitante_id = response.id;
          });
      }

      localStorage.setItem(
        'paso-info-solicitante',
        JSON.stringify({ ...solicitanteData, id: solicitante_id })
      );
      this.solicitanteSaved = true;
      this.checkStepCompleted();

      this.alertService.showSuccessAlert(
        'La información del solicitante se ha guardado correctamente'
      );
    } catch (error) {
      console.error('Error saving solicitante:', error);
      this.alertService.showErrorAlert(
        'Ocurrió un error al guardar la información del solicitante'
      );
    } finally {
      this.loading = false;
      this.cdRef.detectChanges();
    }
  }



  async guardarSupervisores() {
    if (!this.contratoGeneralId) {
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
      this.loading = true;
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
          contrato_general_id: this.contratoGeneralId
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

      // Guardar en localStorage para persistencia
      localStorage.setItem(
        'paso-supervisores',
        JSON.stringify({
          supervisores: this.supervisoresIds,
          contrato_id: this.contratoGeneralId
        })
      );
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
      this.loading = false;
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
      this.cargarSupervisor(String(dependenciaId), index);
    });
  }

  private cargarSupervisor(dependenciaId: string, index: number): void {
    if (!dependenciaId) return;

    this.loading = true;
    const supervisor = this.getSupervisoresFormArray().at(index);

    this.ordenadoresSupervisoresMidService.getSupervisoresDependencia(dependenciaId)
      .pipe(
        finalize(() => {
          this.loading = false;
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
    this.loading = true;
    this.contratoGeneralMidService
      .getSedes()
      .pipe(
        finalize(() => {
          this.loading = false;
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
    supervisorIndex?: number
  ): void {
    if (!sedeId) return;

    this.loading = true;
    this.contratoGeneralMidService
      .getDependenciasBySede(sedeId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (dependencias) => {
          this.dependenciasPorSede[sedeId] = dependencias;

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

          this.cdRef.detectChanges();
        },
        error: async (error) => {
          console.error(`Error al cargar dependencias para sede ${sedeId}:`, error);
          this.alertService.showErrorAlert(
            'Ocurrió un error al cargar las dependencias, por favor intenta más tarde.',
            'Error al cargar dependencias'
          );
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
      this.loadSavedData();
    } else {
      console.log('Step Info General - out of view');
    }
  }
}
