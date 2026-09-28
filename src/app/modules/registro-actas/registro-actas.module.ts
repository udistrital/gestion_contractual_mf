import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroActasComponent } from './registro-actas.component';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    RegistroActasComponent
  ],
  providers: [
    GestionContractualCrudService, 
  ],
})
export class RegistroActasModule {}
