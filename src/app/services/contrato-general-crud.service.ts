import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RECURSOS_CRUD } from '../core/constants/recursos-crud';
import { VigenciaService } from './vigencia.service';
import {
  CDPContratoCRUD,
  ConsultaCrud,
  EstadoContrato,
  OrdenadorContratoData,
  SupervisorToSave,
} from '../types/types';

/**
 * Ruta de una consulta de lista del CRUD:
 * <recurso>/?query=campo:valor,...&sortby=...&order=...&limit=...
 * El filtro (query) lo arma el componente que consume el service.
 */
export function rutaConsulta(recurso: string, consulta: ConsultaCrud): string {
  const parametros = [`query=${consulta.query}`];
  if (consulta.sortby) parametros.push(`sortby=${consulta.sortby}`);
  if (consulta.order) parametros.push(`order=${consulta.order}`);
  if (consulta.fields) parametros.push(`fields=${consulta.fields}`);
  parametros.push(`limit=${consulta.limit}`);
  return `${recurso}/?${parametros.join('&')}`;
}

@Injectable({
  providedIn: 'root',
})
export class ContratoGeneralCrudService {
  constructor(
    private requestManager: RequestManager,
    private vigenciaService: VigenciaService
  ) {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
  }

  // contrato_general: también guarda el contratista (proveedor_*), el
  // solicitante (dependencia_solicitante_id) y el tipo_control_id.

  get(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`${RECURSOS_CRUD.contratoGeneral}/${idContrato}`);
  }

  // El 409 (consecutivo repetido) lo maneja el registro: reintenta y muestra solo el resultado final.
  post(contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(
      `${RECURSOS_CRUD.contratoGeneral}/`,
      contrato_general_parcial,
      [409]
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

  /** Ids de los contratos activos de la vigencia. `fields` solo acepta PascalCase. */
  getContratosPorVigencia(year: string | null): Observable<any> {
    return this.vigenciaService.vigenciaId(year ?? '').pipe(
      switchMap((vigenciaId) => {
        if (!vigenciaId) return of({ Data: [] });
        this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
        return this.requestManager.get<any>(
          rutaConsulta(RECURSOS_CRUD.contratoGeneral, {
            query: `vigencia_id:${vigenciaId},activo:true`,
            fields: 'Id',
            limit: 0,
          })
        );
      }),
      map((respuesta: any) => ({
        ...respuesta,
        Data: (respuesta?.Data ?? []).map((contrato: { Id: number }) => contrato.Id),
      }))
    );
  }
}
