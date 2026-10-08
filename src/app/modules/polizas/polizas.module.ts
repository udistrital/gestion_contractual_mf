import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { RegistroPolizaComponent } from './registro-poliza/registro-poliza.component';
import { AsociarContratoComponent } from './registro-poliza/asociar-contrato/asociar-contrato.component';
import { DatosBasicosComponent } from './registro-poliza/datos-basicos/datos-basicos.component';
import { AmparoContratoComponent } from './registro-poliza/amparo-contrato/amparo-contrato.component';
import { VisualizarPolizaComponent } from './visualizar-poliza/visualizar-poliza.component';
import { PolizasRoutingModule } from './polizas-routing.module';

@NgModule({
  declarations: [
    RegistroPolizaComponent,
    AsociarContratoComponent,
    DatosBasicosComponent,
    AmparoContratoComponent,
    VisualizarPolizaComponent
  ],
  imports: [
    SharedModule,
    PolizasRoutingModule
  ],
  exports: [
    RegistroPolizaComponent,
    AsociarContratoComponent,
    DatosBasicosComponent,
    AmparoContratoComponent,
    VisualizarPolizaComponent
  ]
})
export class PolizasModule {}
