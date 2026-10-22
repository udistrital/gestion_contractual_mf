import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ResumenEstadosComponent } from './resumen-estados/resumen-estados.component';
import { AlertasGestionComponent } from './alertas-gestion/alertas-gestion.component';
import { TreemapDependenciasComponent } from './treemap-dependencias/treemap-dependencias.component';
import { CargaAbogadosComponent } from './carga-abogados/carga-abogados.component';
import { PanelConsultaComponent } from './panel-consulta/panel-consulta.component';
import { InicioTableroComponent } from './inicio-tablero/inicio-tablero.component';
import { SemaforoGestionComponent } from './semaforo-gestion/semaforo-gestion.component';

const componentes = [
  ResumenEstadosComponent,
  AlertasGestionComponent,
  TreemapDependenciasComponent,
  CargaAbogadosComponent,
  PanelConsultaComponent,
  InicioTableroComponent,
  SemaforoGestionComponent,
];

@NgModule({
  declarations: componentes,
  imports: [SharedModule],
  exports: componentes,
})
export class TableroModule {}

