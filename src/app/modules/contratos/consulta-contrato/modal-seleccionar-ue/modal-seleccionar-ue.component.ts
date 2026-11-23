import { Component, OnInit, Optional, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ParametrosService } from 'src/app/services/parametros.service';
import {
  MENSAJE_SIN_UNIDAD_PERMITIDA,
  UnidadesPermitidasService,
} from 'src/app/services/unidades-permitidas.service';
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
  private readonly descripcionesPorDefecto: Record<number, { codigo: string; descripcion: string }> = {
    [environment.UNIDADES_EJECUTORAS.RECTORIA]: {
      codigo: '01',
      descripcion: 'Trámites generales, convenios y contratos transversales institucionales.',
    },
    [environment.UNIDADES_EJECUTORAS.IDEXUD]: {
      codigo: '02',
      descripcion: 'Contratos de extensión, proyectos especiales y consultorías externas.',
    },
  };

  /** Catálogo de respaldo si Parámetros no responde. */
  private readonly unidadesBase: UnidadEjecutoraOption[] = [
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

  /** Solo las unidades en las que el usuario puede registrar (UnidadesPermitidasService). */
  unidades: UnidadEjecutoraOption[] = [];
  selectedUe: UnidadEjecutoraOption | null = null;
  cargando = true;
  sinUnidadPermitida = false;
  readonly mensajeSinUnidad = MENSAJE_SIN_UNIDAD_PERMITIDA;

  private readonly unidadesPermitidas = inject(UnidadesPermitidasService);

  constructor(
    public dialogRef: MatDialogRef<ModalSeleccionarUeComponent>,
    @Optional() private parametrosService?: ParametrosService
  ) {}

  async ngOnInit(): Promise<void> {
    const catalogo = await this.cargarCatalogo();
    this.unidades = await this.unidadesPermitidas.filtrar(catalogo, (ue) => ue.id);
    this.selectedUe =
      this.unidades.find((u) => u.id === this.selectedUe?.id) ||
      this.unidades[0] ||
      null;
    this.sinUnidadPermitida = this.unidades.length === 0;
    this.cargando = false;
  }

  /** Unidades de Parámetros; si la consulta falla o viene vacía, las de respaldo. */
  private async cargarCatalogo(): Promise<UnidadEjecutoraOption[]> {
    if (!this.parametrosService?.getParametrosPorTipo) {
      return this.unidadesBase;
    }

    try {
      const data = await this.parametrosService.getParametrosPorTipo([
        environment.UNIDAD_EJECUTORA_ID,
      ]);
      const parametrosUe: ParametroResponse[] =
        data?.[environment.UNIDAD_EJECUTORA_ID] || [];

      if (Array.isArray(parametrosUe) && parametrosUe.length > 0) {
        return parametrosUe.map((param, idx) => {
          const id = Number(param.Id);
          const base = this.descripcionesPorDefecto[id];
          const codigo =
            param.CodigoAbreviacion ||
            base?.codigo ||
            String(idx + 1).padStart(2, '0');
          const descripcion =
            param.Descripcion && param.Descripcion !== param.Nombre
              ? param.Descripcion
              : base?.descripcion ||
                'Unidad ejecutora habilitada para trámites contractuales.';

          return {
            id,
            codigo,
            nombre: param.Nombre || `Unidad Ejecutora ${codigo}`,
            descripcion,
          };
        });
      }
    } catch {
      // Mantiene las unidades base por defecto si falla la consulta de parámetros
    }
    return this.unidadesBase;
  }

  seleccionar(ue: UnidadEjecutoraOption): void {
    this.selectedUe = ue;
  }

  confirmar(): void {
    if (!this.selectedUe) return;
    this.dialogRef.close(this.selectedUe);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
