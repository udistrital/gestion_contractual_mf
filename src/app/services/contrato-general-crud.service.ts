import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";
import {Observable} from "rxjs";

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
}
