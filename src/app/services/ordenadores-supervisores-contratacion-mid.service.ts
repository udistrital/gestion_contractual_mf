import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import {Observable, tap} from 'rxjs';
import {SupervisorResponse} from "../types/types";
import {map} from "rxjs/operators";

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

  getSupervisoresDependencia(dependenciaId: string): Observable<SupervisorResponse> {
    this.requestManager.setPath('ORDENADORES_SUPERVISORES_CONTRATACION_MID_SERVICE');
    return this.requestManager
      .get(`supervisores/dependencia?dependenciaId=${dependenciaId}&fecha=2023-10-01`)
      .pipe(
        tap(response => console.log('Respuesta original:', response)),
        map((response: any) => {
          const data = response.Body || response;
          console.log('Datos procesados:', data);
          return data;
        })
      );
  }
}
