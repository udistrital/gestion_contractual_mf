import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RequestManager } from 'src/app/managers/requestManager';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { TercerosCrudService } from 'src/app/services/tercero-crud.service';
import { VigenciaService } from 'src/app/services/vigencia.service';
import { ContratoTablero, USUARIO_ID_GENERICO } from '../types/tablero.models';
import { diasEntre, estadoPorId } from '../utils/tablero.utils';

// Fila de GET tableros/contratos del MID, que la toma del CRUD: solo Ids. El CRUD ya
// calcula el estado actual, la fecha desde la que está en ese estado y el abogado.
interface ContratoTableroCrud {
  contrato_general_id: number;
  numero_contrato: string | null;
  consecutivo_elaboracion: string | null;
  vigencia_id: number | null;
  fecha_final: string | null;
  dependencia_solicitante_id: number | null;
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
  private readonly vigenciaService = inject(VigenciaService);

  // Contratos activos de la vigencia (año; vacía = todas) con su estado actual,
  // dependencia solicitante y abogado que los registró.
  cargarContratos(
    vigencia: string,
    hoy: Date = new Date()
  ): Observable<ContratoTablero[]> {
    return this.vigenciaService.vigenciaId(vigencia).pipe(
      switchMap((vigenciaId) => {
        // Año sin parámetro de vigencia: ningún contrato puede tenerlo
        if (vigenciaId === null) return of([] as ContratoTableroCrud[]);
        const filtro = vigenciaId ? `?vigencia_id=${vigenciaId}` : '';
        this.requestManager.setPath('GESTION_CONTRACTUAL_MID_SERVICE');
        return this.requestManager
          .get<any>(`tableros/contratos${filtro}`)
          .pipe(
            map((res) => {
              // Sin contratos el MID responde Data: []; otra forma es una falla, no un tablero vacío
              if (!Array.isArray(res?.Data)) throw new Error('Respuesta inválida de tableros/contratos');
              return res.Data as ContratoTableroCrud[];
            })
          );
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

  private mapear(
    c: ContratoTableroCrud,
    vigencia: string,
    hoy: Date
  ): ContratoTablero {
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
      dependencia: '',
      abogadoId,
      abogado: '',
    };
  }

  private nombresDependencias(contratos: ContratoTablero[]): Observable<Map<number, string>> {
    if (!contratos.some((c) => c.dependenciaId != null)) return of(new Map());
    // Si el MID falla se propaga el error: sin nombres el tablero quedaría incompleto
    return this.contratoMidService.getDependencias().pipe(
      map((lista) => new Map(lista.map((d) => [Number(d.id), d.nombre] as [number, string])))
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
