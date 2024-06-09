import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroContratoComponent } from './modules/registro-contrato/registro-contrato.component';

const routes: Routes = [
  {
    path:"registrar-contrato",
    component: RegistroContratoComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
