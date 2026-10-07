import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PolizasService } from '../../../../services/polizas.service';

@Component({
  selector: 'app-modal-detalle-poliza',
  templateUrl: './modal-detalle-poliza.component.html',
  styleUrls: ['./modal-detalle-poliza.component.css'],
  standalone: false,
})
export class ModalDetallePolizaComponent implements OnInit {
  isLoading = false;
  poliza: any = null;
  amparos: any[] = [];
  displayedColumns: string[] = [
    'amparo',
    'tipo_valor_amparo',
    'suficiencia',
    'valor',
    'fecha_inicio',
    'fecha_fin',
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public dataModal: { contratoId: string },
    private polizasService: PolizasService
  ) {}

  ngOnInit(): void {
    this.cargarDetalle();
  }

  private cargarDetalle(): void {
    this.isLoading = true;
    const contratoId = Number(this.dataModal.contratoId);

    forkJoin({
      poliza: this.polizasService.getPolizaPorContrato(contratoId).pipe(
        map((response: any) => (response?.Data as any[])?.[0] || null),
        catchError(() => of(null))
      ),
      amparos: this.polizasService.getAmparosContratoMid(contratoId).pipe(
        map((response: any) => (response?.Data as any[]) || []),
        catchError(() => of([] as any[]))
      ),
    }).subscribe(({ poliza, amparos }) => {
      this.poliza = poliza;
      this.amparos = amparos;
      this.isLoading = false;
    });
  }
}
