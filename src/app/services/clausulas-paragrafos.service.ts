import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';

@Injectable({
  providedIn: 'root'
})
export class ClausulasParagrafosService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('CLAUSULAS_PARAGRAFOS_SERVICE');
  }

  get(endpoint: string) {
    this.requestManager.setPath('CLAUSULAS_PARAGRAFOS_SERVICE');
    return this.requestManager.get(endpoint);
  }

  post(endpoint: string, element: any) {
    this.requestManager.setPath('CLAUSULAS_PARAGRAFOS_SERVICE');
    return this.requestManager.post(endpoint, element);
  }
}