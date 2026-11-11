import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RequestManager } from '../managers/requestManager';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { ErrorMinuta, RespuestaMinuta, TipoErrorMinuta } from '../types/types';
import {
  MENSAJES_MINUTA,
  NOMBRES_FALTANTES_MINUTA,
  PATRONES_MENSAJE_MINUTA,
} from '../core/constants/mensajes-minuta';

const PREFIJO_DATA_URI = /^data:application\/pdf;base64,/i;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

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

  /**
   * PDF de la minuta en base64, listo para el visor. Si la minuta no devuelve un
   * PDF válido, el observable falla con un ErrorMinuta que ya trae el mensaje
   * para el usuario. Funciona igual si la minuta responde HTTP 200 con el
   * resultado en Status o si responde el código HTTP real con el mismo cuerpo.
   */
  getMinutaPdf(idContrato: number): Observable<string> {
    this.requestManager.setPath('MINUTA_CONTRACTUAL_MID_SERVICE');
    return this.requestManager.get<unknown>(`minutas/contratos/${idContrato}`).pipe(
      catchError((error: unknown) => {
        const cuerpo = cuerpoDeError(error);
        return cuerpo ? of(cuerpo) : throwError(() => errorDeConexion(error));
      }),
      map((cuerpo) => pdfDeRespuesta(cuerpo)),
    );
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

/** Sobre de la minuta: objeto con Status numérico (o texto numérico). */
function esSobreMinuta(valor: unknown): valor is RespuestaMinuta {
  if (!valor || typeof valor !== 'object') return false;
  const status = (valor as { Status?: unknown }).Status;
  return (
    (typeof status === 'number' || typeof status === 'string') &&
    status !== '' &&
    Number.isFinite(Number(status))
  );
}

/**
 * Con códigos HTTP reales el sobre llega en HttpErrorResponse.error. Un JSON de
 * error sin sobre (p. ej. el de Nest) se interpreta por el código HTTP. Devuelve
 * null si no hay JSON (HTML del gateway, red caída, cuerpo ilegible).
 */
function cuerpoDeError(error: unknown): RespuestaMinuta | null {
  if (!(error instanceof HttpErrorResponse)) return null;
  const cuerpo: unknown = error.error;
  if (esSobreMinuta(cuerpo)) {
    // Un sobre con Status 200 dentro de un error HTTP es incoherente: manda el HTTP.
    return Number(cuerpo.Status) === 200 ? { ...cuerpo, Status: error.status } : cuerpo;
  }
  if (error.status >= 400 && cuerpo !== null && typeof cuerpo === 'object') {
    return { Success: false, Status: error.status, Message: '' };
  }
  return null;
}

function errorDeConexion(error: unknown): ErrorMinuta {
  const status = error instanceof HttpErrorResponse && error.status > 0 ? error.status : null;
  return errorMinuta(status, 'conexion', MENSAJES_MINUTA.conexion, true);
}

/** Interpreta el sobre: devuelve el base64 del PDF o lanza un ErrorMinuta. */
function pdfDeRespuesta(cuerpo: unknown): string {
  // Texto en lugar de JSON (p. ej. una página HTML del gateway).
  if (typeof cuerpo === 'string') {
    throw errorMinuta(null, 'conexion', MENSAJES_MINUTA.conexion, true);
  }
  if (!esSobreMinuta(cuerpo)) {
    throw errorMinuta(null, 'invalida', MENSAJES_MINUTA.invalida, true);
  }
  const status = Number(cuerpo.Status);
  const mensaje = typeof cuerpo.Message === 'string' ? cuerpo.Message : '';

  switch (status) {
    case 200: {
      const pdf = base64DePdf(cuerpo.Data);
      if (pdf) return pdf;
      throw errorMinuta(status, 'invalida', MENSAJES_MINUTA.invalida, true);
    }
    case 400:
      throw errorMinuta(status, 'parametro', MENSAJES_MINUTA.parametro, false);
    case 404:
      throw PATRONES_MENSAJE_MINUTA.sinPlantilla.test(mensaje)
        ? errorMinuta(status, 'sin-plantilla', MENSAJES_MINUTA.sinPlantilla, false)
        : errorMinuta(status, 'no-encontrado', MENSAJES_MINUTA.noEncontrado, false);
    case 422: {
      const faltantes = faltantesDelMensaje(mensaje);
      const legibles = faltantes.map((f) => NOMBRES_FALTANTES_MINUTA[f] ?? f);
      const error = errorMinuta(status, 'faltan-datos', MENSAJES_MINUTA.faltanDatos(legibles), true);
      throw { ...error, faltantes };
    }
    case 502: {
      const servicio = PATRONES_MENSAJE_MINUTA.servicio.exec(mensaje)?.[1];
      const error = errorMinuta(status, 'servicio', MENSAJES_MINUTA.servicio(servicio), true);
      throw servicio ? { ...error, servicio } : error;
    }
    default:
      throw errorMinuta(status, 'interno', MENSAJES_MINUTA.interno, true);
  }
}

function errorMinuta(
  status: number | null,
  tipo: TipoErrorMinuta,
  mensaje: string,
  reintentable: boolean,
): ErrorMinuta {
  return { status, tipo, mensaje, reintentable };
}

/** "Faltan datos: ordenador, clausulas" → ['ordenador', 'clausulas']. */
function faltantesDelMensaje(mensaje: string): string[] {
  const lista = PATRONES_MENSAJE_MINUTA.faltantes.exec(mensaje)?.[1] ?? '';
  return lista
    .split(',')
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

/**
 * Base64 limpio si `data` es un PDF: sin prefijo data URI ni espacios, que
 * decodifica y empieza por %PDF. Si no, null.
 */
function base64DePdf(data: unknown): string | null {
  if (typeof data !== 'string') return null;
  const limpio = data.replace(PREFIJO_DATA_URI, '').replace(/\s+/g, '');
  if (!limpio || limpio.length % 4 !== 0 || !BASE64.test(limpio) || !limpio.startsWith('JVBER')) {
    return null;
  }
  try {
    return atob(limpio).startsWith('%PDF') ? limpio : null;
  } catch {
    return null;
  }
}
