import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiResponse, ContratoGeneral } from 'src/app/types/types';
import { CrudBeegoService } from './crud-beego.service';
import { CONTRATO_GENERAL, CONVENIO } from './recursos';

/** Contratista del contrato: en el modelo v2 vive en contrato_general. */
export interface ContratistaContrato {
  id: number;
  numero_documento: string;
  tipo_persona_id: number | null;
  clase_proveedor_id: number | null;
}

/** Solicitante del contrato: en el modelo v2 vive en contrato_general. */
export interface SolicitanteContrato {
  id: number;
  sede_solicitante_id: number | null;
  dependencia_solicitante_id: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ContratoGeneralService {
  private readonly crud = inject(CrudBeegoService);

  obtener(id: number): Observable<ApiResponse<ContratoGeneral>> {
    return this.crud.obtener<ContratoGeneral>(CONTRATO_GENERAL, id);
  }

  crear(datos: Record<string, any>): Observable<ApiResponse<ContratoGeneral>> {
    return this.crud
      .crear<ContratoGeneral>(CONTRATO_GENERAL, datos)
      .pipe(switchMap((respuesta) => this.guardarConvenio(respuesta, datos)));
  }

  /** PUT parcial: solo cambian los campos enviados. */
  actualizar(id: number, datos: Record<string, any>): Observable<ApiResponse<ContratoGeneral>> {
    return this.crud
      .actualizar<ContratoGeneral>(CONTRATO_GENERAL, id, datos)
      .pipe(switchMap((respuesta) => this.guardarConvenio(respuesta, datos)));
  }

  obtenerContratista(contratoId: number): Observable<ApiResponse<ContratistaContrato | null>> {
    return this.obtener(contratoId).pipe(
      map((respuesta) => {
        const contrato: any = respuesta.Data;
        const contratista = contrato?.proveedor_numero_documento
          ? {
              id: contrato.id,
              numero_documento: contrato.proveedor_numero_documento,
              tipo_persona_id: contrato.tipo_persona_id ?? null,
              clase_proveedor_id: contrato.clase_proveedor_id ?? null,
            }
          : null;
        return { ...respuesta, Success: respuesta.Success && !!contratista, Data: contratista };
      })
    );
  }

  guardarContratista(
    contratoId: number,
    contratista: { numero_documento: string; tipo_persona_id?: number; clase_proveedor_id?: number }
  ): Observable<ApiResponse<ContratoGeneral>> {
    return this.actualizar(contratoId, {
      proveedor_numero_documento: contratista.numero_documento,
      tipo_persona_id: contratista.tipo_persona_id,
      clase_proveedor_id: contratista.clase_proveedor_id,
    });
  }

  obtenerSolicitante(contratoId: number): Observable<ApiResponse<SolicitanteContrato>> {
    return this.obtener(contratoId).pipe(
      map((respuesta) => {
        const contrato: any = respuesta.Data;
        return {
          ...respuesta,
          Data: {
            id: contrato?.id,
            sede_solicitante_id: contrato?.sede_solicitante_id ?? null,
            dependencia_solicitante_id: contrato?.dependencia_solicitante_id ?? null,
          },
        };
      })
    );
  }

  guardarSolicitante(
    contratoId: number,
    solicitante: { sede_solicitante_id: number; dependencia_solicitante_id: number }
  ): Observable<ApiResponse<ContratoGeneral>> {
    return this.actualizar(contratoId, {
      sede_solicitante_id: solicitante.sede_solicitante_id,
      dependencia_solicitante_id: solicitante.dependencia_solicitante_id,
    });
  }

  /** "Tipo y Alcance del Control" (paso de supervisores) se guarda en el contrato. */
  guardarTipoControl(contratoId: number, tipoControlId: number): Observable<ApiResponse<ContratoGeneral>> {
    return this.actualizar(contratoId, { tipo_control_id: tipoControlId });
  }

  /**
   * Si el paso 1 envía datos de convenio, se guardan en /v1/convenio/ (uno por
   * contrato: se actualiza el activo o se crea). Devuelve la respuesta del contrato.
   */
  private guardarConvenio(
    respuesta: ApiResponse<ContratoGeneral>,
    datos: Record<string, any>
  ): Observable<ApiResponse<ContratoGeneral>> {
    const contratoId = respuesta.Data?.id;
    const tieneConvenio = [datos['nombre_convenio'], datos['convenio'], datos['vigencia_convenio']].some(
      (valor) => valor !== undefined && valor !== null && valor !== ''
    );
    if (!respuesta.Success || !contratoId || !tieneConvenio) {
      return of(respuesta);
    }
    const convenio = {
      contrato_general_id: contratoId,
      nombre: datos['nombre_convenio'],
      vigencia: datos['vigencia_convenio'],
      tipo_convenio_id: datos['convenio'],
    };
    return this.crud
      .consultar<{ id: number }>(CONVENIO, { 'ContratoGeneralId.Id': contratoId, Activo: true }, { limit: 1 })
      .pipe(
        switchMap((existentes) => {
          const actual = existentes.Data?.[0];
          return actual
            ? this.crud.actualizar(CONVENIO, actual.id, convenio)
            : this.crud.crear(CONVENIO, convenio);
        }),
        map(() => respuesta)
      );
  }
}
