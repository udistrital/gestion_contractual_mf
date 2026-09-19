import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ParametrosService } from './services/parametros.service';
import { RequestManager } from './managers/requestManager';
import { RegistroContratoModule } from './modules/registro-contrato/registro-contrato.module';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { ConsultaContratoModule } from './modules/consulta-contrato/consulta-contrato.module';
import { FileService } from './services/file.service';
import { UbicacionService } from './services/ubicacion.service';
import { GestorDocumentalService } from './services/gestor-documental.service';
import { OrdenadoresSupervisoresContratacionMidService } from './services/ordenadores-supervisores-contratacion-mid.service';
import { RevisionContratoModule } from './modules/revision-contrato/revision-contrato.module';
import { SpinnerIntercerptor } from './core/intercerptors/spinner.interceptor';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

@NgModule({
  declarations: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserModule,
    ConsultaContratoModule,
    RegistroContratoModule,
    RevisionContratoModule,
  ],
  providers: [
    ParametrosService,
    UbicacionService,
    RequestManager,
    FileService,
    GestorDocumentalService,
    OrdenadoresSupervisoresContratacionMidService,
    provideHttpClient(withInterceptors([SpinnerIntercerptor])),
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: MAT_DATE_FORMATS,
      useValue: {
        parse: { dateInput: 'dd/MM/yyyy' }, 
        display: { dateInput: 'dd/MM/yyyy' } 
      }
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
