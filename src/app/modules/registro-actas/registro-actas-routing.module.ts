import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { RegistroActasComponent } from "./registro-actas.component";

const routes: Routes = [
  {
    path: 'registrar',
    component: RegistroActasComponent,
  },
]

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistroActasRoutingModule { }