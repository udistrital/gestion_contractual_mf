import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';
import { EstadosSinAlerta } from '../managers/errorManager';

@Injectable()
export class GestorDocumentalService {
  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('GESTOR_DOCUMENTAL_SERVICE');
  }

  postAny(endpoint: string, element: any, estadosSinAlerta: EstadosSinAlerta = []): Observable<any> {
    this.requestManager.setPath('GESTOR_DOCUMENTAL_SERVICE');
    return this.requestManager.post(endpoint, element, estadosSinAlerta);
  }

  getDocumento(documento_enlace: string): Observable<any> {
    this.requestManager.setPath('GESTOR_DOCUMENTAL_SERVICE');
    return this.requestManager.get(`document/${documento_enlace}`);
  }
}
