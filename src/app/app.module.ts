import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ParametrosService } from './services/parametros.service';
import { RequestManager } from './managers/requestManager';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { FileService } from './services/file.service';
import { UbicacionService } from './services/ubicacion.service';
import { GestorDocumentalService } from './services/gestor-documental.service';
import { OrdenadoresSupervisoresContratacionMidService } from './services/ordenadores-supervisores-contratacion-mid.service';
import { PolizasModule } from './modules/polizas/polizas.module';
import { SpinnerIntercerptor } from './core/intercerptors/spinner.interceptor';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { RegistroActasModule } from './modules/registro-actas/registro-actas.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    AppRoutingModule,
    SharedModule,
    BrowserModule,
    ContratosModule,
    RegistroActasModule,
    PolizasModule,
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
