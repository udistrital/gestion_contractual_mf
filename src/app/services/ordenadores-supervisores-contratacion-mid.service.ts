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

  getSupervisores(queryParams: any = {}): Observable<any> {
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
  
    // Construir manualmente la URL con los parámetros de consulta
    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `supervisor_contrato${queryString ? '?' + queryString : ''}`;
  
    return this.requestManager.get(endpoint);
  }
  
  getOrdenadores(queryParams: any = {}): Observable<any> {
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
  
    // Construir manualmente la URL con los parámetros de consulta
    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `ordenadores${queryString ? '?' + queryString : ''}`;
  
    return this.requestManager.get(endpoint);
  }
  

  // Método para crear o enviar datos adicionales en el MID (ejemplo con POST)
  postOrdenador(data: any): Observable<any> {
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
    return this.requestManager.post('ordenadores', data);
  }

  // Método para actualizar un recurso en el MID (ejemplo con PUT)
  updateOrdenador(id: any, data: any): Observable<any> {
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
    return this.requestManager.put(`ordenadores/${id}`, data);
  }

}
