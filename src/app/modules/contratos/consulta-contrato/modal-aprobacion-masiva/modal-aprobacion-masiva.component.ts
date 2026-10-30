import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContratoGeneral } from 'src/app/types/types';

export interface ModalAprobacionMasivaData {
  contratos: ContratoGeneral[];
}

export interface ModalAprobacionMasivaResultado {
  confirmado: boolean;
  observacion?: string;
}

@Component({
  selector: 'app-modal-aprobacion-masiva',
  templateUrl: './modal-aprobacion-masiva.component.html',
  styleUrls: ['./modal-aprobacion-masiva.component.css'],
  standalone: false,
})
export class ModalAprobacionMasivaComponent {
  observacion: string = '';

  constructor(
    public dialogRef: MatDialogRef<ModalAprobacionMasivaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModalAprobacionMasivaData
  ) {}

  get contratos(): ContratoGeneral[] {
    return this.data?.contratos || [];
  }

  get totalContratos(): number {
    return this.contratos.length;
  }

  get valorTotalLote(): number {
    return this.contratos.reduce((acc, c) => acc + (Number(c.valor_pesos) || 0), 0);
  }

  get valorTotalFormateado(): string {
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(this.valorTotalLote);
    } catch {
      return `$ ${this.valorTotalLote.toLocaleString('es-CO')}`;
    }
  }

  formatearValor(val: any): string {
    const num = Number(val) || 0;
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(num);
    } catch {
      return `$ ${num.toLocaleString('es-CO')}`;
    }
  }

  getNumeroContrato(c: ContratoGeneral): string {
    return c.numero_contrato || c.consecutivo_elaboracion || (c.id ? `ID #${c.id}` : 'S/N');
  }

  getNombreContratista(c: ContratoGeneral): string {
    const cont = c.contratista;
    if (!cont) return 'No registrado';
    if (cont.nombre_completo) return cont.nombre_completo;
    if (cont.razon_social) return cont.razon_social;
    if (cont.NombreCompleto) return cont.NombreCompleto;
    if (cont.PrimerNombre) {
      return `${cont.PrimerNombre || ''} ${cont.SegundoNombre || ''} ${cont.PrimerApellido || ''} ${cont.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim();
    }
    return 'Contratista asignado';
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
