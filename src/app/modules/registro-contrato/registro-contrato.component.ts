import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { PasoContratistasComponent } from "./paso-contratistas/paso-contratistas.component";
import { PasoInfoGeneralComponent } from "./paso-info-general/paso-info-general.component";
import { PasoObligacionesComponent } from "./paso-obligaciones/paso-obligaciones.component";
import { PasoInfoPresupuestalComponent } from "./paso-info-presupuestal/paso-info-presupuestal.component";
import { MatStepper } from "@angular/material/stepper";
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild(PasoContratistasComponent) pasoContratistas!: PasoContratistasComponent;
  @ViewChild(PasoInfoGeneralComponent) pasoInfoGeneral!: PasoInfoGeneralComponent;
  @ViewChild(PasoObligacionesComponent) pasoObligaciones!: PasoObligacionesComponent;
  @ViewChild(PasoInfoPresupuestalComponent) pasoInfoPresupuestal!: PasoInfoPresupuestalComponent;

  isLinear = true;
  stepsCompleted: BehaviorSubject<boolean[]> = new BehaviorSubject<boolean[]>(new Array(8).fill(false));

  constructor() {}

  ngOnInit() {}

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
  }

  stepCompleted(stepIndex: number, isCompleted: boolean) {
    const currentSteps = this.stepsCompleted.value;
    currentSteps[stepIndex] = isCompleted;
    this.stepsCompleted.next(currentSteps);
  }

  canProceedToStep(stepIndex: number): Observable<boolean> {
    return this.stepsCompleted.pipe(
      map(steps => steps.slice(0, stepIndex).every(step => step))
    );
  }
}
