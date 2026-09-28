import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';

@Injectable({
    providedIn: 'root',
})
export class GestionContractualCrudService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath("GESTION_CONTRACTUAL_CRUD_SERVICE");
    }

    // Método para registrar un acta de inicio
    registrarActaInicio(data: any) {
        const endpoint = `acta_inicio`;
        return this.post(endpoint, data);
    }

    // Método genérico GET
    get(endpoint: string) {
        this.requestManager.setPath("GESTION_CONTRACTUAL_CRUD_SERVICE");
        return this.requestManager.get(endpoint);
    }

    // Método genérico POST
    post(endpoint: string, element: any) {
        this.requestManager.setPath("GESTION_CONTRACTUAL_CRUD_SERVICE");
        return this.requestManager.post(endpoint, element);
    }

    // Método genérico PUT
    put(endpoint: string, element: { Id: any; }) {
        this.requestManager.setPath("GESTION_CONTRACTUAL_CRUD_SERVICE");
        return this.requestManager.put(endpoint, element);
    }

    // Método genérico DELETE
    delete(endpoint: string, element: { Id: any; }) {
        this.requestManager.setPath("GESTION_CONTRACTUAL_CRUD_SERVICE");
        return this.requestManager.delete(endpoint, element.Id);
    }
}
