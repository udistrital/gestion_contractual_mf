import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/types/types';
import { CrudBeegoService } from './crud-beego.service';
import { AMPARO_POLIZA, delContrato } from './recursos';

@Injectable({ providedIn: 'root' })
export class AmparoPolizaService {
  private readonly crud = inject(CrudBeegoService);

  listarPorContrato(contratoId: number): Observable<ApiResponse<any[]>> {
    return this.crud.consultar(AMPARO_POLIZA, delContrato(contratoId), { sortby: ['Id'], order: ['asc'] });
  }
}
