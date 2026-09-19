import { enableProdMode, NgZone, provideZoneChangeDetection } from '@angular/core';

import { platformBrowser } from '@angular/platform-browser';
import { Router, NavigationStart } from '@angular/router';

import { singleSpaAngular, provideSingleSpaPlatform } from 'single-spa-angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';

if (environment.production) {
  enableProdMode();
}

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    return platformBrowser(provideSingleSpaPlatform()).bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()], });
  },
  template: '<argo-gestion-contractual-mf />',
  Router,
  NavigationStart,
  NgZone,
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
