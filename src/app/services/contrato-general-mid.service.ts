import { Injectable } from '@angular/core';
import { RequestManager } from "../managers/requestManager";
import { Observable } from "rxjs";
import { DependenciaContratoMidResponse, SedeContratoMidResponse } from "../types/types";
import { map } from "rxjs/operators";

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

  postCargaMasivaEspecificaciones(data: any) {
    this.requestManager.setPath("GESTION_CONTRACTUAL_MID_SERVICE");
    return this.requestManager.post(`cargue-masivo/especificaciones-tecnicas`, data);
  }

  getContratos(params: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    let queryParams = [];
    const filterParams = { ...params };
    delete filterParams.limit;
    delete filterParams.offset;
    delete filterParams.fechaCreacion;

    // Construimos la parte del queryFilter
    let queryFilterParts = [];

    // Manejamos los filtros regulares
    if (Object.keys(filterParams).length > 0) {
      const flatParams = this.flattenObject(filterParams);
      queryFilterParts.push(
        Object.entries(flatParams)
          .map(([key, value]) => `"${key}":${JSON.stringify(value)}`)
          .join(',')
      );
    }

    // Manejamos el filtro de fechas
    if (params.fechaCreacion) {
      queryFilterParts.push(
        `"fechaCreacion":${JSON.stringify(params.fechaCreacion)}`
      );
    }

    // Si hay algún filtro, lo añadimos a queryParams
    if (queryFilterParts.length > 0) {
      queryParams.push(
        `queryFilter=${encodeURIComponent(queryFilterParts.join(','))}`
      );
    }

    // Añadimos limit y offset
    if (params.limit !== undefined) {
      queryParams.push(`limit=${params.limit}`);
    }
    if (params.offset !== undefined) {
      queryParams.push(`offset=${params.offset}`);
    }

    const url = `contratos-generales${queryParams.length ? '?' + queryParams.join('&') : ''}`;
    return this.requestManager.get(url);
  }

  private flattenObject(obj: any, prefix: string = ''): any {
    let items: any = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          Object.assign(items, this.flattenObject(obj[key], newKey));
        } else {
          items[newKey] = obj[key];
        }
      }
    }
    return items;
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

  getEstados(idContrato: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(
      `estados?queryFilter="contrato_general_id":${idContrato}&sortBy=fecha_creacion&orderBy=DESC`
    );
  }
}
