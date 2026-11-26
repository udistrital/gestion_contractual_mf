import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { RegistroActasService } from './registro-actas.service';

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

const MINUTA = environment.MINUTA_CONTRACTUAL_MID_SERVICE;

describe('RegistroActasService', () => {
  let service: RegistroActasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RegistroActasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta la precarga con GET acta-inicio/contratos/:id', () => {
    service.getPrecargaActaInicio(9001).subscribe();

    const req = http.expectOne(`${MINUTA}acta-inicio/contratos/9001`);
    expect(req.request.method).toBe('GET');
    req.flush({ Success: true, Status: 200, Data: {} });
  });

  // udistrital/argo_documentacion#414: el id del contrato va en la consulta
  it('pide la vista previa con POST acta-inicio/contratos/previsualizacion?contrato_id=', () => {
    const datos = { objeto: 'Objeto de prueba' };
    service.previsualizarActaInicio(9001, datos).subscribe();

    const req = http.expectOne(`${MINUTA}acta-inicio/contratos/previsualizacion?contrato_id=9001`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush({ Success: true, Status: 200, Data: { pdf: 'JVBER' } });
  });

  it('genera el acta con POST acta-inicio/contratos/:id', () => {
    const datos = { usuario_id: 1, usuario_rol: 'ABOGADO_CONTRATACION_RECTOR' };
    service.generarActaInicio(9001, datos).subscribe();

    const req = http.expectOne(`${MINUTA}acta-inicio/contratos/9001`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush({ Success: true, Status: 201, Data: {} });
  });
});
