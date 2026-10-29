import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestManager } from 'src/app/managers/requestManager';
import { ApiResponse } from 'src/app/types/types';

/**
 * Adaptador único hacia el CRUD de gestión contractual en Go/Beego v2
 * (udistrital/argo_documentacion#385). Concentra:
 *
 * - las rutas `/v1/<recurso>/` y los filtros `query=Campo:valor`;
 * - la normalización de lo que hoy responde el CRUD: lista vacía `[{}]`,
 *   `Status` como texto, fechas `0001-01-01T00:00:00Z` y relaciones o ids en 0
 *   en lugar de null;
 * - el paso de snake_case (MF) a PascalCase (Beego) y de las relaciones a `{"Id": n}`.
 *
 * Cuando el CRUD corrija la lista vacía, el `Status` y los nulos, basta con
 * retirar `normalizarRespuesta` y `desdeBeego` de este archivo.
 */

/** Prefijo de versión del API del CRUD Beego. */
export const PREFIJO_CRUD_BEEGO = 'v1';

/** Fecha cero con la que el CRUD representa hoy una fecha nula. */
const FECHA_CERO = '0001-01-01T00:00:00Z';

export interface RecursoBeego {
  /** Ruta del recurso en el CRUD (nombre de la tabla). */
  ruta: string;
  /** Campos del MF que en Beego son relaciones y viajan como `{"Id": n}`. */
  relaciones?: string[];
  /** Campos del MF cuyo nombre en Beego no sale de la conversión directa (MF → Beego). */
  alias?: Record<string, string>;
  /** Campos del MF que Beego espera numéricos (el MF a veces los envía como texto). */
  numericos?: string[];
  /** Campos del MF que Beego espera booleanos (el MF a veces los envía como '1'/'0'). */
  booleanos?: string[];
  /** Campos del MF que no existen en Beego y no se envían. */
  excluir?: string[];
}

export type ValorFiltro = string | number | boolean;

export interface OpcionesConsulta {
  sortby?: string[];
  order?: ('asc' | 'desc')[];
  /** 0 trae todos los registros (sin límite el CRUD devuelve 10). */
  limit?: number;
  offset?: number;
}

/** contrato_general_id → ContratoGeneralId */
export function aPascal(nombre: string): string {
  return nombre
    .split('_')
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join('');
}

/** ContratoGeneralId → contrato_general_id */
export function aSnake(nombre: string): string {
  return nombre.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/** Arma el valor de `query`: Campo:valor separados por coma, en el orden recibido. */
export function armarQuery(filtros: Record<string, ValorFiltro>): string {
  return Object.entries(filtros)
    .map(([campo, valor]) => `${campo}:${valor}`)
    .join(',');
}

/** Convierte un objeto del MF al cuerpo que espera Beego. Omite vacíos (el PUT es parcial). */
export function aBeego(datos: Record<string, any>, recurso: RecursoBeego): Record<string, any> {
  const cuerpo: Record<string, any> = {};
  for (const [campo, valor] of Object.entries(datos)) {
    if (campo === 'id' || recurso.excluir?.includes(campo)) continue;
    if (valor === undefined || valor === null || valor === '') continue;
    const nombre = recurso.alias?.[campo] ?? aPascal(campo);
    if (recurso.relaciones?.includes(campo)) {
      cuerpo[nombre] = { Id: Number(valor) };
    } else if (recurso.numericos?.includes(campo)) {
      cuerpo[nombre] = Number(valor);
    } else if (recurso.booleanos?.includes(campo)) {
      cuerpo[nombre] = valor === true || valor === 1 || valor === '1' || valor === 'true';
    } else {
      cuerpo[nombre] = valor;
    }
  }
  return cuerpo;
}

/** Convierte un registro de Beego al formato del MF (snake_case, relaciones como id, nulos). */
export function desdeBeego(registro: Record<string, any>, recurso: RecursoBeego): Record<string, any> {
  const aliasInverso = Object.fromEntries(
    Object.entries(recurso.alias ?? {}).map(([mf, beego]) => [beego, mf])
  );
  const resultado: Record<string, any> = {};
  for (const [campo, valor] of Object.entries(registro)) {
    const nombre = aliasInverso[campo] ?? aSnake(campo);
    if (valor && typeof valor === 'object' && 'Id' in valor) {
      resultado[nombre] = valor.Id || null;
    } else if (valor === FECHA_CERO) {
      resultado[nombre] = null;
    } else if (campo !== 'Id' && campo.endsWith('Id') && valor === 0) {
      resultado[nombre] = null;
    } else {
      resultado[nombre] = valor;
    }
  }
  return resultado;
}

/** Normaliza la respuesta del CRUD: Status numérico, `[{}]` → `[]` y registros al formato del MF. */
export function normalizarRespuesta<T>(respuesta: any, recurso: RecursoBeego): ApiResponse<T> {
  const data = respuesta?.Data;
  let normalizada: any = data ?? null;
  if (Array.isArray(data)) {
    normalizada = data
      .filter((registro) => registro && Object.keys(registro).length > 0)
      .map((registro) => desdeBeego(registro, recurso));
  } else if (data && typeof data === 'object') {
    normalizada = desdeBeego(data, recurso);
  }
  return {
    Success: respuesta?.Success ?? false,
    Status: Number(respuesta?.Status),
    Message: respuesta?.Message ?? '',
    Data: normalizada,
  } as unknown as ApiResponse<T>;
}

@Injectable({
  providedIn: 'root',
})
export class CrudBeegoService {
  private readonly requestManager = inject(RequestManager);

  private ruta(recurso: RecursoBeego, id?: number): string {
    return id === undefined
      ? `${PREFIJO_CRUD_BEEGO}/${recurso.ruta}/`
      : `${PREFIJO_CRUD_BEEGO}/${recurso.ruta}/${id}`;
  }

  /** GET de lista con filtros. Si no se indica, `limit` es 0 (todos los registros). */
  consultar<T>(
    recurso: RecursoBeego,
    filtros: Record<string, ValorFiltro>,
    opciones: OpcionesConsulta = {}
  ): Observable<ApiResponse<T[]>> {
    const parametros = [`query=${armarQuery(filtros)}`];
    if (opciones.sortby?.length) parametros.push(`sortby=${opciones.sortby.join(',')}`);
    if (opciones.order?.length) parametros.push(`order=${opciones.order.join(',')}`);
    parametros.push(`limit=${opciones.limit ?? 0}`);
    if (opciones.offset) parametros.push(`offset=${opciones.offset}`);
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager
      .get(`${this.ruta(recurso)}?${parametros.join('&')}`)
      .pipe(map((respuesta) => normalizarRespuesta<T[]>(respuesta, recurso)));
  }

  obtener<T>(recurso: RecursoBeego, id: number): Observable<ApiResponse<T>> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager
      .get(this.ruta(recurso, id))
      .pipe(map((respuesta) => normalizarRespuesta<T>(respuesta, recurso)));
  }

  crear<T>(recurso: RecursoBeego, datos: Record<string, any>): Observable<ApiResponse<T>> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager
      .post(this.ruta(recurso), aBeego(datos, recurso))
      .pipe(map((respuesta) => normalizarRespuesta<T>(respuesta, recurso)));
  }

  /** PUT parcial: el CRUD conserva los campos que no vienen en el cuerpo. */
  actualizar<T>(recurso: RecursoBeego, id: number, datos: Record<string, any>): Observable<ApiResponse<T>> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    // Sin Id en el cuerpo: RequestManager.put lo agregaría otra vez a la ruta.
    return this.requestManager
      .put(this.ruta(recurso, id), aBeego(datos, recurso) as any)
      .pipe(map((respuesta) => normalizarRespuesta<T>(respuesta, recurso)));
  }

  /** Borrado lógico (activo = false). */
  desactivar<T>(recurso: RecursoBeego, id: number): Observable<ApiResponse<T>> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager
      .delete(`${PREFIJO_CRUD_BEEGO}/${recurso.ruta}`, id)
      .pipe(map((respuesta) => normalizarRespuesta<T>(respuesta, recurso)));
  }
}
