import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { PasoContratistasComponent } from "./paso-contratistas/paso-contratistas.component";
import { PasoInfoGeneralComponent } from "./paso-info-general/paso-info-general.component";
import { PasoObligacionesComponent } from "./paso-obligaciones/paso-obligaciones.component";
import {MatStepper} from "@angular/material/stepper";
import {STEPPER_GLOBAL_OPTIONS} from '@angular/cdk/stepper';

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


  constructor() {}

  ngOnInit() {
  }

  isLinear = true;

  goToNextStep() {
    if (this.stepper.selected) {
      this.stepper.selected.completed = true;
      this.stepper.next();
    }
  }

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      //Reset del componente (ligado al orden)
      if (event.previouslySelectedIndex === 3 && event.selectedIndex !== 3) {
        this.pasoContratistas.onStepLeave();
      }
    });
  }

}
