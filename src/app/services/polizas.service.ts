import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PolizasService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('POLIZAS_CRUD_SERVICE');
  }

  postAmparos(amparos: any[]): Observable<any> {
    this.requestManager.setPath('POLIZAS_CRUD_SERVICE');
    return this.requestManager.post('amparos', amparos);
  }

  putAmparos(id: number, amparos: any): Observable<any> {
    this.requestManager.setPath('POLIZAS_CRUD_SERVICE');
    return this.requestManager.put('amparos/' + id, amparos);
  }

  getAmparos(contratoId: number): Observable<any> {
    this.requestManager.setPath('POLIZAS_CRUD_SERVICE');
    return this.requestManager.get('amparos/contrato/' + contratoId);
  }
}
