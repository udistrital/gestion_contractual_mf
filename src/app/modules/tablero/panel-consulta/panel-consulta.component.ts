import { Component, computed, inject, input, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { from, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { UserService } from 'src/app/services/user.service';
import { TableroDatosService } from '../../../services/tablero-datos.service';
import { ContratoTablero, RolTablero } from '../../../types/tablero.models';
import { calcularAlertas, contarPorEstado } from '../../../utils/tablero.utils';

// Tarjetas de resumen y alertas de la pestaña Consultar contratos
@Component({
  selector: 'app-panel-consulta',
  templateUrl: './panel-consulta.component.html',
  styleUrls: ['../tablero-tokens.css', './panel-consulta.component.css'],
  standalone: false,
})
export class PanelConsultaComponent {
  readonly vigencia = input<string>('');
  readonly rol = input.required<RolTablero>();
  readonly estadoActivo = input<string | null>(null);
  readonly seleccionarEstado = output<string>();

  private readonly datos = inject(TableroDatosService);
  private readonly userService = inject(UserService);

  readonly cargando = signal(false);
  readonly error = signal(false);

  private readonly contratos = toSignal(
    toObservable(this.vigencia).pipe(
      tap(() => {
        this.cargando.set(true);
        this.error.set(false);
      }),
      switchMap((vigencia) =>
        this.datos.cargarContratos(vigencia).pipe(
          catchError(() => {
            this.error.set(true);
            return of([] as ContratoTablero[]);
          })
        )
      ),
      tap(() => this.cargando.set(false))
    ),
    { initialValue: [] as ContratoTablero[] }
  );

  private readonly personaId = toSignal(
    from(this.userService.getPersonaId()).pipe(catchError(() => of(null))),
    { initialValue: null }
  );

  readonly visibles = computed(() =>
    this.rol() === 'ABOGADO'
      ? this.contratos().filter((c) => c.abogadoId !== null && c.abogadoId === this.personaId())
      : this.contratos()
  );

  readonly conteo = computed(() => contarPorEstado(this.visibles()));
  readonly alertas = computed(() => calcularAlertas(this.visibles(), new Date()));

  readonly detalleTotal = computed(() => {
    const vigencia = this.vigencia() ? `Vigencia ${this.vigencia()}` : 'Todas las vigencias';
    return this.rol() === 'ABOGADO' ? `${vigencia} · asignados a mí` : vigencia;
  });
}
