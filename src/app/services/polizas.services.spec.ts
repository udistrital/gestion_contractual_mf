import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PolizasService } from './polizas.service';
import { environment } from '../../environments/environment';

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

describe('PolizasService', () => {
  let service: PolizasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PolizasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('consulta los amparos activos del contrato en gestion_contractual_mid', () => {
    service.getAmparosPorContrato(10).subscribe();

    const query = encodeURIComponent(
      JSON.stringify({ contrato_general_id: 10, activo: true })
    );
    const req = httpMock.expectOne(
      `${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-polizas?query=${query}&limit=0&sortBy=id&orderBy=ASC`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ Success: true, Status: 200, Message: '', Data: [] });
  });

  it('crea amparos en lote contra amparos-polizas', () => {
    const amparos = [{ contrato_general_id: 10, amparo_id: 1181 }];
    service.postAmparos(amparos).subscribe();

    const req = httpMock.expectOne(
      `${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-polizas`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(amparos);
    req.flush({ Success: true, Status: 201, Message: '', Data: [] });
  });

  it('actualiza un amparo por id', () => {
    service.putAmparo(5, { poliza_id: 1 }).subscribe();

    const req = httpMock.expectOne(
      `${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-polizas/5`
    );
    expect(req.request.method).toBe('PUT');
    req.flush({ Success: true, Status: 200, Message: '', Data: null });
  });

  it('elimina (soft delete) un amparo por id', () => {
    service.deleteAmparo(5).subscribe();

    const req = httpMock.expectOne(
      `${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-polizas/5`
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({ Success: true, Status: 200, Message: '', Data: null });
  });

  it('consulta la póliza activa del contrato', () => {
    service.getPolizaPorContrato(10).subscribe();

    const query = encodeURIComponent(
      JSON.stringify({ contrato_general_id: 10, activo: true })
    );
    const req = httpMock.expectOne(
      `${environment.GESTION_CONTRACTUAL_MID_SERVICE}polizas?query=${query}&limit=1`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ Success: true, Status: 200, Message: '', Data: [] });
  });

  it('crea una póliza', () => {
    const poliza = { contrato_general_id: 10 };
    service.postPoliza(poliza).subscribe();

    const req = httpMock.expectOne(
      `${environment.GESTION_CONTRACTUAL_MID_SERVICE}polizas`
    );
    expect(req.request.method).toBe('POST');
    req.flush({ Success: true, Status: 201, Message: '', Data: { id: 1 } });
  });

  it('actualiza una póliza por id', () => {
    service.putPoliza(1, { descripcion: 'x' }).subscribe();

    const req = httpMock.expectOne(
      `${environment.GESTION_CONTRACTUAL_MID_SERVICE}polizas/1`
    );
    expect(req.request.method).toBe('PUT');
    req.flush({ Success: true, Status: 200, Message: '', Data: { id: 1 } });
  });

  it('consulta los amparos de un contrato en gestion_contractual_mid', () => {
    service.getAmparosContratoMid('10').subscribe();

    const req = httpMock.expectOne(
      `${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-contratos/10`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ Success: true, Status: 200, Message: '', Data: [] });
  });

  describe('Data vacío/null en los getters (no transforman la respuesta)', () => {
    it('getAmparosPorContrato propaga Data: null tal cual', () => {
      let result: any;
      service.getAmparosPorContrato(10).subscribe((r) => (result = r));

      const query = encodeURIComponent(
        JSON.stringify({ contrato_general_id: 10, activo: true })
      );
      httpMock
        .expectOne(
          `${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-polizas?query=${query}&limit=0&sortBy=id&orderBy=ASC`
        )
        .flush({ Success: true, Status: 200, Message: '', Data: null });

      expect(result.Data).toBeNull();
    });

    it('getPolizaPorContrato propaga Data: [] tal cual', () => {
      let result: any;
      service.getPolizaPorContrato(10).subscribe((r) => (result = r));

      const query = encodeURIComponent(
        JSON.stringify({ contrato_general_id: 10, activo: true })
      );
      httpMock
        .expectOne(
          `${environment.GESTION_CONTRACTUAL_MID_SERVICE}polizas?query=${query}&limit=1`
        )
        .flush({ Success: true, Status: 200, Message: '', Data: [] });

      expect(result.Data).toEqual([]);
    });

    it('getAmparosContratoMid propaga Data: null tal cual', () => {
      let result: any;
      service.getAmparosContratoMid(10).subscribe((r) => (result = r));

      httpMock
        .expectOne(`${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-contratos/10`)
        .flush({ Success: false, Status: 404, Message: 'no encontrado', Data: null });

      expect(result.Data).toBeNull();
      expect(result.Success).toBe(false);
    });
  });

  describe('rutas de error vía HttpErrorManager (post/put/delete)', () => {
    it('postAmparos rechaza con el ErrorResponse mapeado en un 400', (done) => {
      service.postAmparos([{ amparo_id: 1 }]).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
          expect(err.message).toBe(
            'Solicitud incorrecta. Por favor, revise los datos enviados.'
          );
          done();
        },
      });

      httpMock
        .expectOne(`${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-polizas`)
        .flush({ message: 'bad request' }, { status: 400, statusText: 'Bad Request' });
    });

    it('putAmparo rechaza con el ErrorResponse mapeado en un 404', (done) => {
      service.putAmparo(5, { poliza_id: 1 }).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          expect(err.message).toBe(
            'Recurso no encontrado. Por favor, verifique la URL.'
          );
          done();
        },
      });

      httpMock
        .expectOne(`${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-polizas/5`)
        .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('deleteAmparo rechaza con el ErrorResponse mapeado en un 500', (done) => {
      service.deleteAmparo(5).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          expect(err.message).toBe(
            'Error interno del servidor. Por favor, intente más tarde.'
          );
          done();
        },
      });

      httpMock
        .expectOne(`${environment.GESTION_CONTRACTUAL_MID_SERVICE}amparos-polizas/5`)
        .flush({ message: 'server error' }, { status: 500, statusText: 'Server Error' });
    });

    it('postPoliza rechaza con el ErrorResponse mapeado en un 400', (done) => {
      service.postPoliza({ contrato_general_id: 10 }).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        },
      });

      httpMock
        .expectOne(`${environment.GESTION_CONTRACTUAL_MID_SERVICE}polizas`)
        .flush({ message: 'bad request' }, { status: 400, statusText: 'Bad Request' });
    });

    it('putPoliza rechaza con el ErrorResponse mapeado en un 404', (done) => {
      service.putPoliza(1, { descripcion: 'x' }).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        },
      });

      httpMock
        .expectOne(`${environment.GESTION_CONTRACTUAL_MID_SERVICE}polizas/1`)
        .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
