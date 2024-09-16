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
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConsultaContratoModule } from './modules/consulta-contrato/consulta-contrato.module';
import {FileService} from "./services/FileService";
import { UbicacionService } from './services/ubicacion.service';
import {DocumentosService} from "./services/documentos.service";

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    RegistroContratoModule,
    ConsultaContratoModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CommonModule,
    MatIconModule,
    HttpClientModule,
    MatSnackBarModule
  ],
  providers: [
    ParametrosService,
    UbicacionService,
    RequestManager,
    FileService,
    DocumentosService,
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
