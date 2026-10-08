import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { authGuard } from "src/_guards/auth.guard";
import { RegistroActasComponent } from "./registro-actas.component";

const routes: Routes = [
  {
    path: 'registrar',
    canActivate: [authGuard],
    component: RegistroActasComponent,
  },
]

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistroActasRoutingModule { }