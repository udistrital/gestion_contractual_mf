import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MinutasMidService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
  }

  getMinuta(contrato_id: number): Observable<any> {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(`minutas/contratos/${contrato_id}`);
  }

  getActaInicio(contrato_id: number): Observable<any> {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(`minutas/acta-inicio/${contrato_id}`);
  }

  getActaAprobacionPoliza(contrato_id: number): Observable<any> {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(`minutas/acta-poliza/${contrato_id}`);
  }
}