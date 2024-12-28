import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { PasoContratistasComponent } from './paso-contratistas/paso-contratistas.component';
import { PasoInfoGeneralComponent } from './paso-info-general/paso-info-general.component';
import { PasoObligacionesComponent } from './paso-obligaciones/paso-obligaciones.component';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal/paso-info-presupuestal.component';
import { MatStep, MatStepper } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BreakpointObserver } from '@angular/cdk/layout';

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
    new Array(9).fill(false)
  );

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.manejarResponsiveStepper();
  }

  onTipoCompromisoChange(tipoCompromisoId: string) {
    this.showEspecificacionesTecnicas =
      tipoCompromisoId === environment.ORDEN_ID.toString();

    if (!this.showEspecificacionesTecnicas) {
      const currentSteps = this.stepsCompleted.value;
      currentSteps[6] = true;
      this.stepsCompleted.next(currentSteps);
    }
  }

  onAplicaPolizaChange(aplicaPoliza: string) {
    this.showAplicaPoliza = aplicaPoliza == '1'; // 1 = Si, 0 = No
    if (!this.showAplicaPoliza) {
      const currentSteps = this.stepsCompleted.value;
      currentSteps[7] = true;
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
      if (event.previouslySelectedIndex === 3 && event.selectedIndex !== 3) {
        this.pasoContratistas.onStepLeave();
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
