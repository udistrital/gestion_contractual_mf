import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ContratoGeneralMidService } from './contrato-general-mid.service';
import { CambioEstadoContrato } from '../types/types';

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

describe('ContratoGeneralMidService', () => {
  let service: ContratoGeneralMidService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContratoGeneralMidService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // udistrital/argo_documentacion#414: el id del contrato va en la consulta
  it('registra el estado con POST contratos-generales/estados?contrato_id= y el cambio sin el id', () => {
    const cambio: CambioEstadoContrato = {
      usuario_id: 7,
      usuario_rol: 'JEFE_CONTRATACION_RECTOR',
      estado_parametro_id: 6774,
      estado_interno_parametro_id: 6802,
    };
    let respuesta: unknown;
    service.postEstadoContrato(42, cambio).subscribe((r) => (respuesta = r));

    const req = http.expectOne(
      `${environment.GESTION_CONTRACTUAL_MID_SERVICE}contratos-generales/estados?contrato_id=42`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cambio);
    const cuerpo = { Success: true, Status: 201, Data: { estado: { id: 3 }, numero_contrato: '6' } };
    req.flush(cuerpo);
    expect(respuesta).toEqual(cuerpo);
  });
});
