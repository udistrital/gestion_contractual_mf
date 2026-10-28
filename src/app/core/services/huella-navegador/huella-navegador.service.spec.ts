import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { OMITIR_SPINNER } from 'src/app/core/intercerptors/spinner.interceptor';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import {
  CLAVE_HUELLA_REGISTRADA,
  HuellaNavegadorService,
  MEDIDA_CALCULO_HUELLA,
} from './huella-navegador.service';
import { PROVEEDOR_HUELLA } from './proveedor-huella.token';
import { ResultadoHuella } from './huella-navegador.models';

const URL_HUELLAS = `${environment.GESTION_CONTRACTUAL_CRUD_SERVICE}huellas-navegador`;

const resultadoSimulado: ResultadoHuella = {
  huella: '4f2a9c1e8b7d6a5f3e2d1c0b9a8f7e6d',
  libreria: 'fingerprintjs',
  version_libreria: '5.3.0',
  confianza: 0.4,
  componentes: {
    canvas: { hash: 'a1b2c3d4e5f60718', duracion_ms: 12, error: false },
  },
};

describe('HuellaNavegadorService', () => {
  let service: HuellaNavegadorService;
  let httpMock: HttpTestingController;
  let fetchMock: jest.Mock;
  let verificarHttp: boolean;

  const proveedor = { nombre: 'fingerprintjs', obtener: jest.fn() };
  const userService = { getPersonaId: jest.fn() };
  const rolService = { getRol: jest.fn(), rolCargado: jest.fn() };
  const config = environment.HUELLA_NAVEGADOR;

  const respuestaIp = (ip: string) =>
    Promise.resolve({ ok: true, json: async () => ({ ip }) } as Response);

  /** Deja correr el setTimeout de respaldo y las promesas encadenadas. */
  const ejecutarTrabajo = async () => {
    await jest.advanceTimersByTimeAsync(2000);
  };

  const esperarPost = async (): Promise<TestRequest> => {
    for (let i = 0; i < 20; i++) {
      const peticiones = httpMock.match(URL_HUELLAS);
      if (peticiones.length) {
        return peticiones[0];
      }
      await Promise.resolve();
    }
    return httpMock.expectOne(URL_HUELLAS);
  };

  const crearServicio = () => {
    service = TestBed.inject(HuellaNavegadorService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    verificarHttp = true;
    config.HABILITADO = true;
    sessionStorage.clear();
    localStorage.clear();
    localStorage.setItem('access_token', 'token-de-prueba');
    window.history.pushState({}, '', '/gestion-contractual/consulta-contrato');

    proveedor.obtener.mockReset().mockResolvedValue(resultadoSimulado);
    userService.getPersonaId.mockReset().mockResolvedValue(123);
    rolService.getRol.mockReset().mockReturnValue(['ABOGADO_CONTRATACION_RECTOR']);
    rolService.rolCargado.mockReset().mockResolvedValue(undefined);
    fetchMock = jest.fn().mockImplementation(() => respuestaIp('190.25.0.1'));
    (globalThis as any).fetch = fetchMock;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PROVEEDOR_HUELLA, useValue: proveedor },
        { provide: UserService, useValue: userService },
        { provide: RolService, useValue: rolService },
      ],
    });
  });

  afterEach(() => {
    if (verificarHttp) {
      httpMock.verify();
    }
    TestBed.resetTestingModule();
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete (globalThis as any).fetch;
    delete (globalThis as any).requestIdleCallback;
    delete (globalThis as any).cancelIdleCallback;
    config.HABILITADO = true;
  });

  it('debería quedar inactivo y no hacer nada cuando está deshabilitado', async () => {
    config.HABILITADO = false;
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();

    expect(service.estado()).toBe('inactivo');
    expect(proveedor.obtener).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    httpMock.expectNone(URL_HUELLAS);
  });

  it('debería omitir el envío si la huella ya se registró en la sesión', async () => {
    sessionStorage.setItem(CLAVE_HUELLA_REGISTRADA, '2026-10-16T15:00:00.000Z');
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();

    expect(service.estado()).toBe('omitida');
    expect(proveedor.obtener).not.toHaveBeenCalled();
    httpMock.expectNone(URL_HUELLAS);
  });

  it('debería calcular la huella en segundo plano y registrarla una vez', async () => {
    const mark = jest.fn();
    const measure = jest.fn();
    (performance as any).mark = mark;
    (performance as any).measure = measure;
    crearServicio();

    service.iniciar();
    expect(service.estado()).toBe('pendiente');
    expect(proveedor.obtener).not.toHaveBeenCalled();

    await ejecutarTrabajo();
    const peticion = await esperarPost();

    expect(service.estado()).toBe('calculando');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.context.get(OMITIR_SPINNER)).toBe(true);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    expect(peticion.request.headers.get('Content-Type')).toBe('application/json');
    expect(peticion.request.body).toEqual({
      huella: resultadoSimulado.huella,
      libreria: 'fingerprintjs',
      version_libreria: '5.3.0',
      confianza: 0.4,
      componentes: resultadoSimulado.componentes,
      direccion_ip: '190.25.0.1',
      user_agent: navigator.userAgent,
      usuario_id: 123,
      usuario_rol: 'ABOGADO_CONTRATACION_RECTOR',
      microcliente: 'gestion_contractual_mf',
      ruta: '/gestion-contractual/consulta-contrato',
      fecha_captura: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
    expect(fetchMock).toHaveBeenCalledWith(config.SERVICIO_IP, {
      signal: expect.any(AbortSignal),
    });
    expect(measure).toHaveBeenCalledWith(
      MEDIDA_CALCULO_HUELLA,
      'huella-navegador-inicio',
      'huella-navegador-fin',
    );

    peticion.flush({ Success: true, Status: 201 }, { status: 201, statusText: 'Created' });

    expect(service.estado()).toBe('enviada');
    expect(service.huella()).toBe(resultadoSimulado.huella);
    expect(sessionStorage.getItem(CLAVE_HUELLA_REGISTRADA)).not.toBeNull();
    delete (performance as any).mark;
    delete (performance as any).measure;
  });

  it('no debería programar un segundo cálculo si ya hay uno en curso', async () => {
    crearServicio();

    service.iniciar();
    service.iniciar();
    await ejecutarTrabajo();
    (await esperarPost()).flush({});
    service.iniciar();
    await ejecutarTrabajo();

    expect(proveedor.obtener).toHaveBeenCalledTimes(1);
    expect(service.estado()).toBe('omitida');
  });

  it('debería usar requestIdleCallback con timeout de 5000 ms cuando existe', async () => {
    const ric = jest.fn().mockReturnValue(7);
    (globalThis as any).requestIdleCallback = ric;
    (globalThis as any).cancelIdleCallback = jest.fn();
    crearServicio();

    service.iniciar();

    expect(ric).toHaveBeenCalledWith(expect.any(Function), { timeout: 5000 });
    ric.mock.calls[0][0]();
    (await esperarPost()).flush({});
    expect(service.estado()).toBe('enviada');
  });

  it('debería enviar direccion_ip null si el servicio de IP falla', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    const peticion = await esperarPost();

    expect(peticion.request.body.direccion_ip).toBeNull();
    peticion.flush({});
  });

  it('debería enviar direccion_ip null si el servicio de IP responde con error', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    const peticion = await esperarPost();

    expect(peticion.request.body.direccion_ip).toBeNull();
    peticion.flush({});
  });

  it('debería enviar direccion_ip null si el servicio de IP excede el timeout', async () => {
    let senal: AbortSignal | undefined;
    fetchMock.mockImplementation(
      (_url: string, opciones: RequestInit) =>
        new Promise((_resolver, rechazar) => {
          senal = opciones.signal ?? undefined;
          senal?.addEventListener('abort', () => rechazar(new DOMException('timeout', 'TimeoutError')));
        }),
    );
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    await jest.advanceTimersByTimeAsync(config.TIMEOUT_IP_MS);
    const peticion = await esperarPost();

    expect(senal?.aborted).toBe(true);
    expect(peticion.request.body.direccion_ip).toBeNull();
    peticion.flush({});
  });

  it('debería usar el respaldo con AbortController si no existe AbortSignal.any', async () => {
    const anyOriginal = AbortSignal.any;
    (AbortSignal as any).any = undefined;
    try {
      let senal: AbortSignal | undefined;
      fetchMock.mockImplementation(
        (_url: string, opciones: RequestInit) =>
          new Promise((_resolver, rechazar) => {
            senal = opciones.signal ?? undefined;
            senal?.addEventListener('abort', () => rechazar(new DOMException('abort', 'AbortError')));
          }),
      );
      crearServicio();

      service.iniciar();
      await ejecutarTrabajo();
      await jest.advanceTimersByTimeAsync(config.TIMEOUT_IP_MS);
      const peticion = await esperarPost();

      expect(senal?.aborted).toBe(true);
      expect(peticion.request.body.direccion_ip).toBeNull();
      peticion.flush({});
    } finally {
      AbortSignal.any = anyOriginal;
    }
  });

  it('debería quedar en error sin lanzar ni guardar la marca si el POST falla', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    const log = jest.spyOn(console, 'log');
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    (await esperarPost()).flush(
      { Success: false },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(service.estado()).toBe('error');
    expect(sessionStorage.getItem(CLAVE_HUELLA_REGISTRADA)).toBeNull();
    expect(debug).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();
  });

  it('debería quedar en error sin enviar si la librería falla', async () => {
    jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    proveedor.obtener.mockRejectedValue(new Error('canvas bloqueado'));
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    await Promise.resolve();

    expect(service.estado()).toBe('error');
    httpMock.expectNone(URL_HUELLAS);
  });

  it('debería enviar la ruta sin query string ni hash', async () => {
    window.history.pushState({}, '', '/gestion-contractual/revision/15?token=secreto#detalle');
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    const peticion = await esperarPost();

    expect(peticion.request.body.ruta).toBe('/gestion-contractual/revision/15');
    peticion.flush({});
  });

  it('debería cortar el user agent a 512 caracteres', async () => {
    jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue('a'.repeat(600));
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    const peticion = await esperarPost();

    expect(peticion.request.body.user_agent).toBe('a'.repeat(512));
    peticion.flush({});
  });

  it('debería enviar usuario_id, usuario_rol y Authorization vacíos si no hay sesión', async () => {
    localStorage.clear();
    userService.getPersonaId.mockRejectedValue(new Error('No id found'));
    rolService.getRol.mockReturnValue([]);
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    const peticion = await esperarPost();

    expect(peticion.request.body.usuario_id).toBeNull();
    expect(peticion.request.body.usuario_rol).toBeNull();
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush({});
  });

  it('debería esperar a que cargue el rol antes de enviar la huella', async () => {
    let resolverRol!: () => void;
    rolService.rolCargado.mockReturnValue(
      new Promise<void>((resolve) => (resolverRol = resolve)),
    );
    rolService.getRol.mockReturnValue([]);
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    httpMock.expectNone(URL_HUELLAS);

    rolService.getRol.mockReturnValue(['ORDENADOR_DEL_GASTO']);
    resolverRol();
    const peticion = await esperarPost();

    expect(peticion.request.body.usuario_rol).toBe('ORDENADOR_DEL_GASTO');
    peticion.flush({});
  });

  it('debería enviar usuario_rol null si el rol no carga en 5000 ms', async () => {
    rolService.rolCargado.mockReturnValue(new Promise<void>(() => undefined));
    rolService.getRol.mockReturnValue([]);
    crearServicio();

    service.iniciar();
    await ejecutarTrabajo();
    await jest.advanceTimersByTimeAsync(4999);
    httpMock.expectNone(URL_HUELLAS);

    await jest.advanceTimersByTimeAsync(1);
    const peticion = await esperarPost();

    expect(peticion.request.body.usuario_rol).toBeNull();
    peticion.flush({});
  });

  describe('al destruirse el injector (unmount de single-spa)', () => {
    it('debería cancelar el trabajo programado', async () => {
      crearServicio();
      service.iniciar();

      TestBed.resetTestingModule();
      verificarHttp = false;
      await ejecutarTrabajo();

      expect(proveedor.obtener).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('debería cancelar el idle callback pendiente', () => {
      (globalThis as any).requestIdleCallback = jest.fn().mockReturnValue(42);
      const cancelar = jest.fn();
      (globalThis as any).cancelIdleCallback = cancelar;
      crearServicio();
      service.iniciar();

      TestBed.resetTestingModule();
      verificarHttp = false;

      expect(cancelar).toHaveBeenCalledWith(42);
    });

    it('debería abortar el fetch de la IP y no enviar el POST', async () => {
      let senal: AbortSignal | undefined;
      fetchMock.mockImplementation(
        (_url: string, opciones: RequestInit) =>
          new Promise((_resolver, rechazar) => {
            senal = opciones.signal ?? undefined;
            senal?.addEventListener('abort', () => rechazar(new DOMException('abort', 'AbortError')));
          }),
      );
      crearServicio();
      service.iniciar();
      await ejecutarTrabajo();

      const http = httpMock;
      TestBed.resetTestingModule();
      verificarHttp = false;
      await Promise.resolve();

      expect(senal?.aborted).toBe(true);
      http.expectNone(URL_HUELLAS);
    });

    it('no debería enviar el POST si se desmonta mientras espera el rol', async () => {
      rolService.rolCargado.mockReturnValue(new Promise<void>(() => undefined));
      crearServicio();
      service.iniciar();
      await ejecutarTrabajo();

      const http = httpMock;
      TestBed.resetTestingModule();
      verificarHttp = false;
      await jest.advanceTimersByTimeAsync(5000);

      http.expectNone(URL_HUELLAS);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('debería cancelar el POST en curso', async () => {
      crearServicio();
      service.iniciar();
      await ejecutarTrabajo();
      const peticion = await esperarPost();

      TestBed.resetTestingModule();
      verificarHttp = false;

      expect(peticion.cancelled).toBe(true);
      expect(sessionStorage.getItem(CLAVE_HUELLA_REGISTRADA)).toBeNull();
    });
  });
});
