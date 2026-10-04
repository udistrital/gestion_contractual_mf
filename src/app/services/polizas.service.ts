import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';
import { GestorDocumentalService } from './gestor-documental.service';
import { environment } from '../../environments/environment';

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

  /** Acta de aprobación más reciente registrada para el contrato. */
  getActaGuardada(contratoGeneralId: number): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    const query = encodeURIComponent(
      JSON.stringify({
        contrato_general_id: contratoGeneralId,
        tipo_documento_id:
          environment.TIPO_DOCUMENTO_ID_PARAMETROS.ACTA_APROBACION_POLIZA,
        activo: true,
      })
    );
    return this.requestManager.get(
      `documentos-contratos?query=${query}&sortBy=fecha_creacion&orderBy=DESC&limit=1`
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

  /** Registra en el contrato el documento ya subido al gestor documental. */
  registrarDocumentoActa(
    contratoGeneralId: number,
    documentoId: number,
    documentoEnlace: string
  ): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    // El CRUD (forbidNonWhitelisted) solo admite estos campos
    return this.requestManager.post('documentos-contratos', {
      contrato_general_id: contratoGeneralId,
      tipo_documento_id:
        environment.TIPO_DOCUMENTO_ID_PARAMETROS.ACTA_APROBACION_POLIZA,
      documento_id: documentoId,
      documento_enlace: documentoEnlace,
    });
  }
}
