import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';

@Injectable({
    providedIn: 'root'
})
export class UbicacionService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath('UBICACION_SERVICE');
    }
    
    get(endpoint: string) {
        this.requestManager.setPath('UBICACION_SERVICE');
        return this.requestManager.get(endpoint);
    }
}