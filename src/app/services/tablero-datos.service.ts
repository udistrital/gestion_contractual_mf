import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RequestManager } from 'src/app/managers/requestManager';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { TercerosCrudService } from 'src/app/services/tercero-crud.service';
import { ContratoTablero, USUARIO_ID_GENERICO } from '../types/tablero.models';
import { diasEntre, estadoPorId } from '../utils/tablero.utils';

interface EstadoCrud {
  estado_parametro_id: number;
  actual: boolean;
  usuario_id: number;
  usuario_rol: string;
  fecha_creacion: string;
}

interface ContratoCrud {
  id: number;
  numero_contrato: string | null;
  consecutivo_elaboracion: string | null;
  vigencia: string;
  fecha_final: string | null;
  estados?: EstadoCrud | EstadoCrud[];
  solicitante?: {
    dependencia_solicitante_id: number;
    sede_solicitante_id: number;
  } | null;
}

// Solo los campos que usa el tablero, para no traer textos largos del contrato
const CAMPOS = [
  'id',
  'numero_contrato',
  'consecutivo_elaboracion',
  'vigencia',
  'fecha_final',
  'estados.id',
  'estados.estado_parametro_id',
  'estados.actual',
  'estados.usuario_id',
  'estados.usuario_rol',
  'estados.fecha_creacion',
  'solicitante.id',
  'solicitante.dependencia_solicitante_id',
  'solicitante.sede_solicitante_id',
].join(',');

const SIN_DEPENDENCIA = 'Sin dependencia registrada';
const SIN_ABOGADO = 'Sin identificar';

@Injectable({ providedIn: 'root' })
export class TableroDatosService {
  private readonly requestManager = inject(RequestManager);
  private readonly contratoMidService = inject(ContratoGeneralMidService);
  private readonly tercerosService = inject(TercerosCrudService);

  // Contratos activos de la vigencia (vacía = todas) con su estado actual,
  // dependencia solicitante y abogado que los registró.
  cargarContratos(
    vigencia: string,
    hoy: Date = new Date()
  ): Observable<ContratoTablero[]> {
    const query = JSON.stringify(vigencia ? { activo: true, vigencia } : { activo: true });
    this.requestManager.setPath('GESTION_CONTRACTUAL_CRUD_SERVICE');
    return this.requestManager
      .get<any>(
        `contratos-generales?include=estados,solicitante&fields=${CAMPOS}` +
          `&query=${encodeURIComponent(query)}&limit=0`
      )
      .pipe(
        map((res) => (Array.isArray(res?.Data) ? (res.Data as ContratoCrud[]) : [])),
        map((data) => data.map((c) => this.mapear(c, hoy))),
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

  private mapear(c: ContratoCrud, hoy: Date): ContratoTablero & { sedeId: number | null } {
    // El CRUD devuelve un objeto cuando la relación tiene un solo elemento
    const estados = (Array.isArray(c.estados) ? c.estados : c.estados ? [c.estados] : [])
      .slice()
      .sort((a, b) => +new Date(a.fecha_creacion) - +new Date(b.fecha_creacion));

    let i = estados.findIndex((e) => e.actual);
    if (i < 0) i = estados.length - 1;
    const actual = estados[i];

    // Fecha en que el contrato entró al estado general actual
    let desde = actual;
    while (actual && i > 0 && estados[i - 1].estado_parametro_id === actual.estado_parametro_id) {
      desde = estados[--i];
    }

    const registro = estados.find((e) =>
      (e.usuario_rol || '').toUpperCase().startsWith('ABOGADO')
    );
    const abogadoId =
      registro && registro.usuario_id !== USUARIO_ID_GENERICO ? registro.usuario_id : null;

    return {
      id: c.id,
      numero: c.numero_contrato || c.consecutivo_elaboracion || `#${c.id}`,
      vigencia: c.vigencia,
      estado: actual ? estadoPorId(actual.estado_parametro_id) : null,
      diasEnEstado: desde ? Math.max(0, diasEntre(new Date(desde.fecha_creacion), hoy)) : 0,
      fechaFinal: c.fecha_final ? new Date(`${c.fecha_final.substring(0, 10)}T00:00:00`) : null,
      dependenciaId: c.solicitante?.dependencia_solicitante_id ?? null,
      sedeId: c.solicitante?.sede_solicitante_id ?? null,
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
