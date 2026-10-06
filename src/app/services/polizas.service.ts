import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PolizasService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
  }

  postAmparos(amparos: any[]): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('amparos-polizas', amparos);
  }

  putAmparos(id: number, amparos: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.put('amparos-polizas/' + id, amparos);
  }

  getAmparos(contratoId: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get('amparos-polizas/contrato/' + contratoId);
  }

  postPoliza(poliza: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post('polizas', poliza);
  }

  getAmparosContratoMid(id: string | number | null): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(`amparos-contratos/${id}`);
  }
}
