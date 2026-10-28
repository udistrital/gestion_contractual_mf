import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

export interface UnidadEjecutoraOption {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-modal-seleccionar-ue',
  templateUrl: './modal-seleccionar-ue.component.html',
  styleUrls: ['./modal-seleccionar-ue.component.css'],
  standalone: false
})
export class ModalSeleccionarUeComponent {
  unidades: UnidadEjecutoraOption[] = [
    {
      id: 1,
      codigo: '01',
      nombre: '01 - Rectoría (Sede Central)',
      descripcion: 'Trámites generales, convenios y contratos transversales institucionales.'
    },
    {
      id: 2,
      codigo: '02',
      nombre: '02 - IDEXUD (Extensión y Consultoría)',
      descripcion: 'Contratos de extensión, proyectos especiales y consultorías externas.'
    }
  ];

  selectedUe: UnidadEjecutoraOption = this.unidades[0];

  constructor(public dialogRef: MatDialogRef<ModalSeleccionarUeComponent>) {}

  seleccionar(ue: UnidadEjecutoraOption): void {
    this.selectedUe = ue;
  }

  confirmar(): void {
    this.dialogRef.close(this.selectedUe);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
