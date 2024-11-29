import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { getSingleSpaExtraProviders } from 'single-spa-angular';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { RegistroContratoComponent } from './modules/registro-contrato/registro-contrato.component';
import { ConsultaContratoComponent } from './modules/consulta-contrato/consulta-contrato.component';
import { RevisionContratoComponent } from './modules/revision-contrato/revision-contrato.component';
import { AuthGuard } from 'src/_guards/auth.guard';

const routes: Routes = [
  {
    path: 'registrar',
    canActivate: [AuthGuard],
    component: RegistroContratoComponent,
  },
  {
    path: 'consultar',
    canActivate: [AuthGuard],
    component: ConsultaContratoComponent,
  },
  {
    path: 'revisar',
    canActivate: [AuthGuard],
    component: RevisionContratoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    provideRouter(routes),
    { provide: APP_BASE_HREF, useValue: '/contratos/' },
    getSingleSpaExtraProviders(),
    provideHttpClient(withFetch()),
  ],
})
export class AppRoutingModule {}
