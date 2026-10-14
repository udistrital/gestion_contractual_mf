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
  editMode = model<boolean>(true);
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

  isPasoCompletado(index: number): boolean {
    if (this.selectedIndex > index) {
      return true;
    }
    const completedArr = this.stepsCompleted.value;
    return !!completedArr[index];
  }

  getSublabelPaso(index: number, numeroFormateado: string): string {
    if (this.selectedIndex === index) {
      return `PASO ${numeroFormateado} ACTIVO`;
    }
    return `PASO ${numeroFormateado}`;
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
    this.selectedIndex = event.selectedIndex;
    if (event.previouslySelectedIndex === 1 && event.selectedIndex !== 1) {
      this.pasoContratistas?.onStepLeave();
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

  onContratoGuardado(contratoId: number) {
    this.contratoGeneralId.set(contratoId);
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
    this.stepper.selectionChange.subscribe((event) => {
      this.onStepSelectionChange(event);
    });
  }

  stepCompleted(stepIndex: number, isCompleted: boolean) {
    const currentSteps = this.stepsCompleted.value;
    currentSteps[stepIndex] = isCompleted;
    this.stepsCompleted.next(currentSteps);
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
