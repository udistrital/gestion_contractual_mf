import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpContext,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { OMITIR_SPINNER, SpinnerIntercerptor } from './spinner.interceptor';
import { SpinnerService } from 'src/app/shared/services/spinner.service';

describe('SpinnerIntercerptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let spinner: SpinnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([SpinnerIntercerptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    spinner = TestBed.inject(SpinnerService);
  });

  afterEach(() => httpMock.verify());

  /** isLoading es un BehaviorSubject expuesto como Observable: emite al suscribirse. */
  const cargando = (): boolean => {
    let valor = false;
    spinner.isLoading.subscribe((v) => (valor = v)).unsubscribe();
    return valor;
  };

  it('debería mostrar el spinner mientras la petición está en curso y ocultarlo al terminar', () => {
    http.get('/recurso').subscribe();

    expect(cargando()).toBe(true);
    httpMock.expectOne('/recurso').flush({});
    expect(cargando()).toBe(false);
  });

  it('no debería tocar el spinner cuando la petición pide OMITIR_SPINNER', () => {
    const show = jest.spyOn(spinner, 'show');
    const hide = jest.spyOn(spinner, 'hide');

    http
      .post('/huellas', {}, { context: new HttpContext().set(OMITIR_SPINNER, true) })
      .subscribe();

    expect(cargando()).toBe(false);
    httpMock.expectOne('/huellas').flush({});
    expect(show).not.toHaveBeenCalled();
    expect(hide).not.toHaveBeenCalled();
  });

  it('no debería alterar el contador cuando OMITIR_SPINNER corre en paralelo con una petición normal', () => {
    const contador = () => spinner['requestCount'];

    http.get('/recurso').subscribe();
    http
      .post('/huellas', {}, { context: new HttpContext().set(OMITIR_SPINNER, true) })
      .subscribe();
    expect(contador()).toBe(1);
    expect(cargando()).toBe(true);

    // La huella termina primero: no debe ocultar el spinner de la otra petición.
    httpMock.expectOne('/huellas').flush({});
    expect(contador()).toBe(1);
    expect(cargando()).toBe(true);

    httpMock.expectOne('/recurso').flush({});
    expect(contador()).toBe(0);
    expect(cargando()).toBe(false);
  });
});
