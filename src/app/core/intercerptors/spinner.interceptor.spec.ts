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

  it('debería mostrar el spinner mientras la petición está en curso y ocultarlo al terminar', () => {
    http.get('/recurso').subscribe();

    expect(spinner.isLoading()).toBe(true);
    httpMock.expectOne('/recurso').flush({});
    expect(spinner.isLoading()).toBe(false);
  });

  it('no debería tocar el spinner cuando la petición pide OMITIR_SPINNER', () => {
    const show = jest.spyOn(spinner, 'show');
    const hide = jest.spyOn(spinner, 'hide');

    http
      .post('/huellas', {}, { context: new HttpContext().set(OMITIR_SPINNER, true) })
      .subscribe();

    expect(spinner.isLoading()).toBe(false);
    httpMock.expectOne('/huellas').flush({});
    expect(show).not.toHaveBeenCalled();
    expect(hide).not.toHaveBeenCalled();
  });
});
