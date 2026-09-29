import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { RegistroContratoComponent } from './modules/registro-contrato/registro-contrato.component';
import { ConsultaContratoComponent } from './modules/consulta-contrato/consulta-contrato.component';
import { RevisionContratoComponent } from './modules/revision-contrato/revision-contrato.component';
import { RegistroActasComponent } from './modules/registro-actas/registro-actas.component';
import { RegistroPolizaComponent } from './modules/polizas/registro-poliza/registro-poliza.component';
import { VisualizarPolizaComponent } from './modules/polizas/visualizar-poliza/visualizar-poliza.component';
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
    path: ':idContrato/documentos',
    canActivate: [authGuard],
    component: RevisionContratoComponent,
  },
  {
    path: 'actas/registrar',
    canActivate: [authGuard],
    component: RegistroActasComponent,
  },
  {
    path: 'polizas/registrar',
    canActivate: [authGuard],
    component: RegistroPolizaComponent,
  },
  {
    path: 'polizas/consultar',
    canActivate: [authGuard],
    component: VisualizarPolizaComponent,
  },
  {
    path: 'polizas/listado',
    canActivate: [authGuard],
    component: VisualizarPolizaComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/contratos/' },
  ],
})
export class AppRoutingModule {}
