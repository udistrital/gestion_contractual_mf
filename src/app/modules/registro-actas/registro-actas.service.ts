import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestManager } from 'src/app/managers/requestManager';

// Endpoints del acta de inicio en minuta_contractual_mid
@Injectable({
  providedIn: 'root'
})
export class RegistroActasService {

  constructor(private requestManager: RequestManager) {}

  getPrecargaActaInicio(contrato_id: number): Observable<any> {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(`acta-inicio/contratos/${contrato_id}`);
  }

  previsualizarActaInicio(contrato_id: number, datos: any): Observable<any> {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.post(`acta-inicio/contratos/${contrato_id}/previsualizacion`, datos);
  }

  generarActaInicio(contrato_id: number, datos: any): Observable<any> {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.post(`acta-inicio/contratos/${contrato_id}`, datos);
  }
}
