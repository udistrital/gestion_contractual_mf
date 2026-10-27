import { Component, computed, input } from '@angular/core';
import {
  AlertaContrato,
  ContratoTablero,
  ESTADOS_TABLERO,
  EstadoClave,
  GrupoContratos,
  RolTablero,
} from '../../../types/tablero.models';
import { agruparPor, contarPorEstado } from '../../../utils/tablero.utils';

const SIN_ABOGADO = 'sin-abogado';

export interface FilaCargaPropia {
  clave: EstadoClave;
  nombre: string;
  mios: number;
  promedio: number;
  anchoMios: number;
  posicionPromedio: number;
}

@Component({
  selector: 'app-carga-abogados',
  templateUrl: './carga-abogados.component.html',
  styleUrls: ['../tablero-tokens.css', './carga-abogados.component.css'],
  standalone: false,
})
export class CargaAbogadosComponent {
  readonly contratos = input.required<ContratoTablero[]>();
  readonly alertas = input<AlertaContrato[]>([]);
  readonly rol = input.required<RolTablero>();
  readonly abogadoId = input<number | null>(null);

  readonly estados = ESTADOS_TABLERO;

  // Vista jefe: una barra apilada por abogado
  readonly filas = computed<Array<GrupoContratos & { pendientes: number; alertas: number }>>(() => {
    const alertasPorAbogado = new Map<string, number>();
    this.alertas().forEach((a) => {
      const k = this.claveAbogado(a.contrato);
      alertasPorAbogado.set(k, (alertasPorAbogado.get(k) ?? 0) + 1);
    });
    return agruparPor(this.contratos(), (c) => this.claveAbogado(c), (c) => c.abogado).map((g) => ({
      ...g,
      pendientes: g.porSuscribir + g.suscrito + g.legalizado,
      alertas: alertasPorAbogado.get(g.clave) ?? 0,
    }));
  });

  readonly maximo = computed(() => Math.max(1, ...this.filas().map((f) => f.total)));

  // Vista abogado: mis contratos frente al promedio por abogado de la oficina
  readonly cargaPropia = computed<FilaCargaPropia[]>(() => {
    const id = this.abogadoId();
    const identificados = this.contratos().filter((c) => c.abogadoId !== null);
    const abogados = new Set(identificados.map((c) => c.abogadoId)).size || 1;
    const mios = contarPorEstado(identificados.filter((c) => c.abogadoId === id));
    const oficina = contarPorEstado(identificados);
    const max = Math.max(
      1,
      ...this.estados.map((e) => Math.max(mios[e.clave], oficina[e.clave] / abogados))
    );
    return this.estados.map((e) => {
      const promedio = oficina[e.clave] / abogados;
      return {
        clave: e.clave,
        nombre: e.nombre,
        mios: mios[e.clave],
        promedio: Math.round(promedio),
        anchoMios: (mios[e.clave] / max) * 100,
        posicionPromedio: (promedio / max) * 100,
      };
    });
  });

  iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  private claveAbogado(c: ContratoTablero): string {
    return c.abogadoId === null ? SIN_ABOGADO : String(c.abogadoId);
  }
}
