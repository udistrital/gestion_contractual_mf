import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContratoGeneral } from 'src/app/types/types';

export interface ModalEnviarAprobacionData {
  contrato: ContratoGeneral;
}

export interface ModalEnviarAprobacionResultado {
  confirmado: boolean;
  observacion?: string;
}

@Component({
  selector: 'app-modal-enviar-aprobacion',
  templateUrl: './modal-enviar-aprobacion.component.html',
  styleUrls: ['./modal-enviar-aprobacion.component.css'],
  standalone: false,
})
export class ModalEnviarAprobacionComponent {
  observacion: string = '';

  constructor(
    public dialogRef: MatDialogRef<ModalEnviarAprobacionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModalEnviarAprobacionData
  ) {}

  get numeroContrato(): string {
    const c = this.data?.contrato;
    return c?.numero_contrato || c?.consecutivo_elaboracion || (c?.id ? `ID #${c.id}` : 'Sin número');
  }

  get nombreContratista(): string {
    const c = this.data?.contrato?.contratista;
    if (!c) return 'No registrado';
    if (c.nombre_completo) return c.nombre_completo;
    if (c.razon_social) return c.razon_social;
    if (c.NombreCompleto) return c.NombreCompleto;
    if (c.PrimerNombre) {
      return `${c.PrimerNombre || ''} ${c.SegundoNombre || ''} ${c.PrimerApellido || ''} ${c.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim();
    }
    return 'Contratista asignado';
  }

  get valorContrato(): string {
    const val = this.data?.contrato?.valor_pesos;
    if (val === undefined || val === null) return '$ 0';
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(Number(val));
    } catch {
      return `$ ${val.toLocaleString('es-CO')}`;
    }
  }

  cancelar(): void {
    this.dialogRef.close({ confirmado: false });
  }

  confirmar(): void {
    this.dialogRef.close({
      confirmado: true,
      observacion: this.observacion.trim(),
    });
  }
}
