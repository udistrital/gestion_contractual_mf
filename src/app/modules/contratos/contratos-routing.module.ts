import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegistroContratoComponent } from './registro-contrato/registro-contrato.component';
import { ConsultaContratoComponent } from './consulta-contrato/consulta-contrato.component';
import { RevisionContratoComponent } from './revision-contrato/revision-contrato.component';
import { EditarContratoComponent } from './consulta-contrato/editar-contrato/editar-contrato.component';
import { authGuard } from 'src/_guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'gestionar',
  },
  {
    path: 'gestionar',
    canActivate: [authGuard],
    component: ConsultaContratoComponent,
  },
  {
    path: 'consultar',
    canActivate: [authGuard],
    component: ConsultaContratoComponent,
  },
  {
    path: 'registrar',
    canActivate: [authGuard],
    component: RegistroContratoComponent,
  },
  {
    path: 'editar/:contratoId',
    canActivate: [authGuard],
    component: EditarContratoComponent,
  },
  {
    path: 'documentos/:idContrato',
    canActivate: [authGuard],
    component: RevisionContratoComponent,
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
