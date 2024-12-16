import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';

@Component({
  selector: 'app-modal-observaciones',
  templateUrl: './modal-observaciones.component.html',
  styleUrls: ['./modal-observaciones.component.css'],
})
export class ModalObservacionesComponent implements OnInit {
  estados: any;
  isLoading: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dataModal: any,
    public dialogRef: MatDialogRef<ModalObservacionesComponent>,
    public dialog: MatDialog,
    private alertService: AlertService,
    private contratoMidService: ContratoGeneralMidService
  ) {}

  ngOnInit() {
    this.getEstados();
  }

  private handleError(message: string, error: any, callback?: () => void) {
    console.error(message, error);
    this.alertService.showErrorAlert(message);
    if (callback) callback();
  }

  getEstados() {
    this.isLoading = true;
    this.contratoMidService.getEstados(this.dataModal.idContrato).subscribe({
      next: (response) => {
        if (
          response.Success &&
          response.Status === 200 &&
          response.Data.length >= 0
        ) {
          this.estados = response.Data;
        }
      },
      error: async (error) =>
        this.handleError('Error al consultar estados:', error),
      complete: () => (this.isLoading = false),
    });
  }

  obtenerIniciales(nombre: string): string {
    const palabras: string[] = nombre.trim().split(/\s+/);
    return palabras
      .slice(0, 2)
      .map((palabra) => palabra[0].toUpperCase())
      .join('');
  }
}
