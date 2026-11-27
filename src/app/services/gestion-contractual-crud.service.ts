import { Injectable } from '@angular/core';
import { RECURSOS_CRUD } from '../core/constants/recursos-crud';
import { RequestManager } from '../managers/requestManager';
import { ConsultaCrud, DocumentoContrato } from '../types/types';
import { EstadosSinAlerta } from '../managers/errorManager';
import { rutaConsulta } from './contrato-general-crud.service';

@Injectable({
    providedIn: 'root',
})
export class GestionContractualCrudService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath("GESTION_CONTRACTUAL_CRUD_SERVICE");
    }

    // documento_contrato: lo comparten contrato, póliza y acta de inicio.
    getDocumentos(consulta: ConsultaCrud) {
        return this.get(rutaConsulta(RECURSOS_CRUD.documentoContrato, consulta));
    }

    postDocumento(documento: DocumentoContrato, estadosSinAlerta: EstadosSinAlerta = []) {
        this.requestManager.setPath("GESTION_CONTRACTUAL_CRUD_SERVICE");
        return this.requestManager.post(`${RECURSOS_CRUD.documentoContrato}/`, documento, estadosSinAlerta);
    }

    /**
     * Desactiva un documento: el DELETE del CRUD Beego es un borrado lógico
     * (activo = false y fecha_modificacion); la fila no se borra.
     */
    desactivarDocumento(id: number, estadosSinAlerta: EstadosSinAlerta = []) {
        this.requestManager.setPath("GESTION_CONTRACTUAL_CRUD_SERVICE");
        return this.requestManager.delete(RECURSOS_CRUD.documentoContrato, id, estadosSinAlerta);
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
