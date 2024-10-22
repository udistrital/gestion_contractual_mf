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

  post(amparos: any[]): Observable<any> {
    this.requestManager.setPath('POLIZAS_CRUD_SERVICE');
    return this.requestManager.post('amparos', amparos);
  }
}
