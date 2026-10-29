import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/types/types';
import { CrudBeegoService } from './crud-beego.service';
import { DISPONIBILIDAD_PRESUPUESTAL, delContrato } from './recursos';

@Injectable({ providedIn: 'root' })
export class DisponibilidadPresupuestalService {
  private readonly crud = inject(CrudBeegoService);

  listarPorContrato(contratoId: number): Observable<ApiResponse<any[]>> {
    return this.crud.consultar(DISPONIBILIDAD_PRESUPUESTAL, delContrato(contratoId));
  }

  /** valor_a_tomar no existe en el modelo v2 y no se envía. */
  crear(cdp: Record<string, any>): Observable<ApiResponse<any>> {
    return this.crud.crear(DISPONIBILIDAD_PRESUPUESTAL, cdp);
  }

  desactivar(id: number): Observable<ApiResponse<any>> {
    return this.crud.desactivar(DISPONIBILIDAD_PRESUPUESTAL, id);
  }
}
