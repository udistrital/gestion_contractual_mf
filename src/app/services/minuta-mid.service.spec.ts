import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MinutasMidService } from './minuta-mid.service';
import { environment } from '../../environments/environment';
import { ErrorMinuta } from '../types/types';

const ID_CONTRATO = 7;
const URL_MINUTA = `${environment.MINUTA_CONTRACTUAL_MID_SERVICE}minutas/contratos/${ID_CONTRATO}`;
/** PDF mínimo en base64 (empieza por JVBER = %PDF). */
const PDF = btoa('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');

type Modo = 'HTTP 200' | 'HTTP real';
interface Resultado {
  pdf?: string;
  error?: ErrorMinuta;
}

describe('MinutasMidService', () => {
  let service: MinutasMidService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MinutasMidService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /** Pide la minuta y deja en `resultado` el PDF o el ErrorMinuta. */
  function pedirMinuta(): Resultado {
    const resultado: Resultado = {};
    service.getMinutaPdf(ID_CONTRATO).subscribe({
      next: (pdf) => (resultado.pdf = pdf),
      error: (error: ErrorMinuta) => (resultado.error = error),
    });
    return resultado;
  }

  /** Responde el sobre con HTTP 200 o con el código HTTP igual al Status. */
  function responder(cuerpo: Record<string, unknown>, modo: Modo) {
    const req = httpMock.expectOne(URL_MINUTA);
    expect(req.request.method).toBe('GET');
    const status = Number(cuerpo['Status']);
    if (modo === 'HTTP 200' || status === 200) {
      req.flush(cuerpo);
    } else {
      req.flush(cuerpo, { status, statusText: 'Error' });
    }
  }

  const sobre = (Status: number, Message: string, Data?: string) => ({
    Success: Status === 200,
    Status,
    Message,
    ...(Data !== undefined ? { Data } : {}),
  });

  const CASOS_ERROR: [string, Record<string, unknown>, ErrorMinuta][] = [
    [
      '400 id no válido',
      sobre(400, 'El id del contrato debe ser un entero positivo'),
      { status: 400, tipo: 'parametro', mensaje: 'No se pudo identificar el contrato.', reintentable: false },
    ],
    [
      '404 contrato inexistente',
      sobre(404, 'Contrato general no encontrado'),
      { status: 404, tipo: 'no-encontrado', mensaje: 'El contrato no existe.', reintentable: false },
    ],
    [
      '404 sin plantilla',
      sobre(404, 'Plantilla no encontrada'),
      {
        status: 404,
        tipo: 'sin-plantilla',
        mensaje: 'No hay plantilla de minuta para esta unidad y tipo de contrato.',
        reintentable: false,
      },
    ],
    [
      '422 con un faltante',
      sobre(422, 'Faltan datos: ordenador'),
      {
        status: 422,
        tipo: 'faltan-datos',
        mensaje: 'Faltan datos para generar la minuta: ordenador del gasto.',
        reintentable: true,
        faltantes: ['ordenador'],
      },
    ],
    [
      '422 con varios faltantes',
      sobre(422, 'Faltan datos: ordenador, contratista, vigencia, clausulas'),
      {
        status: 422,
        tipo: 'faltan-datos',
        mensaje: 'Faltan datos para generar la minuta: ordenador del gasto, contratista, vigencia, cláusulas.',
        reintentable: true,
        faltantes: ['ordenador', 'contratista', 'vigencia', 'clausulas'],
      },
    ],
    [
      '422 con un faltante desconocido',
      sobre(422, 'Faltan datos: clausulas, firma_digital'),
      {
        status: 422,
        tipo: 'faltan-datos',
        mensaje: 'Faltan datos para generar la minuta: cláusulas, firma_digital.',
        reintentable: true,
        faltantes: ['clausulas', 'firma_digital'],
      },
    ],
    [
      '502 con el MID caído',
      sobre(502, 'Servicio no disponible: gestion_contractual_mid'),
      {
        status: 502,
        tipo: 'servicio',
        mensaje: 'Un servicio no respondió (gestion_contractual_mid). Intente de nuevo.',
        reintentable: true,
        servicio: 'gestion_contractual_mid',
      },
    ],
    [
      '502 con el renderizador caído (con el paso)',
      sobre(502, 'Servicio no disponible: plantillas_mid (paso 1: HTML)'),
      {
        status: 502,
        tipo: 'servicio',
        mensaje: 'Un servicio no respondió (plantillas_mid). Intente de nuevo.',
        reintentable: true,
        servicio: 'plantillas_mid',
      },
    ],
    [
      '500 error interno',
      sobre(500, 'Error al generar la minuta'),
      { status: 500, tipo: 'interno', mensaje: 'No se pudo generar la minuta. Intente de nuevo.', reintentable: true },
    ],
    [
      'Status inesperado (418)',
      sobre(418, 'Cualquier cosa'),
      { status: 418, tipo: 'interno', mensaje: 'No se pudo generar la minuta. Intente de nuevo.', reintentable: true },
    ],
  ];

  describe.each<Modo>(['HTTP 200', 'HTTP real'])('getMinutaPdf con %s', (modo) => {
    it('200 con un PDF válido devuelve el base64', () => {
      const resultado = pedirMinuta();
      responder(sobre(200, 'Minuta generada exitosamente', PDF), modo);
      expect(resultado).toEqual({ pdf: PDF });
    });

    it.each(CASOS_ERROR)('%s → ErrorMinuta con el mensaje para el usuario', (_caso, cuerpo, esperado) => {
      const resultado = pedirMinuta();
      responder(cuerpo, modo);
      expect(resultado.pdf).toBeUndefined();
      expect(resultado.error).toEqual(esperado);
      expect(resultado.error!.mensaje).not.toContain(String(cuerpo['Message']));
    });
  });

  describe('getMinutaPdf con respuestas vacías o inválidas', () => {
    const INVALIDA: ErrorMinuta = {
      status: 200,
      tipo: 'invalida',
      mensaje: 'La minuta llegó vacía o dañada.',
      reintentable: true,
    };
    const CONEXION = 'No hay conexión con el servicio de minutas. Intente de nuevo.';

    it.each<[string, unknown]>([
      ['Data vacía', ''],
      ['Data ausente', undefined],
      ['Data que no es base64', 'esto no es base64 ###'],
      ['base64 que no es PDF', btoa('hola mundo, no soy un PDF')],
      ['base64 con longitud incompleta', 'JVBERi0xLjQ'],
      ['Data que no es texto', { pdf: PDF }],
    ])('Status 200 con %s → invalida', (_caso, data) => {
      const resultado = pedirMinuta();
      httpMock.expectOne(URL_MINUTA).flush({ Success: true, Status: 200, Message: 'ok', ...(data !== undefined ? { Data: data } : {}) });
      expect(resultado).toEqual({ error: INVALIDA });
    });

    it('acepta el prefijo data URI y los espacios, y devuelve el base64 limpio', () => {
      const conRuido = `data:application/pdf;base64,${PDF.slice(0, 20)}\n ${PDF.slice(20)}`;
      const resultado = pedirMinuta();
      httpMock.expectOne(URL_MINUTA).flush(sobre(200, 'Minuta generada exitosamente', conRuido));
      expect(resultado).toEqual({ pdf: PDF });
    });

    it('acepta Status como texto ("200"), como responden otros servicios', () => {
      const resultado = pedirMinuta();
      httpMock.expectOne(URL_MINUTA).flush({ Success: true, Status: '200', Message: 'ok', Data: PDF });
      expect(resultado).toEqual({ pdf: PDF });
    });

    it('un cuerpo sin sobre con HTTP 200 → invalida', () => {
      const resultado = pedirMinuta();
      httpMock.expectOne(URL_MINUTA).flush({ algo: 'distinto' });
      expect(resultado).toEqual({ error: { ...INVALIDA, status: null } });
    });

    it('504 del gateway con HTML → conexion, reintentable', () => {
      const resultado = pedirMinuta();
      httpMock
        .expectOne(URL_MINUTA)
        .flush('<html><body>504 Gateway Time-out</body></html>', { status: 504, statusText: 'Gateway Timeout' });
      expect(resultado).toEqual({
        error: { status: 504, tipo: 'conexion', mensaje: CONEXION, reintentable: true },
      });
      expect(resultado.error!.mensaje).not.toMatch(/Http failure|504/);
    });

    it('HTML con HTTP 200 que llega como texto → conexion', () => {
      const resultado = pedirMinuta();
      httpMock.expectOne(URL_MINUTA).flush('<html>Mantenimiento</html>');
      expect(resultado.error).toEqual({ status: null, tipo: 'conexion', mensaje: CONEXION, reintentable: true });
    });

    it('HTML con HTTP 200 que el navegador no puede leer como JSON → conexion', () => {
      // En el navegador, un 200 con HTML falla al parsear: HttpErrorResponse con status 200.
      const resultado = pedirMinuta();
      httpMock.expectOne(URL_MINUTA).error(new ProgressEvent('error'), { status: 200, statusText: 'OK' });
      expect(resultado.error).toEqual({ status: 200, tipo: 'conexion', mensaje: CONEXION, reintentable: true });
    });

    it('red caída (status 0) → conexion sin status', () => {
      const resultado = pedirMinuta();
      httpMock.expectOne(URL_MINUTA).error(new ProgressEvent('error'));
      expect(resultado).toEqual({
        error: { status: null, tipo: 'conexion', mensaje: CONEXION, reintentable: true },
      });
    });

    it('JSON de error sin sobre (Nest) → se interpreta por el código HTTP', () => {
      const resultado = pedirMinuta();
      httpMock
        .expectOne(URL_MINUTA)
        .flush({ statusCode: 500, message: 'Internal server error' }, { status: 500, statusText: 'Error' });
      expect(resultado.error).toEqual({
        status: 500,
        tipo: 'interno',
        mensaje: 'No se pudo generar la minuta. Intente de nuevo.',
        reintentable: true,
      });
    });

    it('un sobre con Status 200 dentro de un error HTTP usa el código HTTP', () => {
      const resultado = pedirMinuta();
      httpMock.expectOne(URL_MINUTA).flush(sobre(200, 'ok', PDF), { status: 503, statusText: 'Error' });
      expect(resultado.pdf).toBeUndefined();
      expect(resultado.error).toEqual({
        status: 503,
        tipo: 'interno',
        mensaje: 'No se pudo generar la minuta. Intente de nuevo.',
        reintentable: true,
      });
    });
  });

  it('getActaAprobacionPoliza pide la ruta real del acta de póliza', () => {
    let respuesta: unknown;
    service.getActaAprobacionPoliza(ID_CONTRATO).subscribe((r) => (respuesta = r));
    const req = httpMock.expectOne(
      `${environment.MINUTA_CONTRACTUAL_MID_SERVICE}acta-poliza/contratos/${ID_CONTRATO}`
    );
    expect(req.request.method).toBe('GET');
    const cuerpo = sobre(200, 'ok', PDF);
    req.flush(cuerpo);
    expect(respuesta).toEqual(cuerpo);
  });

  it('getMinuta sigue pidiendo la misma ruta, sin interpretar la respuesta', () => {
    let respuesta: unknown;
    service.getMinuta(ID_CONTRATO).subscribe((r) => (respuesta = r));
    const cuerpo = sobre(422, 'Faltan datos: ordenador');
    httpMock.expectOne(URL_MINUTA).flush(cuerpo);
    expect(respuesta).toEqual(cuerpo);
  });
});
