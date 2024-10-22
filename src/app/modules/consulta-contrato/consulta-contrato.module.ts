import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultaContratoComponent } from './consulta-contrato.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {RegistroContratoModule} from "../registro-contrato/registro-contrato.module";
import {DetalleContratoComponent} from "./detalle-contrato/detalle-contrato.component";

@NgModule({
  declarations: [
    ConsultaContratoComponent
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    DetalleContratoComponent
  ]
})
export class ConsultaContratoModule { }
