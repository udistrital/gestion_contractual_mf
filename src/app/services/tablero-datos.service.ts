import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RequestManager } from 'src/app/managers/requestManager';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { TercerosCrudService } from 'src/app/services/tercero-crud.service';
import { environment } from 'src/environments/environment';
import { ContratoTablero, USUARIO_ID_GENERICO } from '../types/tablero.models';
import { diasEntre, estadoPorId } from '../utils/tablero.utils';

// Fila de GET v1/tableros/contratos del CRUD Beego v2: solo Ids. El CRUD ya
// calcula el estado actual, la fecha desde la que está en ese estado y el abogado.
interface ContratoTableroCrud {
  contrato_general_id: number;
  numero_contrato: string | null;
  consecutivo_elaboracion: string | null;
  vigencia_id: number | null;
  fecha_final: string | null;
  dependencia_solicitante_id: number | null;
  sede_solicitante_id: number | null;
  estado_parametro_id: number | null;
  fecha_estado: string | null;
  abogado_id: number | null;
}

const SIN_DEPENDENCIA = 'Sin dependencia registrada';
const SIN_ABOGADO = 'Sin identificar';

@Injectable({ providedIn: 'root' })
export class TableroDatosService {
  private readonly requestManager = inject(RequestManager);
  private readonly contratoMidService = inject(ContratoGeneralMidService);
  private readonly tercerosService = inject(TercerosCrudService);
  private readonly parametrosService = inject(ParametrosService);

  // Id del parámetro de vigencia (Parámetros CRUD) de cada año ya consultado
  private readonly vigenciasId = new Map<string, number | null>();

  // Contratos activos de la vigencia (año; vacía = todas) con su estado actual,
  // dependencia solicitante y abogado que los registró.
  cargarContratos(
    vigencia: string,
    hoy: Date = new Date()
  ): Observable<ContratoTablero[]> {
    return this.vigenciaId(vigencia).pipe(
      switchMap((vigenciaId) => {
        // Año sin parámetro de vigencia: ningún contrato puede tenerlo
        if (vigenciaId === null) return of([] as ContratoTableroCrud[]);
        const filtro = vigenciaId ? `?vigencia-id=${vigenciaId}` : '';
        this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
        return this.requestManager
          .get<any>(`v1/tableros/contratos${filtro}`)
          .pipe(map((res) => (Array.isArray(res?.Data) ? (res.Data as ContratoTableroCrud[]) : [])));
      }),
      map((data) => data.map((c) => this.mapear(c, vigencia, hoy))),
      switchMap((contratos) =>
        forkJoin({
          dependencias: this.nombresDependencias(contratos),
          abogados: this.nombresAbogados(contratos),
        }).pipe(
          map(({ dependencias, abogados }) =>
            contratos.map((c) => ({
              ...c,
              dependencia:
                c.dependenciaId != null
                  ? dependencias.get(c.dependenciaId) ?? `Dependencia ${c.dependenciaId}`
                  : SIN_DEPENDENCIA,
              abogado:
                c.abogadoId != null
                  ? abogados.get(c.abogadoId) ?? `Abogado ${c.abogadoId}`
                  : SIN_ABOGADO,
            }))
          )
        )
      )
    );
  }

  // contrato_general.vigencia_id guarda el Id del parámetro del tipo Vigencia
  // (environment.VIGENCIA_ID) de Parámetros CRUD, cuyo Nombre es el año.
  // '' = todas (0, sin filtro); null = el año no tiene parámetro.
  private vigenciaId(anio: string): Observable<number | null> {
    if (!anio) return of(0);
    if (!/^\d{4}$/.test(anio)) return of(null);
    if (this.vigenciasId.has(anio)) return of(this.vigenciasId.get(anio)!);
    return this.parametrosService
      .get<any>(
        `parametro?query=TipoParametroId:${environment.VIGENCIA_ID},Nombre:${anio}&fields=Id&limit=1`
      )
      .pipe(
        map((res) => {
          const id = Number(res?.Data?.[0]?.Id);
          const vigenciaId = Number.isInteger(id) && id > 0 ? id : null;
          this.vigenciasId.set(anio, vigenciaId);
          return vigenciaId;
        })
      );
  }

  private mapear(
    c: ContratoTableroCrud,
    vigencia: string,
    hoy: Date
  ): ContratoTablero & { sedeId: number | null } {
    const abogadoId =
      c.abogado_id != null && c.abogado_id !== USUARIO_ID_GENERICO ? c.abogado_id : null;

    return {
      id: c.contrato_general_id,
      numero: c.numero_contrato || c.consecutivo_elaboracion || `#${c.contrato_general_id}`,
      vigencia,
      estado: estadoPorId(c.estado_parametro_id),
      // El CRUD guarda la hora de Bogotá sin zona: se lee como hora local
      diasEnEstado: c.fecha_estado
        ? Math.max(0, diasEntre(new Date(c.fecha_estado.substring(0, 19)), hoy))
        : 0,
      fechaFinal: c.fecha_final ? new Date(`${c.fecha_final.substring(0, 10)}T00:00:00`) : null,
      dependenciaId: c.dependencia_solicitante_id ?? null,
      sedeId: c.sede_solicitante_id ?? null,
      dependencia: '',
      abogadoId,
      abogado: '',
    };
  }

  private nombresDependencias(
    contratos: Array<ContratoTablero & { sedeId: number | null }>
  ): Observable<Map<number, string>> {
    const sedes = [...new Set(contratos.map((c) => c.sedeId).filter((s): s is number => s != null))];
    if (!sedes.length) return of(new Map());
    return forkJoin(
      sedes.map((sede) =>
        this.contratoMidService.getDependenciasBySede(sede).pipe(catchError(() => of([])))
      )
    ).pipe(
      map((listas) => new Map(listas.flat().map((d) => [Number(d.id), d.nombre] as [number, string])))
    );
  }

  private nombresAbogados(contratos: ContratoTablero[]): Observable<Map<number, string>> {
    const ids = [...new Set(contratos.map((c) => c.abogadoId).filter((id): id is number => id != null))];
    if (!ids.length) return of(new Map());
    return forkJoin(
      ids.map((id) =>
        this.tercerosService.getTerceroPorId(id).pipe(
          map((t: any) => (t?.NombreCompleto ?? t?.Data?.NombreCompleto ?? '') as string),
          catchError(() => of(''))
        )
      )
    ).pipe(
      map((nombres) => {
        const mapa = new Map<number, string>();
        ids.forEach((id, k) => {
          if (nombres[k]) mapa.set(id, nombres[k].trim());
        });
        return mapa;
      })
    );
  }
}
