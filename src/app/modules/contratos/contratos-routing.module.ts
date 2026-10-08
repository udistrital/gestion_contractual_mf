import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegistroContratoComponent } from './registro-contrato/registro-contrato.component';
import { ConsultaContratoComponent } from './consulta-contrato/consulta-contrato.component';
import { RevisionContratoComponent } from './revision-contrato/revision-contrato.component';
import { authGuard } from 'src/_guards/auth.guard';

const routes: Routes = [
  {
    path: 'registrar',
    canActivate: [authGuard],
    component: RegistroContratoComponent,
  },
  {
    path: 'consultar',
    canActivate: [authGuard],
    component: ConsultaContratoComponent,
  },
  {
    path: 'documentos/:contratoId',
    canActivate: [authGuard],
    component: RevisionContratoComponent,
  },
]

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContratosRoutingModule { }
