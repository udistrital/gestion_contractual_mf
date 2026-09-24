import { Injectable } from "@angular/core";
import { RequestManager } from "../managers/requestManager";

@Injectable({
    providedIn: "root",
})
export class TercerosCrudService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath("TERCEROS_CRUD");
    }

    // Método para obtener datos de identificación por tercero_id y activo = true
    getDatosIdentificacionPorTercero(terceroId: number) {
        const endpoint = `datos_identificacion/?query=tercero_id:${terceroId},activo:true`;
        return this.get(endpoint);
    }

    // Método para obtener un tercero por ID
    getTerceroPorId(terceroId: number) {
        const endpoint = `tercero/${terceroId}`;
        return this.get(endpoint);
    }

    // Método para obtener un tipo de documento por ID
    getTipoDocumentoPorId(tipoDocumentoId: number) {
        const endpoint = `tipo_documento/${tipoDocumentoId}`;
        return this.get(endpoint);
    }

    // Método genérico GET
    get(endpoint: string) {
        this.requestManager.setPath("TERCEROS_CRUD");
        return this.requestManager.get(endpoint);
    }

    // Método genérico POST
    post(endpoint: string, element: any) {
        this.requestManager.setPath("TERCEROS_CRUD");
        return this.requestManager.post(endpoint, element);
    }

    // Método genérico PUT
    put(endpoint: string, element: any) {
        this.requestManager.setPath("TERCEROS_CRUD");
        return this.requestManager.put(endpoint, element);
    }

    // Método genérico DELETE
    delete(endpoint: string, element: any) {
        this.requestManager.setPath("TERCEROS_CRUD");
        return this.requestManager.delete(endpoint, element.Id);
    }
}