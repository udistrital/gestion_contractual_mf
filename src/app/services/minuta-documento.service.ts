import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GestionContractualCrudService } from './gestion-contractual-crud.service';
import { GestorDocumentalService } from './gestor-documental.service';
import { MinutasMidService } from './minuta-mid.service';
import { minutaEditable } from '../utils/minuta-estado';
import { DocumentoContrato, ErrorMinuta } from '../types/types';
import { MENSAJES_MINUTA } from '../core/constants/mensajes-minuta';

/** Minuta lista para el visor y de dónde salió. */
export interface MinutaDocumento {
  base64: string;
  origen: 'cargada' | 'generada';
  /** fecha_creacion del registro en documentos-contratos (solo si es cargada). */
  fecha?: string;
}

/**
 * Regla única de qué minuta se muestra (decisión del 18/11, #405, con la
 * corrección de "En revisión del jefe"): en Borrador, Rechazado, En revisión
 * del jefe o sin estado se genera con los datos actuales; desde "Aprobado por
 * el jefe" se muestra la última minuta cargada en el flujo (tipo MINUTA) y, si
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

  /**
   * Minuta vigente al enviar el contrato al jefe (decisión del líder técnico en
   * la revisión del PR, punto i): genera la minuta con los datos actuales, la
   * sube al gestor documental, la registra en documentos-contratos y desactiva
   * con borrado lógico las demás minutas activas del contrato. Quien envía
   * registra el cambio de estado solo cuando este observable emite.
   *
   * - Si falla la generación, la subida o el registro, falla con un ErrorMinuta
   *   (el de getMinutaPdf o MENSAJES_MINUTA.registro) y el contrato no se envía.
   *   Si la minuta ya se subió pero no se registró, queda en el gestor (no se
   *   borra) y se avisa en la consola.
   * - Si falla la desactivación de las anteriores, se avisa en la consola y se
   *   continúa: la revisión muestra siempre la minuta más reciente.
   *
   * Emite el id del registro nuevo en documentos-contratos.
   */
  registrarMinutaVigente(contratoId: number, usuarioId: number, usuarioRol: string): Observable<number> {
    return this.minutasMidService.getMinutaPdf(contratoId).pipe(
      switchMap((base64) => this.subirMinuta(contratoId, base64)),
      switchMap((subida) => this.registrarMinuta(contratoId, usuarioId, usuarioRol, subida)),
      switchMap((idNuevo) => this.desactivarMinutasAnteriores(contratoId, idNuevo).pipe(map(() => idNuevo)))
    );
  }

  private subirMinuta(contratoId: number, base64: string): Observable<{ id: number; enlace: string }> {
    const documento = [
      {
        IdTipoDocumento: environment.TIPO_DOCUMENTO_ID_GESTOR_DOCUMENTAL.MINUTAS,
        nombre: `MINUTA ${contratoId}`,
        descripcion: `Minuta generada al enviar a revisión del jefe, contrato general id ${contratoId}`,
        metadatos: {},
        file: base64,
      },
    ];
    return this.gestorDocumentalService.postAny('document/upload', documento, 'todos').pipe(
      catchError((error: unknown) => {
        console.warn('[minuta] No se pudo subir la minuta al gestor documental', { contratoId, error });
        return throwError(() => errorDeRegistro());
      }),
      map((respuesta: any) => {
        const res = respuesta?.res;
        if (String(respuesta?.Status) === '200' && res?.Id && res?.Enlace) {
          return { id: res.Id, enlace: res.Enlace };
        }
        console.warn('[minuta] El gestor documental no devolvió la minuta subida', { contratoId, respuesta });
        throw errorDeRegistro();
      })
    );
  }

  private registrarMinuta(
    contratoId: number,
    usuarioId: number,
    usuarioRol: string,
    subida: { id: number; enlace: string }
  ): Observable<number> {
    const documento: DocumentoContrato = {
      tipo_documento_id: environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA,
      entidad_tipo: 'contrato_general',
      entidad_id: contratoId,
      usuario_id: usuarioId,
      usuario_rol: usuarioRol,
      documento_id: subida.id,
      documento_enlace: subida.enlace,
    };
    const avisar = (detalle: unknown) =>
      console.warn('[minuta] La minuta quedó en el gestor documental pero no se registró en el contrato', {
        contratoId,
        documento_id: subida.id,
        documento_enlace: subida.enlace,
        detalle,
      });
    return this.gestionContractualCrudService.postDocumento(documento, 'todos').pipe(
      catchError((error: unknown) => {
        avisar(error);
        return throwError(() => errorDeRegistro());
      }),
      map((respuesta: any) => {
        const id = respuesta?.Data?.id;
        if (id) return id as number;
        avisar(respuesta);
        throw errorDeRegistro();
      })
    );
  }

  /** Borrado lógico de las minutas activas del contrato, todas menos `idVigente`. Nunca falla. */
  private desactivarMinutasAnteriores(contratoId: number, idVigente: number): Observable<void> {
    const avisar = (detalle: unknown) =>
      console.warn('[minuta] No se pudieron desactivar las minutas anteriores', { contratoId, idVigente, detalle });
    return this.gestionContractualCrudService
      .getDocumentos({
        query:
          `entidad_tipo:contrato_general,entidad_id:${contratoId},` +
          `tipo_documento_id:${environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA},activo:true`,
        // Sin `fields`: con fields el CRUD devuelve las claves sin los nombres JSON.
        limit: 0,
      })
      .pipe(
        switchMap((respuesta: any) => {
          const anteriores: number[] = (Array.isArray(respuesta?.Data) ? respuesta.Data : [])
            .map((d: any) => d?.id)
            .filter((id: unknown): id is number => typeof id === 'number' && id !== idVigente);
          if (!anteriores.length) return of(undefined);
          return forkJoin(
            anteriores.map((id) =>
              this.gestionContractualCrudService.desactivarDocumento(id, 'todos').pipe(
                catchError((error: unknown) => {
                  avisar({ id, error });
                  return of(null);
                })
              )
            )
          ).pipe(map(() => undefined));
        }),
        catchError((error: unknown) => {
          avisar(error);
          return of(undefined);
        })
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

function errorDeRegistro(): ErrorMinuta {
  return { status: null, tipo: 'registro', mensaje: MENSAJES_MINUTA.registro, reintentable: true };
}
