import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, EspecificacionTecnica } from 'src/app/types/types';
import { CrudBeegoService } from './crud-beego.service';
import { ESPECIFICACION_TECNICA, delContrato } from './recursos';

@Injectable({ providedIn: 'root' })
export class EspecificacionTecnicaService {
  private readonly crud = inject(CrudBeegoService);

  listarPorContrato(contratoId: number): Observable<ApiResponse<EspecificacionTecnica[]>> {
    return this.crud.consultar<EspecificacionTecnica>(ESPECIFICACION_TECNICA, delContrato(contratoId));
  }

  crear(especificacion: Record<string, any>): Observable<ApiResponse<EspecificacionTecnica>> {
    return this.crud.crear<EspecificacionTecnica>(ESPECIFICACION_TECNICA, especificacion);
  }

  actualizar(id: number, especificacion: Record<string, any>): Observable<ApiResponse<EspecificacionTecnica>> {
    return this.crud.actualizar<EspecificacionTecnica>(ESPECIFICACION_TECNICA, id, especificacion);
  }

  desactivar(id: number): Observable<ApiResponse<EspecificacionTecnica>> {
    return this.crud.desactivar<EspecificacionTecnica>(ESPECIFICACION_TECNICA, id);
  }
}
