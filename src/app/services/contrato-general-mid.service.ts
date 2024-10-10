import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ContratoGeneralMidService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
  }
  get(id_contrato: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(`contratos-generales/${id_contrato}`);
  }
}
