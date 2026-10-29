import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiResponse, OrdenadorContratoData } from 'src/app/types/types';
import { CrudBeegoService } from './crud-beego.service';
import { ORDENADOR_CONTRATO, delContrato, RECIENTE_PRIMERO } from './recursos';

@Injectable({ providedIn: 'root' })
export class OrdenadorContratoService {
  private readonly crud = inject(CrudBeegoService);

  /** Ordenador activo más reciente del contrato, o null. */
  activo(contratoId: number): Observable<OrdenadorContratoData & { id: number } | null> {
    return this.crud
      .consultar<OrdenadorContratoData & { id: number }>(ORDENADOR_CONTRATO, delContrato(contratoId), {
        ...RECIENTE_PRIMERO,
        limit: 1,
      })
      .pipe(map((respuesta) => respuesta.Data?.[0] ?? null));
  }

  /** Un solo ordenador por contrato: actualiza el activo o, si no hay, lo crea. */
  guardar(ordenador: OrdenadorContratoData): Observable<ApiResponse<OrdenadorContratoData>> {
    return this.activo(ordenador.contrato_general_id as number).pipe(
      switchMap((actual) =>
        actual
          ? this.crud.actualizar<OrdenadorContratoData>(ORDENADOR_CONTRATO, actual.id, ordenador)
          : this.crud.crear<OrdenadorContratoData>(ORDENADOR_CONTRATO, ordenador)
      )
    );
  }
}
