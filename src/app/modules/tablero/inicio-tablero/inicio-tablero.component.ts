import { Component, Injector, OnInit, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { from, of, timer } from 'rxjs';
import { catchError, concatMap, filter, first, map, switchMap, take, tap } from 'rxjs/operators';
import { ParametrosService } from 'src/app/services/parametros.service';
import { ImplicitAutenticationService } from 'src/app/services/implicit_autentication.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { TableroDatosService } from '../../../services/tablero-datos.service';
import { ContratoTablero, RolTablero } from '../../../types/tablero.models';
import { agruparPor, calcularAlertas, contarPorEstado, rolTablero } from '../../../utils/tablero.utils';
import { CLAVE_OTRAS, dependenciasMenores } from '../treemap-dependencias/treemap-dependencias.component';

// Página de inicio de ARGO: estadísticas de contratación según el rol del usuario
@Component({
  selector: 'app-inicio-tablero',
  templateUrl: './inicio-tablero.component.html',
  styleUrls: ['../tablero-tokens.css', './inicio-tablero.component.css'],
  standalone: false,
  // Instancias propias del tablero: se crean cuando ya existe la sesión (ver ngOnInit)
  providers: [RolService, ImplicitAutenticationService],
})
export class InicioTableroComponent implements OnInit {
  private readonly injector = inject(Injector);
  private readonly userService = inject(UserService);
  private readonly parametrosService = inject(ParametrosService);
  private readonly datos = inject(TableroDatosService);

  private readonly anioActual = String(new Date().getFullYear());

  // undefined mientras se cargan los roles; null si el rol no tiene tablero
  readonly rol = signal<RolTablero | null | undefined>(undefined);
  readonly vigencia = signal(this.anioActual);
  readonly vigencias = signal<string[]>(this.vigenciasPorDefecto());
  readonly dependenciaSeleccionada = signal<string | null>(null);
  readonly cargando = signal(false);
  readonly error = signal(false);

  private readonly consulta = computed(() => (this.rol() ? this.vigencia() : null));

  private readonly contratos = toSignal(
    toObservable(this.consulta).pipe(
      filter((vigencia): vigencia is string => vigencia !== null),
      tap(() => {
        this.cargando.set(true);
        this.error.set(false);
        this.dependenciaSeleccionada.set(null);
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

  // El core guarda persona_id poco después de iniciar sesión; se reintenta hasta 1 minuto
  readonly personaId = toSignal(
    timer(0, 500).pipe(
      take(120),
      concatMap(() => from(this.userService.getPersonaId()).pipe(catchError(() => of(null)))),
      first((id) => id !== null, null)
    ),
    { initialValue: null }
  );

  // Contratos que le corresponden al usuario: todos para el jefe, los propios para el abogado
  readonly propios = computed(() =>
    this.rol() === 'ABOGADO'
      ? this.contratos().filter((c) => c.abogadoId !== null && c.abogadoId === this.personaId())
      : this.contratos()
  );

  readonly gruposDependencias = computed(() =>
    agruparPor(
      this.propios(),
      (c) => this.claveDependencia(c),
      (c) => c.dependencia
    )
  );

  private readonly filtrar = (lista: ContratoTablero[]) => {
    const dep = this.dependenciaSeleccionada();
    if (dep === null) return lista;
    // "Otras" filtra por todas las dependencias agrupadas en ese bloque del treemap
    const claves =
      dep === CLAVE_OTRAS
        ? new Set(dependenciasMenores(this.gruposDependencias()).map((g) => g.clave))
        : new Set([dep]);
    return lista.filter((c) => claves.has(this.claveDependencia(c)));
  };

  readonly propiosFiltrados = computed(() => this.filtrar(this.propios()));
  readonly todosFiltrados = computed(() => this.filtrar(this.contratos()));
  readonly conteo = computed(() => contarPorEstado(this.propiosFiltrados()));
  readonly alertas = computed(() => calcularAlertas(this.propiosFiltrados(), new Date()));

  // Alertas de cada dependencia sin filtro, para mostrarlas en el detalle de "Otras"
  readonly alertasPorDependencia = computed(() => {
    const conteo: Record<string, number> = {};
    calcularAlertas(this.propios(), new Date()).forEach((a) => {
      const clave = this.claveDependencia(a.contrato);
      conteo[clave] = (conteo[clave] ?? 0) + 1;
    });
    return conteo;
  });

  readonly nombreDependencia = computed(() => {
    const dep = this.dependenciaSeleccionada();
    if (dep === CLAVE_OTRAS) return 'Otras dependencias';
    return this.gruposDependencias().find((g) => g.clave === dep)?.nombre ?? null;
  });

  readonly detalleTotal = computed(() => {
    const base = `Vigencia ${this.vigencia()}`;
    const dep = this.nombreDependencia();
    const sufijo = this.rol() === 'ABOGADO' ? ' · asignados a mí' : '';
    return dep ? `${base}${sufijo} · ${dep}` : `${base}${sufijo}`;
  });

  ngOnInit(): void {
    // En el primer inicio de sesión el core guarda el usuario en localStorage después de
    // que este MF arranca. Solo en ese caso se revisa localStorage (sin llamar al servidor)
    // hasta que aparezca; después se crea el RolService del tablero, que ya lo encuentra.
    timer(0, 500)
      .pipe(
        take(60),
        first(() => !!localStorage.getItem('user'), null),
        switchMap(() => {
          const rolService = this.injector.get(RolService);
          return from(rolService.cargarRol()).pipe(map(() => rolService.getRol()));
        }),
        catchError(() => of([] as string[]))
      )
      .subscribe((roles) => this.rol.set(rolTablero(roles)));

    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${environment.VIGENCIA_ID},Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .pipe(catchError(() => of(null)))
      .subscribe((res: any) => {
        const nombres: string[] = (res?.Data ?? [])
          .map((v: any) => String(v?.Nombre ?? ''))
          .filter((v: string) => /^\d{4}$/.test(v));
        if (nombres.length) {
          this.vigencias.set([...new Set([this.anioActual, ...nombres])].sort().reverse());
        }
      });
  }

  cambiarVigencia(vigencia: string): void {
    this.vigencia.set(vigencia);
  }

  seleccionarDependencia(clave: string | null): void {
    this.dependenciaSeleccionada.set(clave);
  }

  private claveDependencia(c: ContratoTablero): string {
    return c.dependenciaId === null ? 'sin-dependencia' : String(c.dependenciaId);
  }

  private vigenciasPorDefecto(): string[] {
    const anio = new Date().getFullYear();
    return [0, 1, 2].map((i) => String(anio - i));
  }
}
