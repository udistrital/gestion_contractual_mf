import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";
import {Observable} from "rxjs";
import { DependenciaContratoMidResponse, SedeContratoMidResponse} from "../types/types";
import {map} from "rxjs/operators";

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

  getContratos(params: any): Observable<any> {

    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');

    let queryParams = [];

    const filterParams = { ...params };
    delete filterParams.limit;
    delete filterParams.offset;

    if (Object.keys(filterParams).length > 0) {
      queryParams.push(`query=${encodeURIComponent(JSON.stringify(filterParams))}`);
    }

    if (params.limit !== undefined) {
      queryParams.push(`limit=${params.limit}`);
    }
    if (params.offset !== undefined) {
      queryParams.push(`offset=${params.offset}`);
    }

    const url = `contratos-generales${queryParams.length ? '?' + queryParams.join('&') : ''}`;
    console.log(url);

    return this.requestManager.get(url);
  }

  getSedes(): Observable<SedeContratoMidResponse[]> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get('espacios-fisicos/sedes')
      .pipe(
        map((response: any) => {
          if (response && response.Data) {
            return response.Data;
          }
          return [];
        })
      );
  }

  getDependenciasBySede(sedeId: number): Observable<DependenciaContratoMidResponse[]> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(`espacios-fisicos/dependencias-sede/${sedeId}`)
      .pipe(
        map((response: any) => {
          if (response && response.Data) {
            return response.Data;
          }
          return [];
        })
      );
  }
}
