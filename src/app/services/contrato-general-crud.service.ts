import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { RequestManager } from '../managers/requestManager';
import {
  CDPContratoCRUD,
  ApiResponse,
  ContratistaCRUD,
  DocumentoContrato,
  EstadoContrato,
  OrdenadorContratoData,
  SupervisorToSave,
} from '../types/types';
import { ContratoGeneralService } from './crud-beego/contrato-general.service';
import { DisponibilidadPresupuestalService } from './crud-beego/disponibilidad-presupuestal.service';
import { EstadoContratoService } from './crud-beego/estado-contrato.service';
import { EspecificacionTecnicaService } from './crud-beego/especificacion-tecnica.service';
import { OrdenadorContratoService } from './crud-beego/ordenador-contrato.service';
import { SupervisorContratoService } from './crud-beego/supervisor-contrato.service';
import { DocumentoContratoService } from './crud-beego/documento-contrato.service';

/**
 * Fachada de compatibilidad sobre los services por recurso del CRUD Beego v2
 * (src/app/services/crud-beego). Conserva los nombres de los métodos y la forma
 * de las respuestas que esperan hoy los componentes, para no tocarlos. El código
 * nuevo debe usar directamente los services por recurso.
 */
@Injectable({
  providedIn: 'root',
})
export class ContratoGeneralCrudService {
  private readonly contratos = inject(ContratoGeneralService);
  private readonly cdps = inject(DisponibilidadPresupuestalService);
  private readonly estados = inject(EstadoContratoService);
  private readonly especificaciones = inject(EspecificacionTecnicaService);
  private readonly ordenadores = inject(OrdenadorContratoService);
  private readonly supervisores = inject(SupervisorContratoService);
  private readonly documentos = inject(DocumentoContratoService);
  private readonly requestManager = inject(RequestManager);

  get(idContrato: number): Observable<any> {
    return this.contratos.obtener(idContrato);
  }

  post(contrato_general_parcial: any): Observable<any> {
    return this.contratos.crear(contrato_general_parcial);
  }

  put(id_contrato: number, contrato_general_parcial: any): Observable<any> {
    return this.contratos.actualizar(id_contrato, contrato_general_parcial);
  }

  postCdp(cdpData: CDPContratoCRUD): Observable<any> {
    if (!cdpData.contrato_general_id) {
      throw new Error(
        'No se ha especificado el contrato general asociado al CDP'
      );
    }
    return this.cdps.crear(cdpData);
  }

  deleteCdp(id: number): Observable<any> {
    return this.cdps.desactivar(id);
  }

  getCdpContrato(idContrato: number): Observable<any> {
    return this.cdps.listarPorContrato(idContrato);
  }

  /** Objeto del estado actual (sin envoltorio), como lo usan los componentes. */
  getEstadoActual(idContrato: number): Observable<any> {
    return this.estados.actual(idContrato).pipe(map((estado) => estado ?? {}));
  }

  /** Lista de estados del más reciente al más antiguo (sin envoltorio). */
  getEstados(idContrato: number): Observable<any> {
    return this.estados.listarPorContrato(idContrato).pipe(map((respuesta) => respuesta.Data ?? []));
  }

  /** Estado registrado (sin envoltorio). El CRUD lo marca como actual. */
  postEstadoContrato(estado: EstadoContrato): Observable<any> {
    return this.estados.crear(estado).pipe(map((respuesta) => respuesta.Data));
  }

  getEspecificacionesTecnicas(idContrato: number): Observable<any> {
    return this.especificaciones.listarPorContrato(idContrato);
  }

  postEspecificacionTecnica(especificacion: any): Observable<any> {
    return this.especificaciones.crear(especificacion);
  }

  putEspecificacionTecnica(id: number, especificacion: any): Observable<any> {
    return this.especificaciones.actualizar(id, especificacion);
  }

  deleteEspecificacionTecnica(id: number): Observable<any> {
    return this.especificaciones.desactivar(id);
  }

  /** El contratista vive en contrato_general (modelo v2). */
  getContratista(idContrato: number): Observable<ApiResponse<any>> {
    return this.contratos.obtenerContratista(idContrato);
  }

  postContratista(contratistaData: ContratistaCRUD): Observable<any> {
    if (!contratistaData.contrato_general_id) {
      throw new Error(
        'No se ha especificado el contrato general asociado al contratista'
      );
    }
    return this.contratos.guardarContratista(contratistaData.contrato_general_id, contratistaData);
  }

  putContratista(contratistaData: any): Observable<any> {
    if (!contratistaData.contrato_general_id) {
      throw new Error(
        'No se ha especificado el contrato general asociado al contratista'
      );
    }
    return this.contratos.guardarContratista(contratistaData.contrato_general_id, contratistaData);
  }

  /** Documento vigente de un tipo (lista sin envoltorio, el primero es el vigente). */
  getDocumentoActual(
    idContrato: number,
    tipoDocumentoId: number
  ): Observable<any> {
    return this.documentos.vigente(idContrato, tipoDocumentoId);
  }

  /** Documento registrado (sin envoltorio). */
  postDocumentoContrato(documento: DocumentoContrato): Observable<any> {
    return this.documentos.crear(documento).pipe(map((respuesta) => respuesta.Data));
  }

  /**
   * El solicitante vive en contrato_general (modelo v2). Si el contrato aún no lo
   * tiene responde 404, como el CRUD anterior, para que el paso no lo dé por guardado.
   */
  getSolicitante(contratoId: number): Observable<any> {
    return this.contratos.obtenerSolicitante(contratoId).pipe(
      switchMap((respuesta) =>
        respuesta.Data?.sede_solicitante_id || respuesta.Data?.dependencia_solicitante_id
          ? [respuesta]
          : throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Solicitante no encontrado' }))
      )
    );
  }

  postSolicitante(contrato_general_parcial: any): Observable<any> {
    return this.guardarSolicitante(contrato_general_parcial.contrato_general_id, contrato_general_parcial);
  }

  patchSolicitante(id: number, contrato_general_parcial: any): Observable<any> {
    return this.guardarSolicitante(contrato_general_parcial.contrato_general_id ?? id, contrato_general_parcial);
  }

  /** Un solo ordenador activo por contrato: actualiza el existente o lo crea. */
  postOrdenadorContrato(contrato_general_parcial: OrdenadorContratoData): Observable<any> {
    return this.ordenadores.guardar(contrato_general_parcial).pipe(map((respuesta) => respuesta.Data));
  }

  /** Ordenador activo del contrato; sin ordenador responde 404, como el CRUD anterior. */
  gerOrdenadorGuardado(contratoId: number): Observable<any> {
    return this.ordenadores.activo(contratoId).pipe(
      switchMap((ordenador) =>
        ordenador
          ? [{ Success: true, Status: 200, Message: 'Ordenador encontrado', Data: ordenador }]
          : throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Ordenador no encontrado' }))
      )
    );
  }

  getSupervisores(contratoId: number): Observable<any> {
    return this.supervisores.listarPorContrato(contratoId);
  }

  /** Supervisor guardado (sin envoltorio): el paso toma su id para no volver a crearlo. */
  postSupervisor(data: SupervisorToSave): Observable<any> {
    return this.supervisores.crear(data).pipe(map((respuesta) => respuesta.Data));
  }

  /** El CRUD Beego solo expone PUT (parcial). Supervisor guardado sin envoltorio. */
  patchSupervisor(id: number, data: SupervisorToSave): Observable<any> {
    return this.supervisores.actualizar(id, data).pipe(map((respuesta) => respuesta.Data));
  }

  /** "Tipo y Alcance del Control" del paso de supervisores. */
  putTipoControl(contratoId: number, tipoControlId: number): Observable<any> {
    return this.contratos.guardarTipoControl(contratoId, tipoControlId);
  }

  /**
   * Hueco: el CRUD Beego no tiene la consulta por año y sus consumidores (pólizas
   * y actas) están fuera de la #390. Se deja la ruta anterior hasta definir si
   * contrato_general.vigencia_id guarda el año o el id del parámetro (#385).
   */
  getContratosPorVigencia(year: string | null): Observable<any> {
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager.get(`contratos-generales/vigencia/${year}`);
  }

  /** Respuesta sin envoltorio con el id, como la del CRUD anterior. */
  private guardarSolicitante(contratoId: number, solicitante: any): Observable<any> {
    return this.contratos
      .guardarSolicitante(contratoId, solicitante)
      .pipe(map((respuesta) => ({ ...respuesta.Data, id: contratoId })));
  }
}
