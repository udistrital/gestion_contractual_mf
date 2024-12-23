import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrdenadoresSupervisoresContratacionMidService {

  constructor(private requestManager: RequestManager) {
    // Configura la ruta base al microservicio MID
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
  }

  getSupervisores(): Observable<any> {
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
    return this.requestManager.get(``);
  }
  
  getOrdenadores(rol: number): Observable<any> {
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
    return this.requestManager.get(`ordenador?rol=${rol}`);
  }
  
  getRolOrdenadores(): Observable<any> {
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
    return this.requestManager.get(`rol-ordenador`);
  }

  getOrdenadorActuales(rol: number): Observable<any> {
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
    return this.requestManager.get(`rol-ordenador/actual?rol=${rol}`);
  }
}
