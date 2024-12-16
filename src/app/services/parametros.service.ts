import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import {ParametroResponse} from "../types/types";

@Injectable()
export class ParametrosService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath('PARAMETROS_SERVICE');
    }
    get(endpoint: string) {
        this.requestManager.setPath('PARAMETROS_SERVICE');
        return this.requestManager.get(endpoint);
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

}

export function sortParametros(parametros: ParametroResponse[]): ParametroResponse[] {
  return parametros.sort((a, b) => {
    const nombreA = a.Nombre?.toLowerCase() ?? '';
    const nombreB = b.Nombre?.toLowerCase() ?? '';
    return nombreA.localeCompare(nombreB, 'es');
  });
}
