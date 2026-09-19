import { NgModule } from '@angular/core';
import { ConsultaContratoComponent } from './consulta-contrato.component';
import { DetalleContratoComponent } from './detalle-contrato/detalle-contrato.component';
import { ModalObservacionesComponent } from './modal-observaciones/modal-observaciones.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RegistroContratoModule } from '../registro-contrato/registro-contrato.module';

@NgModule({
  declarations: [ConsultaContratoComponent, ModalObservacionesComponent, DetalleContratoComponent],
  imports: [ SharedModule, RegistroContratoModule],
  exports: [ConsultaContratoComponent, ModalObservacionesComponent, DetalleContratoComponent],
})
export class ConsultaContratoModule {}
