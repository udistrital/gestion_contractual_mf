import { Component, Inject, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-modal-validar-contratista',
  templateUrl: './modal-validar-contratista.component.html',
  styleUrls: ['./modal-validar-contratista.component.css'],
  standalone: false
})
export class ModalValidarContratistaComponent {
  documentoBusqueda: string = '';
  isLoading: boolean = false;
  datosContratista: any = null;
  contratosOrdenados: any[] = [];
  errorMessage: string = '';
  busquedaRealizada: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ModalValidarContratistaComponent>,
    private proveedoresService: ProveedoresService,
    private alertService: AlertService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: { unidadEjecutora?: any }
  ) {}

  consultarContratista(): void {
    const doc = this.documentoBusqueda ? this.documentoBusqueda.trim() : '';
    if (!doc) {
      this.errorMessage = 'Por favor ingrese un número de documento de identificación.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.datosContratista = null;
    this.contratosOrdenados = [];
    this.busquedaRealizada = true;

    this.proveedoresService.get(`contratistas?id=${doc}`).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.Status === 200 && response.Data) {
          this.datosContratista = response.Data;
          this.procesarContratos(response.Data.contratos);
        } else {
          this.errorMessage = response?.Message || 'No se encontró información del contratista en la base de datos de Ágora / Proveedores.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error de conexión al consultar el contratista en los servicios de Ágora / Proveedores.';
      }
    });
  }

  private procesarContratos(contratos: any): void {
    if (Array.isArray(contratos) && contratos.length > 0) {
      this.contratosOrdenados = [...contratos].sort((a, b) => {
        const vigenciaA = parseInt(a.vigencia, 10) || 0;
        const vigenciaB = parseInt(b.vigencia, 10) || 0;
        if (vigenciaA === vigenciaB) {
          const numA = parseInt(a.numero_contrato, 10) || 0;
          const numB = parseInt(b.numero_contrato, 10) || 0;
          return numB - numA;
        }
        return vigenciaB - vigenciaA;
      });
    } else {
      this.contratosOrdenados = [];
    }
  }

  get tieneCalificacion(): boolean {
    return !!(this.datosContratista?.calificacion || this.datosContratista?.proveedor?.calificacion);
  }

  get valorCalificacion(): string {
    const cal = this.datosContratista?.calificacion || this.datosContratista?.proveedor?.calificacion;
    return cal ? `${cal} / 5.0` : 'Sin calificación actual';
  }

  get fechaActualizacion(): string {
    return (
      this.datosContratista?.proveedor?.fecha_actualizacion ||
      this.datosContratista?.proveedor?.FechaModificacion ||
      this.datosContratista?.proveedor?.FechaCreacion ||
      'No registrada'
    );
  }

  crearContratoConContratista(): void {
    this.dialogRef.close({
      accion: 'crearContrato',
      contratista: this.datosContratista,
      unidadEjecutora: this.data?.unidadEjecutora || null,
    });
  }

  cerrar(): void {
    this.dialogRef.close(null);
  }
}
