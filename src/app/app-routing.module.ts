import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroContratoComponent } from './modules/registro-contrato/registro-contrato.component';
import { ConsultaContratoComponent } from './modules/consulta-contrato/consulta-contrato.component';

const routes: Routes = [
  {
    path:"registrar-contrato",
    component: RegistroContratoComponent
  },
  {
    path:"consultar-contrato",
    component: ConsultaContratoComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }