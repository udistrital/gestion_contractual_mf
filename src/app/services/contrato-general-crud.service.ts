import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';
import {
  CDPContratoCRUD,
  ConsultaCrud,
  EstadoContrato,
  OrdenadorContratoData,
  SupervisorToSave,
} from '../types/types';

/**
 * Ruta de una consulta de lista del CRUD Beego v2:
 * v1/<recurso>/?query=campo:valor,...&sortby=...&order=...&limit=...
 * El filtro (query) lo arma el componente que consume el service.
 */
export function rutaConsulta(recurso: string, consulta: ConsultaCrud): string {
  const parametros = [`query=${consulta.query}`];
  if (consulta.sortby) parametros.push(`sortby=${consulta.sortby}`);
  if (consulta.order) parametros.push(`order=${consulta.order}`);
  parametros.push(`limit=${consulta.limit}`);
  return `v1/${recurso}/?${parametros.join('&')}`;
}

@Injectable({
  providedIn: 'root',
})
export class ContratoGeneralCrudService {
  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
  }

  // contrato_general: también guarda el contratista (proveedor_*), el
  // solicitante (sede/dependencia_solicitante_id) y el tipo_control_id.

  get(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`v1/contrato_general/${idContrato}`);
  }

  post(contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(
      'v1/contrato_general/',
      contrato_general_parcial
    );
  }

  /** PUT parcial: solo se envían los campos que cambian. */
  put(id_contrato: number, contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put(
      `v1/contrato_general/${id_contrato}`,
      contrato_general_parcial
    );
  }

  // disponibilidad_presupuestal

  getCdps(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(
      rutaConsulta('disponibilidad_presupuestal', consulta)
    );
  }

  postCdp(cdpData: CDPContratoCRUD): Observable<any> {
    if (!cdpData.contrato_general_id?.id) {
      throw new Error(
        'No se ha especificado el contrato general asociado al CDP'
      );
    }
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('v1/disponibilidad_presupuestal/', cdpData);
  }

  deleteCdp(id: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.delete('v1/disponibilidad_presupuestal', id);
  }

  // estado_contrato: el POST marca el nuevo estado como actual.

  getEstados(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(rutaConsulta('estado_contrato', consulta));
  }

  postEstadoContrato(estado: EstadoContrato): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('v1/estado_contrato/', estado);
  }

  // especificacion_tecnica

  getEspecificacionesTecnicas(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(
      rutaConsulta('especificacion_tecnica', consulta)
    );
  }

  postEspecificacionTecnica(especificacion: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(
      'v1/especificacion_tecnica/',
      especificacion
    );
  }

  putEspecificacionTecnica(id: number, especificacion: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put(
      `v1/especificacion_tecnica/${id}`,
      especificacion
    );
  }

  deleteEspecificacionTecnica(id: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.delete('v1/especificacion_tecnica', id);
  }

  // ordenador_contrato: un solo ordenador activo por contrato (el paso
  // presupuestal actualiza el existente o crea uno nuevo).

  getOrdenadores(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(rutaConsulta('ordenador_contrato', consulta));
  }

  postOrdenadorContrato(ordenador: OrdenadorContratoData): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('v1/ordenador_contrato/', ordenador);
  }

  putOrdenadorContrato(id: number, ordenador: OrdenadorContratoData): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put(`v1/ordenador_contrato/${id}`, ordenador as any);
  }

  // supervisor_contrato

  getSupervisores(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(rutaConsulta('supervisor_contrato', consulta));
  }

  postSupervisor(data: SupervisorToSave): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('v1/supervisor_contrato/', data);
  }

  putSupervisor(id: number, data: SupervisorToSave): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put(`v1/supervisor_contrato/${id}`, data as any);
  }

  /**
   * Pendiente: el CRUD Beego no tiene la consulta por año y sus consumidores
   * (pólizas y actas) están fuera de la #390. Se deja la ruta anterior.
   */
  getContratosPorVigencia(year: string | null): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`contratos-generales/vigencia/${year}`);
  }
}
