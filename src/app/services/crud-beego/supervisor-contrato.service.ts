import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/types/types';
import { CrudBeegoService } from './crud-beego.service';
import { SUPERVISOR_CONTRATO, delContrato } from './recursos';

@Injectable({ providedIn: 'root' })
export class SupervisorContratoService {
  private readonly crud = inject(CrudBeegoService);

  listarPorContrato(contratoId: number): Observable<ApiResponse<any[]>> {
    return this.crud.consultar(SUPERVISOR_CONTRATO, delContrato(contratoId), { sortby: ['Id'], order: ['asc'] });
  }

  crear(supervisor: Record<string, any>): Observable<ApiResponse<any>> {
    return this.crud.crear(SUPERVISOR_CONTRATO, supervisor);
  }

  actualizar(id: number, supervisor: Record<string, any>): Observable<ApiResponse<any>> {
    return this.crud.actualizar(SUPERVISOR_CONTRATO, id, supervisor);
  }
}
