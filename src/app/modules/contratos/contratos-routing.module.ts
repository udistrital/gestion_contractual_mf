import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegistroContratoComponent } from './registro-contrato/registro-contrato.component';
import { ConsultaContratoComponent } from './consulta-contrato/consulta-contrato.component';
import { RevisionContratoComponent } from './revision-contrato/revision-contrato.component';
import { EditarContratoComponent } from './consulta-contrato/editar-contrato/editar-contrato.component';
import { DetalleContratoComponent } from './consulta-contrato/detalle-contrato/detalle-contrato.component';
import { authGuard, VISTAS_PRINCIPALES } from 'src/_guards/auth.guard';

/**
 * Registrar y las vistas internas se abren desde la consulta de contratos
 * (ConsultaContratoComponent, en consultar) y se autorizan por esa vista principal.
 */
const DESDE_CONSULTA = {
  [VISTAS_PRINCIPALES]: ['/gestion-contractual/contratos/consultar'],
};

export const CONTRATOS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'consultar',
  },
  {
    path: 'consultar',
    canActivate: [authGuard],
    component: ConsultaContratoComponent,
  },
  {
    path: 'registrar',
    canActivate: [authGuard],
    data: DESDE_CONSULTA,
    component: RegistroContratoComponent,
  },
  {
    path: 'editar/:contratoId',
    canActivate: [authGuard],
    data: DESDE_CONSULTA,
    component: EditarContratoComponent,
  },
  {
    path: 'documentos/:contratoId',
    canActivate: [authGuard],
    data: DESDE_CONSULTA,
    component: RevisionContratoComponent,
  },
  {
    path: 'detalle/:contratoId',
    canActivate: [authGuard],
    data: DESDE_CONSULTA,
    component: DetalleContratoComponent,
  },
]

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(CONTRATOS_ROUTES)],
  exports: [RouterModule]
})
export class ContratosRoutingModule { }
