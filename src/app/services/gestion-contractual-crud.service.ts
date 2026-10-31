import { Injectable } from '@angular/core';
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

    // Método para registrar un acta de inicio
    registrarActaInicio(data: any) {
        const endpoint = `acta_inicio`;
        return this.post(endpoint, data);
    }

    // documento_contrato (CRUD Beego v2): lo comparten contrato, póliza y acta de inicio.
    getDocumentos(consulta: ConsultaCrud) {
        return this.get(rutaConsulta('documento_contrato', consulta));
    }

    postDocumento(documento: DocumentoContrato) {
        return this.post('v1/documento_contrato/', documento);
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
