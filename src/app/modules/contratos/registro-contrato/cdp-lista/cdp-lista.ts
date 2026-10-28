import { Component, Input } from '@angular/core';

interface CDP {
  vigencia: string;
  descripcion: string;
  rubro_interno: string;
  estado: string;
  justificacion: string;
  id_sol_cdp: string;
  nombre_dependencia: string;
  fecha_registro: string;
  observaciones: string;
  numero_disponibilidad: string;
  num_sol_adq: string;
  valor_contratacion: string;
  estadocdp: string;
}

@Component({
    selector: 'app-cdp-list',
    templateUrl: `./cdp-lista.html`,
    styles: [`
    .cdp-content {
      white-space: pre-wrap;
      padding: 10px 0;
    }
  `],
  standalone: false,
})
export class CDPListComponent {
  @Input() cdpData: CDP[] = [];
  @Input() tipo: 'justificacion' | 'descripcion' | 'observaciones' = 'justificacion';
}
