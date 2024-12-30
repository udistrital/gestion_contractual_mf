import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultaContratoComponent } from './consulta-contrato.component';
import { DetalleContratoComponent } from './detalle-contrato/detalle-contrato.component';
import { ModalObservacionesComponent } from './modal-observaciones/modal-observaciones.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [ConsultaContratoComponent, ModalObservacionesComponent],
  imports: [CommonModule, SharedModule, DetalleContratoComponent],
})
export class ConsultaContratoModule {}
