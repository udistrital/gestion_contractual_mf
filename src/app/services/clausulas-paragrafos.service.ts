import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClausulasParagrafosService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('CLAUSULAS_PARAGRAFOS_SERVICE');
  }

  get(endpoint: string): Observable<any> {
    this.requestManager.setPath('CLAUSULAS_PARAGRAFOS_SERVICE');
    return this.requestManager.get(endpoint);
  }

  post(endpoint: string, element: any): Observable<any> {
    this.requestManager.setPath('CLAUSULAS_PARAGRAFOS_SERVICE');
    return this.requestManager.post(endpoint, element);
  }

  put(endpoint: string, element: any): Observable<any> {
    this.requestManager.setPath('CLAUSULAS_PARAGRAFOS_SERVICE');
    return this.requestManager.put(endpoint, element);
  }

  delete(endpoint: string, element: any): Observable<any> {
    this.requestManager.setPath('CLAUSULAS_PARAGRAFOS_SERVICE');
    return this.requestManager.delete(endpoint, element);
  }
}