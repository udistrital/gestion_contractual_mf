import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { authGuard } from 'src/_guards/auth.guard';

const routes: Routes = [
  {
    path: 'contratos',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/contratos/contratos.module').then(m => m.ContratosModule)
  },
  {
    path: 'polizas',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/polizas/polizas.module').then(m => m.PolizasModule)
  },
  {
    path: 'actas',
    canActivate: [authGuard],
    loadChildren: () => import('./modules/registro-actas/registro-actas.module').then(m => m.RegistroActasModule)
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
  ],
})
export class AppRoutingModule {}
