import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class VigenciaService {
  private readonly parametrosService = inject(ParametrosService);

  // Id del parámetro de vigencia (Parámetros CRUD) de cada año ya consultado
  private readonly vigenciasId = new Map<string, number>();

  // contrato_general.vigencia_id guarda el Id del parámetro del tipo Vigencia
  // (environment.VIGENCIA_ID) de Parámetros CRUD, cuyo Nombre es el año.
  // '' = todas (0, sin filtro); null = el año no tiene parámetro.
  vigenciaId(anio: string): Observable<number | null> {
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
          if (!Number.isInteger(id) || id <= 0) return null;
          this.vigenciasId.set(anio, id);
          return id;
        })
      );
  }

  // Provisional: la vigencia del contrato es el año actual (#397, pregunta 2).
  vigenciaActualId(): Observable<number | null> {
    return this.vigenciaId(String(new Date().getFullYear()));
  }
}
