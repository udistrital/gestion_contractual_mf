import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from 'src/app/types/types';
import { CrudBeegoService } from './crud-beego.service';
import { ESTADO_CONTRATO, delContrato, RECIENTE_PRIMERO } from './recursos';

@Injectable({ providedIn: 'root' })
export class EstadoContratoService {
  private readonly crud = inject(CrudBeegoService);

  listarPorContrato(contratoId: number): Observable<ApiResponse<any[]>> {
    return this.crud.consultar(ESTADO_CONTRATO, delContrato(contratoId), RECIENTE_PRIMERO);
  }

  /** Estado actual: el CRUD marca Actual al registrar uno nuevo. */
  actual(contratoId: number): Observable<any | null> {
    return this.crud
      .consultar(ESTADO_CONTRATO, { ...delContrato(contratoId), Actual: true }, { ...RECIENTE_PRIMERO, limit: 1 })
      .pipe(map((respuesta) => respuesta.Data?.[0] ?? null));
  }

  crear(estado: Record<string, any>): Observable<ApiResponse<any>> {
    return this.crud.crear(ESTADO_CONTRATO, estado);
  }
}
