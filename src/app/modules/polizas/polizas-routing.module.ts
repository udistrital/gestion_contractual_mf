import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { VisualizarPolizaComponent } from "./visualizar-poliza/visualizar-poliza.component";
import { RegistroPolizaComponent } from "./registro-poliza/registro-poliza.component";

const routes: Routes = [
  {
    path: 'consultar',
    component: VisualizarPolizaComponent,
  },
  {
    path: 'listado',
    component: VisualizarPolizaComponent,
  },
  {
    path: 'registrar',
    component: RegistroPolizaComponent,
  },
]

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PolizasRoutingModule { }