import { Component, Input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import {CommonModule, NgSwitch} from "@angular/common";

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
  template: `
    <mat-accordion>
      <mat-expansion-panel *ngFor="let cdp of cdpData">
        <mat-expansion-panel-header>
          <mat-panel-title>
            Número de Disponibilidad: {{ cdp.numero_disponibilidad }}
          </mat-panel-title>
        </mat-expansion-panel-header>
        <ng-container [ngSwitch]="tipo">
          <div *ngSwitchCase="'justificacion'" class="cdp-content">{{ cdp.justificacion }}</div>
          <div *ngSwitchCase="'descripcion'" class="cdp-content">{{ cdp.descripcion }}</div>
          <div *ngSwitchCase="'observaciones'" class="cdp-content">{{ cdp.observaciones }}</div>
        </ng-container>
      </mat-expansion-panel>
    </mat-accordion>
  `,
  styles: [`
    .cdp-content {
      white-space: pre-wrap;
      padding: 10px 0;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatExpansionModule, NgSwitch]
})
export class CDPListComponent {
  @Input() cdpData: CDP[] = [];
  @Input() tipo: 'justificacion' | 'descripcion' | 'observaciones' = 'justificacion';
}
