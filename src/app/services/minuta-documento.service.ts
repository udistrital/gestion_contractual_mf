import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GestionContractualCrudService } from './gestion-contractual-crud.service';
import { GestorDocumentalService } from './gestor-documental.service';
import { MinutasMidService } from './minuta-mid.service';
import { minutaEditable } from '../utils/minuta-estado';

/** Minuta lista para el visor y de dónde salió. */
export interface MinutaDocumento {
  base64: string;
  origen: 'cargada' | 'generada';
  /** fecha_creacion del registro en documentos-contratos (solo si es cargada). */
  fecha?: string;
}

/**
 * Regla única de qué minuta se muestra (decisión del 18/11, #405): en Borrador,
 * Rechazado o sin estado se genera con los datos actuales; desde "En revisión
 * del jefe" se muestra la última minuta cargada en el flujo (tipo MINUTA) y, si
 * no hay o falla su descarga, se genera. Los errores al generar llegan como
 * ErrorMinuta (getMinutaPdf).
 */
@Injectable({
  providedIn: 'root',
})
export class MinutaDocumentoService {
  constructor(
    private gestionContractualCrudService: GestionContractualCrudService,
    private gestorDocumentalService: GestorDocumentalService,
    private minutasMidService: MinutasMidService
  ) {}

  obtenerMinuta(contratoId: number, estadoInterno: number | null | undefined): Observable<MinutaDocumento> {
    if (minutaEditable(estadoInterno)) return this.generar(contratoId);
    return this.minutaCargada(contratoId).pipe(
      switchMap((cargada) => (cargada ? of(cargada) : this.generar(contratoId)))
    );
  }

  private generar(contratoId: number): Observable<MinutaDocumento> {
    return this.minutasMidService
      .getMinutaPdf(contratoId)
      .pipe(map((base64): MinutaDocumento => ({ base64, origen: 'generada' })));
  }

  /** Última minuta cargada del contrato, o null si no hay o no se pudo descargar. */
  private minutaCargada(contratoId: number): Observable<MinutaDocumento | null> {
    return this.gestionContractualCrudService
      .getDocumentos({
        query:
          `entidad_tipo:contrato_general,entidad_id:${contratoId},` +
          `tipo_documento_id:${environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA},activo:true`,
        sortby: 'fecha_creacion,id',
        order: 'desc',
        limit: 1,
      })
      .pipe(
        catchError(() => of(null)),
        switchMap((documentos: any) => {
          const documento = documentos?.Data?.[0];
          if (!documento?.documento_enlace) return of(null);
          return this.gestorDocumentalService.getDocumento(documento.documento_enlace).pipe(
            map((respuesta: any): MinutaDocumento | null =>
              respuesta?.file
                ? { base64: respuesta.file, origen: 'cargada', fecha: documento.fecha_creacion }
                : null
            ),
            catchError(() => of(null))
          );
        })
      );
  }
}
