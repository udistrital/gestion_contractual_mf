import { Component, OnInit, afterNextRender } from '@angular/core';
import { RolService } from './services/rol.service';
import { HuellaNavegadorService } from './core/services/huella-navegador/huella-navegador.service';

@Component({
    selector: 'argo-gestion-contractual-mf',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent implements OnInit {
  title = 'argo-gestion-contractual-mf';

  constructor(
    private rolService: RolService,
    private huellaNavegador: HuellaNavegadorService,
  ) {
    // Después del primer render para no retrasar el bootstrap del MF.
    afterNextRender(() => this.huellaNavegador.iniciar());
  }

  ngOnInit(): void {
    this.rolService.cargarRol();
  }
}
