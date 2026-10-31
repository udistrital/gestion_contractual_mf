import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import {ApiResponse, ParametroResponse} from "../types/types";
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ParametrosService {

    private parametrosCache: Record<number, ParametroResponse[]> = {};

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath('PARAMETROS_SERVICE');
    }
    get<T>(endpoint: string) {
        this.requestManager.setPath('PARAMETROS_SERVICE');
        return this.requestManager.get<T>(endpoint);
    }

    post(endpoint: string, element: any) {
    this.requestManager.setPath('PARAMETROS_SERVICE');
    return this.requestManager.post(endpoint, element);
    }

    put(endpoint: string, element: { Id: any; }) {
    this.requestManager.setPath('PARAMETROS_SERVICE');
    return this.requestManager.put(endpoint, element);
    }

    delete(endpoint: string, element: { Id: any; }) {
    this.requestManager.setPath('PARAMETROS_SERVICE');
    return this.requestManager.delete(endpoint, element.Id);
    }

    async getParametrosPorTipo(tipoParametroId: number[]) {
        this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
        const noEncontrados: number[] = [];
        const parametrosEntregar: Record<number, ParametroResponse[]> = {};

        for (const tipoId of tipoParametroId ) {
            const parametrosPorTipo = this.parametrosCache[tipoId];
            if (parametrosPorTipo) {
                parametrosEntregar[tipoId] = parametrosPorTipo
            } else {
                noEncontrados.push(tipoId);
            }
        }

        if (noEncontrados.length === 0) {
            return parametrosEntregar;
        }

        const endpoint = `parametros?ids=${noEncontrados.toString()}`
        const params = await lastValueFrom(
            this.requestManager.get<ApiResponse<Record<number, ParametroResponse[]>>>(endpoint)
        );

        this.parametrosCache = {...this.parametrosCache, ...params.Data};
        
        return {...parametrosEntregar, ...params.Data};
    }

    getParametroPorPadreIdyTipoId(padreId: number, tipoId: number): ParametroResponse[] {
        const params = this.parametrosCache[tipoId];
        return params ? params.filter(p => p.ParametroPadreId?.Id === padreId) : [];
    }

}
