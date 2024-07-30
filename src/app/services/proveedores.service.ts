import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('PROVEEDORES_SERVICE');
  }
  get(endpoint: string) {
    this.requestManager.setPath('PROVEEDORES_SERVICE');
    return this.requestManager.get(endpoint);
  }

}
