import { Component, OnInit, Optional } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ParametrosService } from 'src/app/services/parametros.service';
import { ParametroResponse } from 'src/app/types/types';
import { environment } from 'src/environments/environment';

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
export class ModalSeleccionarUeComponent implements OnInit {
  unidades: UnidadEjecutoraOption[] = [
    {
      id: environment.UNIDADES_EJECUTORAS.RECTORIA,
      codigo: '01',
      nombre: 'Rectoría',
      descripcion: 'Trámites generales, convenios y contratos transversales institucionales.'
    },
    {
      id: environment.UNIDADES_EJECUTORAS.IDEXUD,
      codigo: '02',
      nombre: 'IDEXUD',
      descripcion: 'Contratos de extensión, proyectos especiales y consultorías externas.'
    }
  ];

  selectedUe: UnidadEjecutoraOption = this.unidades[0];

  constructor(
    public dialogRef: MatDialogRef<ModalSeleccionarUeComponent>,
    @Optional() private parametrosService?: ParametrosService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.parametrosService?.getParametrosPorTipo) {
      return;
    }

    try {
      const data = await this.parametrosService.getParametrosPorTipo([
        environment.UNIDAD_EJECUTORA_ID,
      ]);
      const parametrosUe: ParametroResponse[] =
        data?.[environment.UNIDAD_EJECUTORA_ID] || [];

      if (Array.isArray(parametrosUe) && parametrosUe.length > 0) {
        this.unidades = this.unidades.map((ue) => {
          const encontrado = parametrosUe.find((p) => Number(p.Id) === ue.id);
          return encontrado?.Nombre
            ? { ...ue, nombre: encontrado.Nombre }
            : ue;
        });
        this.selectedUe =
          this.unidades.find((u) => u.id === this.selectedUe.id) ||
          this.unidades[0];
      }
    } catch {
      // Mantiene los nombres base por defecto si falla la consulta de parámetros
    }
  }

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
