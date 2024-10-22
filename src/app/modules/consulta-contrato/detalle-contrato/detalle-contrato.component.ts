import {Component, ViewChild} from '@angular/core';
import {MatStep, MatStepLabel, MatStepper} from "@angular/material/stepper";
import {PasoContratistasComponent} from "../../registro-contrato/paso-contratistas/paso-contratistas.component";
import {PasoInfoGeneralComponent} from "../../registro-contrato/paso-info-general/paso-info-general.component";
import {PasoObligacionesComponent} from "../../registro-contrato/paso-obligaciones/paso-obligaciones.component";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {RegistroContratoModule} from "../../registro-contrato/registro-contrato.module";

@Component({
  selector: 'app-detalle-contrato',
  standalone: true,
  imports: [
    MatStep,
    MatStepLabel,
    MatStepper,
    RegistroContratoModule
  ],
  templateUrl: './detalle-contrato.component.html',
  styleUrl: './detalle-contrato.component.css'
})
export class DetalleContratoComponent {

  formGroups: FormGroup[];

  constructor(private _formBuilder: FormBuilder) {
    this.formGroups = Array(9).fill(null).map(() => this._formBuilder.group({}));
  }

  ngOnInit() {
    this.formGroups = this.formGroups.map((_, index) => this._formBuilder.group({
      [`paso${index + 1}Ctrl`]: ['', Validators.required],
    }));
  }


}
