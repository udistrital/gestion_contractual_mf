import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";
import {Observable} from "rxjs";
import {CDPContratoCRUD, ContratistaCRUD, EstadoContratoCRUD} from "../types/types";

@Injectable({
  providedIn: 'root'
})

export class ContratoGeneralCrudService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
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

  postEstadoContrato(estado: EstadoContratoCRUD): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('estados-contrato', estado);
  }

  postContratista(contratistaData: ContratistaCRUD): Observable<any> {
    if(!contratistaData.contrato_general_id){
      throw new Error('No se ha especificado el contrato general asociado al contratista');
    }
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('contratistas/', contratistaData);
  }

  getContratos(params: any): Observable<any> {

    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');

    // Construimos el query string para la URL
    let queryParams = [];

    // Procesamos los parámetros de filtrado
    const filterParams = { ...params };
    delete filterParams.limit;
    delete filterParams.offset;

    // Si hay parámetros de filtrado, los añadimos al query
    if (Object.keys(filterParams).length > 0) {
      queryParams.push(`query=${encodeURIComponent(JSON.stringify(filterParams))}`);
    }

    // Añadimos los parámetros de paginación si existen
    if (params.limit !== undefined) {
      queryParams.push(`limit=${params.limit}`);
    }
    if (params.offset !== undefined) {
      queryParams.push(`offset=${params.offset}`);
    }

    // Construimos la URL final
    const url = `contratos-generales${queryParams.length ? '?' + queryParams.join('&') : ''}`;

    // Realizamos la petición GET
    return this.requestManager.get(url);
  }

}
