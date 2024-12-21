import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";
import {Observable} from "rxjs";
import {CDPContratoCRUD, ContratistaCRUD, EstadoContrato} from "../types/types";

@Injectable({
  providedIn: 'root'
})

export class ContratoGeneralCrudService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
  }

  get(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`contratos-generales/${idContrato}`);
  }

  post(contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('contratos-generales', contrato_general_parcial);
  }

  put(id_contrato:number, contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put('contratos-generales/'+id_contrato, contrato_general_parcial);
  }

  postCdp(cdpData: CDPContratoCRUD): Observable<any> {
    if(!cdpData.contrato_general_id){
      throw new Error('No se ha especificado el contrato general asociado al CDP');
    }
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('cdp/', cdpData);
  }

  deleteCdp(id: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.delete('cdp',id);
  }

  getCdpContrato(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get('cdp/contrato/'+idContrato);
  }

  getEstadoActual(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`estados-contrato/contrato/${idContrato}/actual`);
  }

  getEstados(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`estados-contrato/contrato/${idContrato}`);
  }

  postEstadoContrato(estado: EstadoContrato): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('estados-contrato', estado);
  }

  getEspecificacionesTecnicas(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`especificaciones-tecnicas?query={"activo":true, "contratoGeneralId":"${idContrato}"}`);
  }

  postEspecificacionTecnica(especificacion: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('especificaciones-tecnicas', especificacion);
  }

  putEspecificacionTecnica(id: number, especificacion: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put('especificaciones-tecnicas/'+id, especificacion);
  }

  deleteEspecificacionTecnica(id: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.delete('especificaciones-tecnicas', id);
  }

  getContratista(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`contratistas/contrato/${idContrato}`);
  }

  postContratista(contratistaData: ContratistaCRUD): Observable<any> {
    console.log(contratistaData);
    if(!contratistaData.contrato_general_id){
      throw new Error('No se ha especificado el contrato general asociado al contratista');
    }
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('contratistas/', contratistaData);
  }

  putContratista(contratistaData: any): Observable<any> {
    const {id, ...rest} = contratistaData;
    if(!id){
      throw new Error('No se ha especificado el id del contratista');
    }
    if(!contratistaData.contrato_general_id){
      throw new Error('No se ha especificado el contrato general asociado al contratista');
    }
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put('contratistas/'+id, rest);
  }

  getDocumentoContrato(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`documentos-contratos?query={"activo":true, "contrato_general_id":"${idContrato}"}`);
  }

  postDocumentoContrato(documento: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('documentos-contratos', documento);
  }

  getContratos(params: any): Observable<any> {

    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');

    let queryParams = [];

    const filterParams = { ...params };
    delete filterParams.limit;
    delete filterParams.offset;

    if (Object.keys(filterParams).length > 0) {
      queryParams.push(`query=${encodeURIComponent(JSON.stringify(filterParams))}`);
    }

    if (params.limit !== undefined) {
      queryParams.push(`limit=${params.limit}`);
    }
    if (params.offset !== undefined) {
      queryParams.push(`offset=${params.offset}`);
    }

    const url = `contratos-generales${queryParams.length ? '?' + queryParams.join('&') : ''}`;

    return this.requestManager.get(url);
  }

  postSolicitante(contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('solicitantes', contrato_general_parcial);
  }

  patchSolicitante(id: number, contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.patch('solicitantes/'+id, contrato_general_parcial);
  }

  postLugarEjecucion(contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('lugares-ejecucion', contrato_general_parcial);
  }

  patchLugarEjecucion(id: number, contrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.patch('lugares-ejecucion/'+id, contrato_general_parcial);
  }
}
