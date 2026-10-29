import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, DocumentoContrato } from 'src/app/types/types';
import { CrudBeegoService } from './crud-beego.service';
import { DOCUMENTO_CONTRATO, ENTIDAD_CONTRATO_GENERAL, RECIENTE_PRIMERO } from './recursos';

@Injectable({ providedIn: 'root' })
export class DocumentoContratoService {
  private readonly crud = inject(CrudBeegoService);

  /** Documento vigente de un tipo: el más reciente activo (el modelo v2 no tiene "actual"). */
  vigente(contratoId: number, tipoDocumentoId: number): Observable<DocumentoContrato[]> {
    return this.crud
      .consultar<DocumentoContrato>(
        DOCUMENTO_CONTRATO,
        {
          EntidadTipo: ENTIDAD_CONTRATO_GENERAL,
          EntidadId: contratoId,
          TipoDocumentoId: tipoDocumentoId,
          Activo: true,
        },
        { ...RECIENTE_PRIMERO, limit: 1 }
      )
      .pipe(
        map((respuesta) =>
          (respuesta.Data ?? []).map((documento: any) => ({ ...documento, contrato_general_id: documento.entidad_id }))
        )
      );
  }

  crear(documento: DocumentoContrato): Observable<ApiResponse<any>> {
    const { contrato_general_id, ...resto } = documento;
    return this.crud.crear(DOCUMENTO_CONTRATO, {
      ...resto,
      entidad_tipo: ENTIDAD_CONTRATO_GENERAL,
      entidad_id: contrato_general_id,
    });
  }
}
