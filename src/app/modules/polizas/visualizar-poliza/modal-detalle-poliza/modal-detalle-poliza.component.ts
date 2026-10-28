import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PolizasService } from '../../../../services/polizas.service';
import { AlertService } from '../../../../services/alert.service';
import {
  abrirVentanaPdf,
  mostrarPdfEnVentana,
} from '../../../../utils/visor-pdf';

@Component({
  selector: 'app-modal-detalle-poliza',
  templateUrl: './modal-detalle-poliza.component.html',
  styleUrls: ['./modal-detalle-poliza.component.css'],
  standalone: false,
})
export class ModalDetallePolizaComponent implements OnInit {
  isLoading = false;
  generandoActa = false;
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
    private polizasService: PolizasService,
    private alertService: AlertService
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

  /**
   * Muestra el acta de aprobación guardada en el gestor documental, en una
   * ventana nueva con el visor nativo del navegador.
   */
  verActaAprobacion(): void {
    const ventana = abrirVentanaPdf('Acta de aprobación de póliza');
    if (!ventana) {
      this.alertService.showErrorAlert(
        'El navegador bloqueó la ventana emergente. Permítala e intente de nuevo.'
      );
      return;
    }

    this.generandoActa = true;
    const contratoId = Number(this.dataModal.contratoId);
    const fallo = (mensaje: string) => {
      this.generandoActa = false;
      ventana.close();
      this.alertService.showErrorAlert(mensaje);
    };

    this.polizasService.getActaGuardada(contratoId).subscribe({
      next: (response: any) => {
        const documento = (response?.Data as any[])?.[0];
        if (!documento?.documento_enlace) {
          fallo('Esta póliza aún no tiene un acta de aprobación guardada.');
          return;
        }
        this.polizasService
          .getDocumentoGestor(documento.documento_enlace)
          .subscribe({
            next: (doc: any) => {
              if (!doc?.file) {
                fallo('No fue posible obtener el acta del gestor documental.');
                return;
              }
              this.generandoActa = false;
              mostrarPdfEnVentana(ventana, doc.file);
            },
            error: () =>
              fallo('Error al consultar el acta en el gestor documental.'),
          });
      },
      error: () => fallo('Error al consultar el acta de la póliza.'),
    });
  }
}
