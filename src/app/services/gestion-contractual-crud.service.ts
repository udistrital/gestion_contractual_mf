import { Injectable } from '@angular/core';
import { RECURSOS_CRUD } from '../core/constants/recursos-crud';
import { RequestManager } from '../managers/requestManager';
import { ConsultaCrud, DocumentoContrato } from '../types/types';
import { rutaConsulta } from './contrato-general-crud.service';

@Injectable({
    providedIn: 'root',
})
export class GestionContractualCrudService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath("GESTION_CONTRACTUAL_CRUD_SERVICE");
    }

    // documento_contrato (CRUD Beego v2): lo comparten contrato, póliza y acta de inicio.
    getDocumentos(consulta: ConsultaCrud) {
        return this.get(rutaConsulta(RECURSOS_CRUD.documentoContrato, consulta));
    }

    postDocumento(documento: DocumentoContrato) {
        return this.post(`${RECURSOS_CRUD.documentoContrato}/`, documento);
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
