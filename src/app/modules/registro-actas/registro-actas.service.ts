import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestManager } from 'src/app/managers/requestManager';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';
import { environment } from 'src/environments/environment';

// Endpoints del acta de inicio en minuta_contractual_mid
@Injectable({
  providedIn: 'root'
})
export class RegistroActasService {

  constructor(
    private requestManager: RequestManager,
    private gestorDocumentalService: GestorDocumentalService,
    private gestionContractualCrudService: GestionContractualCrudService
  ) {}

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

  /** Sube el PDF (base64) del acta de inicio al gestor documental. */
  subirActaInicio(contrato_id: number, base64: string): Observable<any> {
    const data = [
      {
        IdTipoDocumento: environment.TIPO_DOCUMENTO_ID_GESTOR_DOCUMENTAL.ACTAS_DE_INICIO,
        nombre: `ACTA DE INICIO ${contrato_id}`,
        descripcion: `Acta de inicio, contrato general id ${contrato_id}`,
        metadatos: {},
        file: base64,
      },
    ];
    return this.gestorDocumentalService.postAny('document/upload', data);
  }

  /** Registra en el acta de inicio el documento ya subido al gestor documental. */
  registrarDocumentoActaInicio(acta_inicio_id: number, documento_id: number, documento_enlace: string): Observable<any> {
    return this.gestionContractualCrudService.postDocumento({
      entidad_tipo: 'acta_inicio',
      entidad_id: acta_inicio_id,
      tipo_documento_id: environment.TIPO_DOCUMENTO_ID_PARAMETROS.ACTA_INICIO,
      documento_id,
      documento_enlace,
    });
  }
}
