import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";
import {Observable} from "rxjs";
import {CDPContratoCRUD} from "../types/types";

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
}
