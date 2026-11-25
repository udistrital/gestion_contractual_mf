import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegistroContratoComponent } from './registro-contrato/registro-contrato.component';
import { ConsultaContratoComponent } from './consulta-contrato/consulta-contrato.component';
import { RevisionContratoComponent } from './revision-contrato/revision-contrato.component';
import { EditarContratoComponent } from './consulta-contrato/editar-contrato/editar-contrato.component';
import { DetalleContratoComponent } from './consulta-contrato/detalle-contrato/detalle-contrato.component';

const CONTRATOS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'consultar',
  },
  {
    path: 'consultar',
    component: ConsultaContratoComponent,
  },
  {
    path: 'registrar',
    component: RegistroContratoComponent,
  },
  {
    path: 'editar/:contratoId',
    component: EditarContratoComponent,
  },
  {
    path: 'documentos/:contratoId',
    component: RevisionContratoComponent,
  },
  {
    path: 'detalle/:contratoId',
    component: DetalleContratoComponent,
  },
]

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(CONTRATOS_ROUTES)],
  exports: [RouterModule]
})
export class ContratosRoutingModule { }
