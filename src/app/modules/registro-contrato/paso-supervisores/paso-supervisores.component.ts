import {ChangeDetectorRef, Component, EventEmitter, Output, OnInit, ChangeDetectionStrategy} from '@angular/core';
import { FormBuilder, Validators, FormArray } from '@angular/forms';
import { UbicacionService } from 'src/app/services/ubicacion.service';
import {distinctUntilChanged, filter, finalize} from 'rxjs/operators';
import {DependenciaContratoMidResponse, SedeContratoMidResponse} from "../../../types/types";
import {ContratoGeneralMidService} from "../../../services/contrato-general-mid.service";
import Swal from "sweetalert2";

@Component({
  selector: 'app-paso-supervisores',
  templateUrl: './paso-supervisores.component.html',
  styleUrls: ['./paso-supervisores.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class PasoSupervisoresComponent implements OnInit {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  sedes: SedeContratoMidResponse[] = [];
  dependenciasPorSede: { [key: number]: DependenciaContratoMidResponse[] } = {};
  loading = false;

  getDependenciasSolicitante(): DependenciaContratoMidResponse[] {
    const sedeId = this.form.get('solicitante.sede')?.value;
    return sedeId ? this.dependenciasPorSede[Number(sedeId)] || [] : [];
  }

  getDependenciasSupervisor(index: number): DependenciaContratoMidResponse[] {
    const supervisor = this.getSupervisoresFormArray().at(index);
    const sedeId = supervisor?.get('sede')?.value;
    return sedeId ? this.dependenciasPorSede[Number(sedeId)] || [] : [];
  }

  getDependenciasLugarEjecucion(): DependenciaContratoMidResponse[] {
    const sedeId = this.form.get('lugarEjecucion.sede')?.value;
    return sedeId ? this.dependenciasPorSede[Number(sedeId)] || [] : [];
  }

  constructor(
    private _formBuilder: FormBuilder,
    private ubicacionService: UbicacionService,
    private contratoGeneralMidService: ContratoGeneralMidService,
    private cdRef: ChangeDetectorRef
  ) {}

  form = this._formBuilder.group({
    solicitante: this._formBuilder.group({
      sede: [null, Validators.required],  // Cambiado de '' a null
      dependencia: [null, Validators.required],  // Cambiado de '' a null
    }),
    supervisores: this._formBuilder.array([this.crearSupervisorFormGroup()]),
    lugarEjecucion: this._formBuilder.group({
      pais: [null, Validators.required],
      departamento: [null, Validators.required],
      municipioCiudad: [null, Validators.required],
      sede: [null, Validators.required],
      dependencia: [null, Validators.required],
      direccion: ['', Validators.required],
    })
  });

  supervisores: any[] = [{
    dependencia: '',
    sede: '',
    nombre: '',
    cargo: '',
    tipoControl: '',
    codigoVerificacion: ''
  }];

  pais: any[] = [];
  departamento: any[] = [];
  municipioCiudad: any[] = [];

  ngOnInit(): void {
    this.cargarSedes();
    this.setupFormListeners();
    this.CargarPais();

    this.form.get('lugarEjecucion.pais')?.valueChanges.subscribe((id_pais) => {
      if (id_pais) {
        this.CargarDepartamento(id_pais);
      }
    });

    this.form.get('lugarEjecucion.departamento')?.valueChanges.subscribe((id_departamento) => {
      if (id_departamento) {
        this.CargarCiudad(id_departamento);
      }
    });
  }

  private crearSupervisorFormGroup() {
    return this._formBuilder.group({
      sede: [null, Validators.required],  // Cambiado de '' a null
      dependencia: [null, Validators.required],
      nombre: ['', Validators.required],
      cargo: ['', Validators.required],
      tipoControl: [null, Validators.required],
      codigoVerificacion: ['', Validators.required],
    });
  }

  private setupFormListeners(): void {
    this.form.get('solicitante.sede')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        filter(sedeId => sedeId !== null && sedeId !== undefined)
      )
      .subscribe(sedeId => {
        this.cargarDependencias(Number(sedeId), 'solicitante');
      });

    this.form.get('lugarEjecucion.sede')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        filter(sedeId => sedeId !== null && sedeId !== undefined)
      )
      .subscribe(sedeId => {
        this.cargarDependencias(Number(sedeId), 'lugarEjecucion');
      });
  }

  private setupSupervisorListeners(supervisorGroup: any, index: number): void {
    supervisorGroup.get('sede')?.valueChanges.subscribe((sedeId: string) => {
      if (sedeId) {
        this.cargarDependencias(Number(sedeId), 'supervisor', index);
      }
    });
  }

  private cargarSedes(): void {
    this.loading = true;
    this.contratoGeneralMidService.getSedes()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (sedes) => {
          this.sedes = sedes;
          this.cdRef.detectChanges();
        },
        error: async (error) => {
          console.error('Error al cargar sedes:', error);
          await Swal.fire({
            icon: 'error',
            title: 'Error al cargar sedes',
            text: 'Ocurrió un error al cargar las sedes, por favor intenta más tarde.',
          });
        }
      });
  }

  private cargarDependencias(sedeId: number, tipo: 'solicitante' | 'supervisor' | 'lugarEjecucion', supervisorIndex?: number): void {
    if (!sedeId) return;

    this.loading = true;
    this.contratoGeneralMidService.getDependenciasBySede(sedeId)
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

            case 'lugarEjecucion':
              this.form.get('lugarEjecucion.dependencia')?.setValue(null, { emitEvent: false });
              break;
          }
        },
        error: (error) => {
          console.error(`Error al cargar dependencias para sede ${sedeId}:`, error);
          Swal.fire({
            icon: 'error',
            title: 'Error al cargar dependencias',
            text: 'Ocurrió un error al cargar las dependencias, por favor intenta más tarde.',
          })
        }
      });
  }

  getSupervisoresFormArray() {
    return this.form.get('supervisores') as FormArray;
  }

  agregarSupervisor() {
    const supervisorGroup = this.crearSupervisorFormGroup();
    this.getSupervisoresFormArray().push(supervisorGroup);
    this.setupSupervisorListeners(supervisorGroup, this.getSupervisoresFormArray().length - 1);
  }

  eliminarSupervisor(index: number) {
    if (this.getSupervisoresFormArray().length > 1) {
      this.getSupervisoresFormArray().removeAt(index);
    }
  }

  CargarPais() {
    this.ubicacionService.get('lugar?query=TipoLugarId:1&limit=0').subscribe((Response: any) => {
      if (Response.length != 0) {
        this.pais = Response;
      }
    });
  }

  CargarDepartamento(id_pais: string) {
    this.ubicacionService.get('relacion_lugares?query=LugarPadreId:' + id_pais + '&limit=0').subscribe((Response: any) => {
      if (Response.length != 0) {
        this.departamento = Response;
      }
    });
  }

  CargarCiudad(id_departamento: string) {
    this.ubicacionService.get('relacion_lugares?query=LugarPadreId:' + id_departamento + '&limit=0').subscribe((Response: any) => {
      if (Response.length != 0) {
        this.municipioCiudad = Response;
      }
    });
  }
}
