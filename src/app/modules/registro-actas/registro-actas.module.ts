import { NgModule } from '@angular/core';
import { RegistroActasComponent } from './registro-actas.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RegistroActasRoutingModule } from './registro-actas-routing.module';

@NgModule({
  declarations: [
    RegistroActasComponent
  ],
  imports: [
    SharedModule,
    RegistroActasRoutingModule
  ],
  exports: [
    RegistroActasComponent
  ]
})
export class RegistroActasModule {}
