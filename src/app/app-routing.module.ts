import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { getSingleSpaExtraProviders } from 'single-spa-angular';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { RegistroContratoComponent } from './modules/registro-contrato/registro-contrato.component';
import { ConsultaContratoComponent } from './modules/consulta-contrato/consulta-contrato.component';
import {DetalleContratoComponent} from "./modules/consulta-contrato/detalle-contrato/detalle-contrato.component";

const routes: Routes = [
  {
    path:"registrar",
    component: RegistroContratoComponent
  },
  {
    path:"consultar",
    component: ConsultaContratoComponent
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
export class AppRoutingModule { }
