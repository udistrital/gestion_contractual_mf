import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';

@Injectable()
export class DocumentosService {

    constructor(private requestManager: RequestManager) {
      this.requestManager.setPath('GESTOR_DOCUMENTAL_SERVICE');
    }

    postAny(endpoint: string, element: any): Observable<any> {
    this.requestManager.setPath('GESTOR_DOCUMENTAL_SERVICE');
    return this.requestManager.post(endpoint, element);
    }
}
