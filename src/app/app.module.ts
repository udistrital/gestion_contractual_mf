import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { ParametrosService } from './services/parametros.service';
import { RequestManager } from './managers/requestManager';
import { RegistroContratoModule } from './modules/registro-contrato/registro-contrato.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import {
  HttpClientModule,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConsultaContratoModule } from './modules/consulta-contrato/consulta-contrato.module';
import { FileService } from './services/file.service';
import { UbicacionService } from './services/ubicacion.service';
import { GestorDocumentalService } from './services/gestor-documental.service';
import { QuillModule } from 'ngx-quill';
import { OrdenadoresSupervisoresContratacionMidService } from './services/ordenadores-supervisores-contratacion-mid.service';
import { RevisionContratoModule } from './modules/revision-contrato/revision-contrato.module';
import { SpinnerIntercerptor } from './core/intercerptors/spinner.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    ConsultaContratoModule,
    HttpClientModule,
    MatIconModule,
    MatSnackBarModule,
    RegistroContratoModule,
    RevisionContratoModule,
    QuillModule.forRoot(),
  ],
  providers: [
    ParametrosService,
    UbicacionService,
    RequestManager,
    FileService,
    GestorDocumentalService,
    OrdenadoresSupervisoresContratacionMidService,
    provideHttpClient(withInterceptors([SpinnerIntercerptor])),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
