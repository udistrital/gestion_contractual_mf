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
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ApiResponse, ContratoGeneral } from 'src/app/types/types';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { AlertService } from 'src/app/services/alert.service';

@Component({
    selector: 'app-registro-contrato',
    templateUrl: './registro-contrato.component.html',
    styleUrls: ['./registro-contrato.component.css'],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { showError: true },
        },
    ],
    standalone: false
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

  cargarContratoGeneral() {
    this.contratoGeneralCrudService.get(this.contratoGeneralId()).subscribe({
      next: (response: ApiResponse<ContratoGeneral>) => {
        if (response.Success) {
          this.contratoGeneral = response.Data;
        }
      },
      error: () => {
        this.alertService.showErrorAlert('Error al cargar el contrato general');
      }
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
    const isStep1Valid = this.pasoInfoGeneralValido && this.pasoInfoPresupuestalValido;
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
    const isStep2Valid = this.pasoSupervisoresValido && this.pasoContratistasValido;
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
    this.showAplicaPoliza = aplicaPoliza == '1'; // 1 = Si, 0 = No
    if (!this.showAplicaPoliza) {
      const currentSteps = this.stepsCompleted.value;
      currentSteps[4] = true;
      this.stepsCompleted.next(currentSteps);
    }
  }

  goToNextStep() {
    if (this.stepper.selected) {
      this.stepper.selected.completed = true;
      this.stepper.next();
    }
  }

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      if (event.previouslySelectedIndex === 1 && event.selectedIndex !== 1) {
        this.pasoContratistas?.onStepLeave();
      }
    });
    this.steps.toArray().forEach((step, index) => {
      step.label = `Paso ${index + 1}`;
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
