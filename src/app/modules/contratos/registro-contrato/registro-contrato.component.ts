import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ViewChildren,
  QueryList,
  inject,
  model,
  effect,
} from '@angular/core';
import { PasoContratistasComponent } from './paso-contratistas/paso-contratistas.component';
import { PasoInfoGeneralComponent } from './paso-info-general/paso-info-general.component';
import { PasoObligacionesComponent } from './paso-obligaciones/paso-obligaciones.component';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal/paso-info-presupuestal.component';
import { MatStep, MatStepper } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS, StepperSelectionEvent } from '@angular/cdk/stepper';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ApiResponse, ContratoGeneral } from 'src/app/types/types';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { AlertService } from 'src/app/services/alert.service';

export type TipoEstadoPaso = 'actual' | 'verde' | 'amarillo' | 'gris';

export interface PasoDinamico {
  id: string;
  titulo: string;
  index: number;
  numeroFormateado: string;
}

@Component({
  selector: 'app-registro-contrato',
  templateUrl: './registro-contrato.component.html',
  styleUrls: ['./registro-contrato.component.css'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: false },
    },
  ],
  standalone: false,
})
export class RegistroContratoComponent implements OnInit, AfterViewInit {
  @ViewChildren(MatStep) steps!: QueryList<MatStep>;
  @ViewChild('stepper') stepper!: MatStepper;

  @ViewChild(PasoContratistasComponent)
  pasoContratistas!: PasoContratistasComponent;

  @ViewChild(PasoInfoGeneralComponent)
  pasoInfoGeneral!: PasoInfoGeneralComponent;

  @ViewChild(PasoObligacionesComponent)
  pasoObligaciones!: PasoObligacionesComponent;

  @ViewChild(PasoInfoPresupuestalComponent)
  pasoInfoPresupuestal!: PasoInfoPresupuestalComponent;

  orientation: 'horizontal' | 'vertical' = 'horizontal';

  isLinear = false;
  selectedIndex = 0;
  showEspecificacionesTecnicas = false;
  showAplicaPoliza = false;

  // Estados de persistencia y avance
  pasosGuardados = new Set<string>();
  pasosConAlerta = new Set<string>();
  pasosVisitados = new Set<string>();

  stepsCompleted: BehaviorSubject<boolean[]> = new BehaviorSubject<boolean[]>(
    new Array(6).fill(false)
  );

  pasoInfoGeneralValido = false;
  pasoInfoPresupuestalValido = false;
  pasoSupervisoresValido = false;
  pasoContratistasValido = false;

  private readonly contratoGeneralCrudService = inject(ContratoGeneralCrudService);
  private readonly alertService = inject(AlertService);
  private breakpointObserver = inject(BreakpointObserver);

  contratoGeneralId = model<number>(0);
  editMode = model<boolean>(false);
  contratoGeneral: ContratoGeneral | undefined = undefined;

  constructor() {
    effect(() => {
      if (this.contratoGeneralId()) {
        this.cargarContratoGeneral();
      }
    });
  }

  ngOnInit() {
    this.manejarResponsiveStepper();
    this.verificarPasosGuardadosIniciales();
  }

  /**
   * Genera de forma reactiva la lista de pasos correlativos (01, 02, 03...).
   * Los números y títulos se adaptan dinámicamente cuando aparecen
   * Especificaciones Técnicas y/o Garantías.
   */
  get pasosDinamicos(): PasoDinamico[] {
    const lista: Array<{ id: string; titulo: string }> = [
      { id: 'general', titulo: 'General y Presupuestal' },
      { id: 'responsables', titulo: 'Solicitante y Supervisor' },
      { id: 'estructura', titulo: 'Estructura y Necesidad' },
    ];

    if (this.showEspecificacionesTecnicas) {
      lista.push({
        id: 'especificaciones',
        titulo: 'Especificaciones Técnicas',
      });
    }

    if (this.showAplicaPoliza) {
      lista.push({
        id: 'garantias',
        titulo: 'Garantías y Mecanismos de Cobertura del Riesgo',
      });
    }

    lista.push({ id: 'clausulas', titulo: 'Clausulado y Parágrafos' });

    return lista.map((p, idx) => ({
      ...p,
      index: idx,
      numeroFormateado: (idx + 1).toString().padStart(2, '0'),
    }));
  }

  /**
   * Determina el estado exacto del paso conforme a la regla de 4 estados:
   * 1. 'actual' (ROJO): Paso actual en edición.
   * 2. 'verde' (VERDE): Únicamente cuando el paso ha sido guardado con éxito.
   * 3. 'amarillo' (AMARILLO): Alerta de que faltan campos o no se ha guardado el paso.
   * 4. 'gris' (GRIS): Paso sin campos llenos / no iniciado.
   */
  getEstadoPaso(paso: PasoDinamico): TipoEstadoPaso {
    if (this.selectedIndex === paso.index) {
      return 'actual';
    }

    if (this.pasosGuardados.has(paso.id)) {
      return 'verde';
    }

    if (this.pasosConAlerta.has(paso.id) || this.pasosVisitados.has(paso.id)) {
      return 'amarillo';
    }

    return 'gris';
  }

  getSublabelPaso(paso: PasoDinamico): string {
    const estado = this.getEstadoPaso(paso);
    switch (estado) {
      case 'actual':
        return `PASO ${paso.numeroFormateado} ACTIVO`;
      case 'verde':
        return `PASO ${paso.numeroFormateado} GUARDADO`;
      case 'amarillo':
        return `PASO ${paso.numeroFormateado} PENDIENTE`;
      case 'gris':
      default:
        return `PASO ${paso.numeroFormateado}`;
    }
  }

  marcarPasoGuardado(pasoId: string) {
    this.pasosGuardados.add(pasoId);
    this.pasosConAlerta.delete(pasoId);
  }

  desmarcarPasoGuardado(pasoId: string) {
    this.pasosGuardados.delete(pasoId);
    if (this.pasosVisitados.has(pasoId)) {
      this.pasosConAlerta.add(pasoId);
    }
  }

  marcarPasoConAlerta(pasoId: string) {
    if (!this.pasosGuardados.has(pasoId)) {
      this.pasosConAlerta.add(pasoId);
    }
  }

  onPresupuestalGuardado() {
    this.marcarPasoGuardado('general');
    this.cargarContratoGeneral();
  }

  onPasoEstructuraCompleted(isCompleted: boolean) {
    this.stepCompleted(2, isCompleted);
    if (isCompleted) {
      this.marcarPasoGuardado('estructura');
    }
  }

  onPasoEspecificacionesCompleted(isCompleted: boolean) {
    this.stepCompleted(3, isCompleted);
    if (isCompleted) {
      this.marcarPasoGuardado('especificaciones');
    }
  }

  onPasoGarantiasCompleted(isCompleted: boolean) {
    this.stepCompleted(4, isCompleted);
    if (isCompleted) {
      this.marcarPasoGuardado('garantias');
    }
  }

  onPasoClausulasCompleted(isCompleted: boolean) {
    this.stepCompleted(5, isCompleted);
    if (isCompleted) {
      this.marcarPasoGuardado('clausulas');
    }
  }

  /**
   * Navegación libre hacia cualquier sección del formulario
   */
  irAlPaso(index: number) {
    if (this.stepper && index >= 0 && index < this.pasosDinamicos.length) {
      this.stepper.selectedIndex = index;
      this.selectedIndex = index;
    }
  }

  onStepSelectionChange(event: StepperSelectionEvent) {
    const prevIndex = event.previouslySelectedIndex;
    const currIndex = event.selectedIndex;
    this.selectedIndex = currIndex;

    // Al salir de un paso previo, si no fue guardado con éxito, se marca en amarillo (alerta)
    if (
      prevIndex !== undefined &&
      prevIndex >= 0 &&
      prevIndex < this.pasosDinamicos.length
    ) {
      const prevPaso = this.pasosDinamicos[prevIndex];
      if (prevPaso) {
        this.pasosVisitados.add(prevPaso.id);
        if (!this.pasosGuardados.has(prevPaso.id)) {
          this.pasosConAlerta.add(prevPaso.id);
        }
      }
    }
  }

  goToNextStep() {
    if (this.stepper) {
      const nextIndex = this.selectedIndex + 1;
      if (nextIndex < this.pasosDinamicos.length) {
        this.irAlPaso(nextIndex);
      }
    }
  }

  cargarContratoGeneral() {
    this.contratoGeneralCrudService.get(this.contratoGeneralId()).subscribe({
      next: (response: ApiResponse<ContratoGeneral>) => {
        if (response.Success && response.Data) {
          this.contratoGeneral = response.Data;
          if (this.contratoGeneral.id) {
            this.marcarPasoGuardado('general');
          }
          if (this.contratoGeneral.objeto || this.contratoGeneral.actividades) {
            this.marcarPasoGuardado('estructura');
          }
          if (this.contratoGeneral.contratista) {
            this.marcarPasoGuardado('responsables');
          }
          if (this.contratoGeneral.tipo_compromiso_id) {
            this.onTipoCompromisoChange(
              this.contratoGeneral.tipo_compromiso_id.toString()
            );
          }
          if (
            this.contratoGeneral.aplica_poliza !== undefined &&
            this.contratoGeneral.aplica_poliza !== null
          ) {
            this.onAplicaPolizaChange(
              this.contratoGeneral.aplica_poliza ? '1' : '0'
            );
          }
        }
      },
      error: () => {
        this.alertService.showErrorAlert('Error al cargar el contrato general');
      },
    });
  }

  private verificarPasosGuardadosIniciales() {
    if (localStorage.getItem('paso-info-general')) {
      try {
        const data = JSON.parse(
          localStorage.getItem('paso-info-general') || '{}'
        );
        if (data.id) {
          this.marcarPasoGuardado('general');
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (
      localStorage.getItem('paso-contratistas') ||
      localStorage.getItem('paso-supervisores')
    ) {
      this.marcarPasoGuardado('responsables');
    }
    if (localStorage.getItem('paso-garantias')) {
      this.marcarPasoGuardado('garantias');
    }
  }

  onContratoGuardado(contratoId: number) {
    this.contratoGeneralId.set(contratoId);
    this.marcarPasoGuardado('general');
    this.cargarContratoGeneral();
  }

  onPasoInfoGeneralCompleted(isCompleted: boolean) {
    this.pasoInfoGeneralValido = isCompleted;
    this.verificarPaso1Completo();
  }

  onPasoInfoPresupuestalCompleted(isCompleted: boolean) {
    this.pasoInfoPresupuestalValido = isCompleted;
    this.verificarPaso1Completo();
  }

  private verificarPaso1Completo() {
    const isStep1Valid =
      this.pasoInfoGeneralValido && this.pasoInfoPresupuestalValido;
    this.stepCompleted(0, isStep1Valid);
    if (isStep1Valid && this.contratoGeneralId() > 0) {
      this.marcarPasoGuardado('general');
    }
  }

  onPasoSupervisoresCompleted(isCompleted: boolean) {
    this.pasoSupervisoresValido = isCompleted;
    this.verificarPaso2Completo();
  }

  onPasoContratistasCompleted(isCompleted: boolean) {
    this.pasoContratistasValido = isCompleted;
    this.verificarPaso2Completo();
  }

  private verificarPaso2Completo() {
    const isStep2Valid =
      this.pasoSupervisoresValido && this.pasoContratistasValido;
    this.stepCompleted(1, isStep2Valid);
    if (isStep2Valid) {
      this.marcarPasoGuardado('responsables');
    }
  }

  onTipoCompromisoChange(tipoCompromisoId: string) {
    this.showEspecificacionesTecnicas =
      tipoCompromisoId === environment.ORDEN_ID.toString();

    if (!this.showEspecificacionesTecnicas) {
      const currentSteps = this.stepsCompleted.value;
      currentSteps[3] = true;
      this.stepsCompleted.next(currentSteps);
    }
  }

  onAplicaPolizaChange(aplicaPoliza: string) {
    this.showAplicaPoliza = aplicaPoliza === '1'; // 1 = Si, 0 = No
    if (!this.showAplicaPoliza) {
      const currentSteps = this.stepsCompleted.value;
      currentSteps[4] = true;
      this.stepsCompleted.next(currentSteps);
    }
  }

  ngAfterViewInit() {
    this.steps.toArray().forEach((step, index) => {
      step.label = `Paso ${index + 1}`;
    });
    this.stepper.selectionChange.subscribe((event) => {
      this.onStepSelectionChange(event);
    });
  }

  stepCompleted(stepIndex: number, isCompleted: boolean) {
    const currentSteps = this.stepsCompleted.value;
    currentSteps[stepIndex] = isCompleted;
    this.stepsCompleted.next(currentSteps);

    // Mapeo dinámico a pasoId según su índice
    if (stepIndex === 2 && isCompleted) {
      this.marcarPasoGuardado('estructura');
    } else if (stepIndex === 3 && isCompleted) {
      this.marcarPasoGuardado('especificaciones');
    } else if (stepIndex === 4 && isCompleted) {
      this.marcarPasoGuardado('garantias');
    } else if (stepIndex === 5 && isCompleted) {
      this.marcarPasoGuardado('clausulas');
    }
  }

  canProceedToStep(stepIndex: number): Observable<boolean> {
    return this.stepsCompleted.pipe(
      map((steps) => steps.slice(0, stepIndex).every((step) => step))
    );
  }

  manejarResponsiveStepper() {
    this.breakpointObserver
      .observe(['(max-width: 992px)'])
      .subscribe((result) => {
        this.orientation = result.matches ? 'vertical' : 'horizontal';
      });
  }
}
