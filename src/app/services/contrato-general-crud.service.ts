import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ContratoGeneralCrudService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('CONTRATO_GENERAL_CRUD_SERVICE');
  }
  post(cntrato_general_parcial: any): Observable<any> {
    this.requestManager.setPath('CONTRATO_GENERAL_CRUD_SERVICE');
    return this.requestManager.post('contratos-generales', cntrato_general_parcial);
  }

}
