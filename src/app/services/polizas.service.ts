import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';

/**
 * Consume pólizas y amparos a través de gestion_contractual_mid (endpoints
 * `polizas`, `amparos-polizas` y `amparos-contratos`). El MID reenvía a
 * gestion_contractual_crud con las mismas rutas, query, body y respuesta.
 * Actualización #360: antes `polizas` y `amparos-polizas` se consumían
 * directo en gestion_contractual_crud (#352).
 */
@Injectable({
  providedIn: 'root',
})
export class PolizasService {
  constructor(private requestManager: RequestManager) {}

  // --- amparos-polizas (gestion_contractual_mid) ---

  getAmparosPorContrato(contratoGeneralId: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    const query = encodeURIComponent(
      JSON.stringify({ contrato_general_id: contratoGeneralId, activo: true })
    );
    return this.requestManager.get(
      `amparos-polizas?query=${query}&limit=0&sortBy=id&orderBy=ASC`
    );
  }

  postAmparos(amparos: any[]): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.post('amparos-polizas', amparos);
  }

  putAmparo(id: number, amparo: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.put(`amparos-polizas/${id}`, amparo);
  }

  deleteAmparo(id: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.delete('amparos-polizas', id);
  }

  // --- polizas (gestion_contractual_mid) ---

  getPolizaPorContrato(contratoGeneralId: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    const query = encodeURIComponent(
      JSON.stringify({ contrato_general_id: contratoGeneralId, activo: true })
    );
    return this.requestManager.get(`polizas?query=${query}&limit=1`);
  }

  postPoliza(poliza: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.post('polizas', poliza);
  }

  putPoliza(id: number, poliza: any): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.put(`polizas/${id}`, poliza);
  }

  // --- amparos-contratos (gestion_contractual_mid) ---

  getAmparosContratoMid(id: string | number | null): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(`amparos-contratos/${id}`);
  }
}
