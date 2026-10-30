import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ContratoGeneral } from 'src/app/types/types';

export interface ModalRechazoMasivoData {
  contratos: ContratoGeneral[];
}

export interface ModalRechazoMasivoResultado {
  confirmado: boolean;
  tipoObservacion?: 'general' | 'individual';
  motivoGeneral?: string;
  motivosPorContrato?: Record<number, string>;
  motivo?: string;
}

@Component({
  selector: 'app-modal-rechazo-masivo',
  templateUrl: './modal-rechazo-masivo.component.html',
  styleUrls: ['./modal-rechazo-masivo.component.css'],
  standalone: false,
})
export class ModalRechazoMasivoComponent implements OnInit {
  tipoObservacion: 'general' | 'individual' = 'general';
  motivoGeneral: string = '';
  motivosPorContrato: Record<number, string> = {};

  constructor(
    public dialogRef: MatDialogRef<ModalRechazoMasivoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModalRechazoMasivoData
  ) {}

  ngOnInit(): void {
    this.contratos.forEach((c) => {
      if (c.id) {
        this.motivosPorContrato[c.id] = '';
      }
    });
  }

  get motivoRechazo(): string {
    return this.motivoGeneral;
  }

  set motivoRechazo(val: string) {
    this.motivoGeneral = val;
  }

  get contratos(): ContratoGeneral[] {
    return this.data?.contratos || [];
  }

  get totalContratos(): number {
    return this.contratos.length;
  }

  get esValido(): boolean {
    if (this.tipoObservacion === 'general') {
      return this.motivoGeneral.trim().length > 0;
    }
    return (
      this.contratos.length > 0 &&
      this.contratos.every((c) => {
        if (!c.id) return true;
        const m = this.motivosPorContrato[c.id];
        return m !== undefined && m.trim().length > 0;
      })
    );
  }

  getMotivoContrato(c: ContratoGeneral): string {
    return c.id ? this.motivosPorContrato[c.id] || '' : '';
  }

  setMotivoContrato(c: ContratoGeneral, val: string): void {
    if (c.id) {
      this.motivosPorContrato[c.id] = val;
    }
  }

  cambiarTipo(tipo: 'general' | 'individual'): void {
    this.tipoObservacion = tipo;
    if (tipo === 'individual' && this.motivoGeneral.trim()) {
      this.contratos.forEach((c) => {
        if (c.id && !this.motivosPorContrato[c.id]?.trim()) {
          this.motivosPorContrato[c.id] = this.motivoGeneral.trim();
        }
      });
    }
  }

  copiarGeneralAIndividuales(): void {
    if (!this.motivoGeneral.trim()) return;
    this.contratos.forEach((c) => {
      if (c.id) {
        this.motivosPorContrato[c.id] = this.motivoGeneral.trim();
      }
    });
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
    if (!this.esValido) return;
    this.dialogRef.close({
      confirmado: true,
      tipoObservacion: this.tipoObservacion,
      motivoGeneral: this.motivoGeneral.trim(),
      motivo: this.motivoGeneral.trim(),
      motivosPorContrato: { ...this.motivosPorContrato },
    });
  }
}

