import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { RolService } from './rol.service';

/**
 * Unidad ejecutora que corresponde a cada sufijo de rol.
 *
 * Regla provisional (#415): la pertenencia del usuario a una unidad se deduce
 * del sufijo de su rol (_RECTOR → Rectoría, _IDEXUD → IDEXUD). Se aplica igual
 * a abogados y a jefes de contratación; la regla del jefe está pendiente de
 * definir con el analista. Si la pertenencia pasa a consultarse en un servicio
 * (vinculación), solo cambia este archivo.
 */
const UNIDAD_POR_SUFIJO_ROL: ReadonlyArray<{ sufijo: string; unidadId: number }> = [
  { sufijo: '_RECTOR', unidadId: environment.UNIDADES_EJECUTORAS.RECTORIA },
  { sufijo: '_IDEXUD', unidadId: environment.UNIDADES_EJECUTORAS.IDEXUD },
];

export const MENSAJE_SIN_UNIDAD_PERMITIDA =
  'Su usuario no tiene una unidad ejecutora autorizada para registrar contratos. ' +
  'Solicite la asignación al administrador del sistema.';

/** Único punto que decide en qué unidades ejecutoras puede registrar el usuario. */
@Injectable({
  providedIn: 'root',
})
export class UnidadesPermitidasService {
  private readonly rolService = inject(RolService);

  /** Ids de Parámetros de las unidades permitidas, sin repetir. */
  async obtenerIds(): Promise<number[]> {
    const roles = this.rolService.getRol() ?? [];
    return UNIDAD_POR_SUFIJO_ROL.filter(({ sufijo }) =>
      roles.some((rol) => rol.endsWith(sufijo))
    ).map(({ unidadId }) => unidadId);
  }

  /** Deja del catálogo solo las unidades permitidas, en el orden del catálogo. */
  async filtrar<T>(catalogo: T[], idDe: (item: T) => number): Promise<T[]> {
    const permitidas = new Set(await this.obtenerIds());
    return catalogo.filter((item) => permitidas.has(Number(idDe(item))));
  }
}
