import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';
import { GestorDocumentalService } from './gestor-documental.service';
import { environment } from '../../environments/environment';
import { ApiResponse, AmparoPolizaDto, ConsultaCrud } from '../types/types';
import { rutaConsulta } from './contrato-general-crud.service';
import { RECURSOS_CRUD } from '../core/constants/recursos-crud';

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
  constructor(
    private requestManager: RequestManager,
    private gestorDocumentalService: GestorDocumentalService
  ) {}

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
  
  /** amparo_poliza del CRUD; el filtro lo arma quien consume. */
  getAmparos(consulta: ConsultaCrud): Observable<ApiResponse<AmparoPolizaDto[]>> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(rutaConsulta(RECURSOS_CRUD.amparoPoliza, consulta));
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

  // --- acta de aprobación de póliza (minuta_contractual_mid) ---

  /** PDF (base64) del acta con la póliza y amparos ya registrados. */
  getActaAprobacionPoliza(contratoGeneralId: number): Observable<any> {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get(
      `acta-poliza/contratos/${contratoGeneralId}`
    );
  }

  /**
   * PDF (base64) de borrador del acta, con las filas de amparos tal como están
   * en pantalla (aún sin registrar).
   */
  getBorradorActaAprobacion(
    contratoGeneralId: number,
    amparos: {
      id: number;
      valor: number;
      fecha_inicio: string | null;
      fecha_fin: string | null;
    }[]
  ): Observable<any> {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.post(
      `acta-poliza/contratos/${contratoGeneralId}/borrador`,
      { amparos }
    );
  }

  // --- acta guardada (documentos-contratos en CRUD + gestor documental) ---

  /** Acta de aprobación más reciente registrada para la póliza. */
  getActaGuardada(polizaId: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    const tipoDocumento = environment.TIPO_DOCUMENTO_ID_PARAMETROS.ACTA_APROBACION_POLIZA;
    return this.requestManager.get(
      rutaConsulta(RECURSOS_CRUD.documentoContrato, {
        query: `entidad_tipo:poliza,entidad_id:${polizaId},tipo_documento_id:${tipoDocumento},activo:true`,
        sortby: 'fecha_creacion,id',
        order: 'desc',
        limit: 1,
      })
    );
  }

  /** Contenido (base64) de un documento del gestor documental. */
  getDocumentoGestor(documentoEnlace: string): Observable<any> {
    return this.gestorDocumentalService.getDocumento(documentoEnlace);
  }

  /** Sube el PDF (base64) al gestor documental. */
  subirActa(contratoGeneralId: number, base64: string): Observable<any> {
    const data = [
      {
        IdTipoDocumento:
          environment.TIPO_DOCUMENTO_ID_GESTOR_DOCUMENTAL.POLIZAS,
        nombre: `ACTA APROBACION POLIZA ${contratoGeneralId}`,
        descripcion: `Acta de aprobación de póliza, contrato general id ${contratoGeneralId}`,
        metadatos: {},
        file: base64,
      },
    ];
    return this.gestorDocumentalService.postAny('document/upload', data);
  }

  /** Registra en la póliza el documento ya subido al gestor documental. */
  registrarDocumentoActa(
    polizaId: number,
    documentoId: number,
    documentoEnlace: string
  ): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.post(`${RECURSOS_CRUD.documentoContrato}/`, {
      entidad_tipo: 'poliza',
      entidad_id: polizaId,
      tipo_documento_id:
        environment.TIPO_DOCUMENTO_ID_PARAMETROS.ACTA_APROBACION_POLIZA,
      documento_id: documentoId,
      documento_enlace: documentoEnlace,
    });
  }
}
