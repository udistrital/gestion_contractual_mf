import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { authGuard } from "src/_guards/auth.guard";
import { VisualizarPolizaComponent } from "./visualizar-poliza/visualizar-poliza.component";
import { RegistroPolizaComponent } from "./registro-poliza/registro-poliza.component";

const routes: Routes = [
  {
    path: 'consultar',
    canActivate: [authGuard],
    component: VisualizarPolizaComponent,
  },
  {
    path: 'listado',
    canActivate: [authGuard],
    component: VisualizarPolizaComponent,
  },
  {
    path: 'registrar',
    canActivate: [authGuard],
    component: RegistroPolizaComponent,
  },
]

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PolizasRoutingModule { }