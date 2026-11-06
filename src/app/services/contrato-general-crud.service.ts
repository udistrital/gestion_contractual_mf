import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';
import { RECURSOS_CRUD } from '../core/constants/recursos-crud';
import {
  CDPContratoCRUD,
  ConsultaCrud,
  EstadoContrato,
  OrdenadorContratoData,
  SupervisorToSave,
} from '../types/types';

/**
 * Ruta de una consulta de lista del CRUD Beego v2:
 * <recurso>/?query=campo:valor,...&sortby=...&order=...&limit=...
 * El filtro (query) lo arma el componente que consume el service.
 */
export function rutaConsulta(recurso: string, consulta: ConsultaCrud): string {
  const parametros = [`query=${consulta.query}`];
  if (consulta.sortby) parametros.push(`sortby=${consulta.sortby}`);
  if (consulta.order) parametros.push(`order=${consulta.order}`);
  parametros.push(`limit=${consulta.limit}`);
  return `${recurso}/?${parametros.join('&')}`;
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
    return this.requestManager.get(`${RECURSOS_CRUD.contratoGeneral}/${idContrato}`);
  }

  post(contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(
      `${RECURSOS_CRUD.contratoGeneral}/`,
      contrato_general_parcial
    );
  }

  /** PUT parcial: solo se envían los campos que cambian. */
  put(id_contrato: number, contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put(
      `${RECURSOS_CRUD.contratoGeneral}/${id_contrato}`,
      contrato_general_parcial
    );
  }

  // disponibilidad_presupuestal

  getCdps(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(
      rutaConsulta(RECURSOS_CRUD.disponibilidadPresupuestal, consulta)
    );
  }

  postCdp(cdpData: CDPContratoCRUD): Observable<any> {
    if (!cdpData.contrato_general_id?.id) {
      throw new Error(
        'No se ha especificado el contrato general asociado al CDP'
      );
    }
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(`${RECURSOS_CRUD.disponibilidadPresupuestal}/`, cdpData);
  }

  deleteCdp(id: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.delete(RECURSOS_CRUD.disponibilidadPresupuestal, id);
  }

  // estado_contrato: el POST marca el nuevo estado como actual.

  getEstados(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(rutaConsulta(RECURSOS_CRUD.estadoContrato, consulta));
  }

  postEstadoContrato(estado: EstadoContrato): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(`${RECURSOS_CRUD.estadoContrato}/`, estado);
  }

  // especificacion_tecnica

  getEspecificacionesTecnicas(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(
      rutaConsulta(RECURSOS_CRUD.especificacionTecnica, consulta)
    );
  }

  postEspecificacionTecnica(especificacion: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(
      `${RECURSOS_CRUD.especificacionTecnica}/`,
      especificacion
    );
  }

  putEspecificacionTecnica(id: number, especificacion: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put(
      `${RECURSOS_CRUD.especificacionTecnica}/${id}`,
      especificacion
    );
  }

  deleteEspecificacionTecnica(id: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.delete(RECURSOS_CRUD.especificacionTecnica, id);
  }

  // ordenador_contrato: un solo ordenador activo por contrato (el paso
  // presupuestal actualiza el existente o crea uno nuevo).

  getOrdenadores(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(rutaConsulta(RECURSOS_CRUD.ordenadorContrato, consulta));
  }

  postOrdenadorContrato(ordenador: OrdenadorContratoData): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(`${RECURSOS_CRUD.ordenadorContrato}/`, ordenador);
  }

  putOrdenadorContrato(id: number, ordenador: OrdenadorContratoData): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put(`${RECURSOS_CRUD.ordenadorContrato}/${id}`, ordenador as any);
  }

  // supervisor_contrato

  getSupervisores(consulta: ConsultaCrud): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(rutaConsulta(RECURSOS_CRUD.supervisorContrato, consulta));
  }

  postSupervisor(data: SupervisorToSave): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(`${RECURSOS_CRUD.supervisorContrato}/`, data);
  }

  putSupervisor(id: number, data: SupervisorToSave): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put(`${RECURSOS_CRUD.supervisorContrato}/${id}`, data as any);
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
