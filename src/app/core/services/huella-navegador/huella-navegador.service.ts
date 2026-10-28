import {
  HttpClient,
  HttpContext,
  HttpHeaders,
} from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OMITIR_SPINNER } from 'src/app/core/intercerptors/spinner.interceptor';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import {
  EstadoHuella,
  HuellaNavegadorPayload,
  ResultadoHuella,
} from './huella-navegador.models';
import { PROVEEDOR_HUELLA } from './proveedor-huella.token';

/** Marca compartida por todos los MF del mismo origen: un envío por sesión. */
export const CLAVE_HUELLA_REGISTRADA = 'argo_huella_navegador_registrada';
export const MEDIDA_CALCULO_HUELLA = 'huella-navegador-calculo';
const MARCA_INICIO = 'huella-navegador-inicio';
const MARCA_FIN = 'huella-navegador-fin';
const TIMEOUT_IDLE_MS = 5000;
const RETARDO_SIN_IDLE_MS = 2000;
const TIMEOUT_ROL_MS = 5000;
const LONGITUD_USER_AGENT = 512;
const LONGITUD_RUTA = 255;
const LONGITUD_ROL = 40;

/**
 * Calcula la huella digital del navegador y la registra en
 * gestion_contractual_crud una vez por sesión, en segundo plano y sin afectar
 * al usuario: no muestra spinner ni alertas y no lanza errores.
 */
@Injectable({
  providedIn: 'root',
})
export class HuellaNavegadorService {
  private readonly http = inject(HttpClient);
  private readonly proveedor = inject(PROVEEDOR_HUELLA);
  private readonly userService = inject(UserService);
  private readonly rolService = inject(RolService);
  private readonly config = environment.HUELLA_NAVEGADOR;

  private readonly estadoActual = signal<EstadoHuella>('inactivo');
  private readonly huellaActual = signal<string | null>(null);
  readonly estado = this.estadoActual.asReadonly();
  readonly huella = this.huellaActual.asReadonly();

  private readonly abortController = new AbortController();
  private idleId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private suscripcion: Subscription | null = null;
  private destruido = false;

  constructor() {
    // En single-spa el injector del MF se destruye en el unmount: se cancela
    // todo lo pendiente para no dejar trabajo ni peticiones huérfanas.
    inject(DestroyRef).onDestroy(() => this.cancelar());
  }

  iniciar(): void {
    if (this.destruido) {
      return;
    }
    if (!this.config.HABILITADO) {
      this.estadoActual.set('inactivo');
      return;
    }
    if (this.registradaEnSesion()) {
      this.estadoActual.set('omitida');
      return;
    }
    const estado = this.estadoActual();
    if (estado === 'pendiente' || estado === 'calculando' || estado === 'enviada') {
      return;
    }

    this.estadoActual.set('pendiente');
    if (typeof requestIdleCallback === 'function') {
      this.idleId = requestIdleCallback(
        () => {
          this.idleId = null;
          void this.registrar();
        },
        { timeout: TIMEOUT_IDLE_MS },
      );
    } else {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        void this.registrar();
      }, RETARDO_SIN_IDLE_MS);
    }
  }

  private async registrar(): Promise<void> {
    if (this.destruido) {
      return;
    }
    this.estadoActual.set('calculando');
    try {
      const ip = this.obtenerIp();
      const rol = this.obtenerRol();
      const resultado = await this.calcularHuella();
      const [direccion_ip, usuario_id, usuario_rol] = await Promise.all([
        ip,
        this.obtenerUsuarioId(),
        rol,
      ]);
      if (this.destruido) {
        return;
      }
      this.huellaActual.set(resultado.huella);
      this.enviar({
        huella: resultado.huella,
        libreria: resultado.libreria,
        version_libreria: resultado.version_libreria,
        confianza: resultado.confianza,
        componentes: resultado.componentes,
        direccion_ip,
        user_agent: navigator.userAgent.slice(0, LONGITUD_USER_AGENT),
        usuario_id,
        usuario_rol,
        microcliente: this.config.MICROCLIENTE,
        ruta: window.location.pathname.slice(0, LONGITUD_RUTA),
        fecha_captura: new Date().toISOString(),
      });
    } catch (error) {
      this.fallar(error);
    }
  }

  private async calcularHuella(): Promise<ResultadoHuella> {
    marcar(MARCA_INICIO);
    try {
      return await this.proveedor.obtener();
    } finally {
      marcar(MARCA_FIN);
      medir(MEDIDA_CALCULO_HUELLA, MARCA_INICIO, MARCA_FIN);
    }
  }

  private enviar(payload: HuellaNavegadorPayload): void {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = usarAlmacenamiento(() => localStorage.getItem('access_token'));
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // HttpClient directo: RequestManager.setPath es estado compartido y un
    // envío en segundo plano podría cambiar la URL de otra petición en curso.
    this.suscripcion = this.http
      .post(`${environment.GESTION_CONTRACTUAL_CRUD_SERVICE}huellas-navegador`, payload, {
        headers,
        context: new HttpContext().set(OMITIR_SPINNER, true),
      })
      .subscribe({
        next: () => {
          usarAlmacenamiento(() =>
            sessionStorage.setItem(CLAVE_HUELLA_REGISTRADA, new Date().toISOString()),
          );
          this.estadoActual.set('enviada');
        },
        error: (error) => this.fallar(error),
      });
  }

  /** IP pública vista por el servicio de eco; null si falla o tarda demasiado. */
  private async obtenerIp(): Promise<string | null> {
    const { signal, limpiar } = this.crearSenalIp();
    try {
      const respuesta = await fetch(this.config.SERVICIO_IP, { signal });
      if (!respuesta.ok) {
        return null;
      }
      const cuerpo = (await respuesta.json()) as { ip?: unknown } | null;
      return typeof cuerpo?.ip === 'string' ? cuerpo.ip : null;
    } catch {
      return null;
    } finally {
      limpiar();
    }
  }

  private crearSenalIp(): { signal: AbortSignal; limpiar: () => void } {
    const timeoutMs = this.config.TIMEOUT_IP_MS;
    if (
      typeof AbortSignal.any === 'function' &&
      typeof AbortSignal.timeout === 'function'
    ) {
      return {
        signal: AbortSignal.any([
          this.abortController.signal,
          AbortSignal.timeout(timeoutMs),
        ]),
        limpiar: () => undefined,
      };
    }
    const controlador = new AbortController();
    const abortar = () => controlador.abort();
    const temporizador = setTimeout(abortar, timeoutMs);
    this.abortController.signal.addEventListener('abort', abortar);
    return {
      signal: controlador.signal,
      limpiar: () => {
        clearTimeout(temporizador);
        this.abortController.signal.removeEventListener('abort', abortar);
      },
    };
  }

  /** Misma fuente que usa el MF al registrar estados-contrato. */
  private async obtenerUsuarioId(): Promise<number | null> {
    try {
      const id = await this.userService.getPersonaId();
      return Number.isInteger(id) ? id : null;
    } catch {
      return null;
    }
  }

  /**
   * Primer rol de Argo del usuario (RolService, cargado por AppComponent).
   * Los estados-contrato eligen el rol según el estado del contrato; aquí no
   * hay contrato, así que se toma el primero de la lista.
   * cargarRol es asíncrono: se espera a que termine, como máximo
   * TIMEOUT_ROL_MS; si no llega a tiempo se envía null en lugar de bloquear.
   */
  private async obtenerRol(): Promise<string | null> {
    await this.esperarRol();
    const rol = this.rolService.getRol()[0];
    return rol ? rol.slice(0, LONGITUD_ROL) : null;
  }

  private async esperarRol(): Promise<void> {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let terminar: () => void = () => undefined;
    const limite = new Promise<void>((resolve) => {
      terminar = resolve;
      temporizador = setTimeout(resolve, TIMEOUT_ROL_MS);
      this.abortController.signal.addEventListener('abort', terminar);
    });
    try {
      await Promise.race([this.rolService.rolCargado(), limite]);
    } finally {
      clearTimeout(temporizador);
      this.abortController.signal.removeEventListener('abort', terminar);
    }
  }

  private registradaEnSesion(): boolean {
    return !!usarAlmacenamiento(() => sessionStorage.getItem(CLAVE_HUELLA_REGISTRADA));
  }

  private fallar(error: unknown): void {
    if (this.destruido) {
      return;
    }
    this.estadoActual.set('error');
    console.debug(
      '[huella-navegador] no se pudo registrar la huella:',
      error instanceof Error ? error.message : error,
    );
  }

  private cancelar(): void {
    this.destruido = true;
    if (this.idleId !== null && typeof cancelIdleCallback === 'function') {
      cancelIdleCallback(this.idleId);
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    this.idleId = null;
    this.timeoutId = null;
    this.abortController.abort();
    this.suscripcion?.unsubscribe();
    this.suscripcion = null;
  }
}

function marcar(nombre: string): void {
  try {
    performance.mark(nombre);
  } catch {
    // performance.mark no disponible: la medición es opcional.
  }
}

function medir(nombre: string, inicio: string, fin: string): void {
  try {
    performance.measure(nombre, inicio, fin);
  } catch {
    // performance.measure no disponible: la medición es opcional.
  }
}

/** sessionStorage y localStorage pueden lanzar (modo privado, bloqueados). */
function usarAlmacenamiento<T>(accion: () => T): T | null {
  try {
    return accion();
  } catch {
    return null;
  }
}
