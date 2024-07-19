import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ParametrosService } from './services/parametros.service';
import { RequestManager } from './managers/requestManager';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    ParametrosService,
    RequestManager,
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }