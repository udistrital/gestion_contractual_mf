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
import {DetalleContratoComponent} from "./detalle-contrato/detalle-contrato.component";
import {MatPaginator, MatPaginatorModule} from "@angular/material/paginator";
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {MatProgressSpinner, MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatTable, MatTableModule} from "@angular/material/table";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSortModule} from "@angular/material/sort";

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
    DetalleContratoComponent,
    MatPaginator,
    MatIcon,
    MatProgressSpinner,
    MatTable,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule
  ]
})
export class ConsultaContratoModule { }
