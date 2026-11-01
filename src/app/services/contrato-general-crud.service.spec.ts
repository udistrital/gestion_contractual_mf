import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService, rutaConsulta } from './contrato-general-crud.service';
import { GestionContractualCrudService } from './gestion-contractual-crud.service';
import { PolizasService } from './polizas.service';
import { GestorDocumentalService } from './gestor-documental.service';

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

/**
 * Rutas /v1 del CRUD Beego v2 y filtros que arman los pasos. Las respuestas
 * tienen el formato de la rama feature/385-json-snake-case del CRUD: snake_case,
 * Status como texto, [] en listas vacías, ceros en vez de nulos y FK como objeto
 * { id }. El MF no las transforma.
 */
const CRUD = `${environment.GESTION_CONTRACTUAL_CRUD_SERVICE}v1`;
const ok = (Data: unknown) => ({ Success: true, Status: '200', Message: 'Request successful', Data });
// Filtro por FK verificado contra la rama feature/385-json-snake-case.
const DEL_CONTRATO = 'contrato_general_id.id:42,activo:true';

describe('rutaConsulta', () => {
  it('arma query, sortby, order y limit explícito', () => {
    expect(rutaConsulta('estado_contrato', { query: 'a:1', sortby: 'fecha_creacion,id', order: 'desc', limit: 1 })).toBe(
      'v1/estado_contrato/?query=a:1&sortby=fecha_creacion,id&order=desc&limit=1'
    );
    expect(rutaConsulta('disponibilidad_presupuestal', { query: 'a:1', limit: 0 })).toBe(
      'v1/disponibilidad_presupuestal/?query=a:1&limit=0'
    );
  });
});

describe('Services del MF con el CRUD Beego v2 (sin adaptador)', () => {
  let crud: ContratoGeneralCrudService;
  let gestion: GestionContractualCrudService;
  let polizas: PolizasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GestorDocumentalService, useValue: {} },
      ],
    });
    crud = TestBed.inject(ContratoGeneralCrudService);
    gestion = TestBed.inject(GestionContractualCrudService);
    polizas = TestBed.inject(PolizasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('1. GET /v1/contrato_general/{id} y entrega la respuesta tal cual', () => {
    const contrato = { id: 42, objeto: 'Compra', tipo_control_id: 0, fecha_suscripcion: '0001-01-01T00:00:00Z', sede_solicitante_id: 10 };
    let respuesta: any;
    crud.get(42).subscribe((r) => (respuesta = r));
    const req = http.expectOne(`${CRUD}/contrato_general/42`);
    expect(req.request.method).toBe('GET');
    req.flush(ok(contrato));
    expect(respuesta).toEqual(ok(contrato));
  });

  it('2. POST /v1/contrato_general/ con el cuerpo en snake_case del MF', () => {
    const cuerpo = { tipo_contrato_id: 1, consecutivo_elaboracion: '27', unidad_ejecutora_id: 1 };
    crud.post(cuerpo).subscribe();
    const req = http.expectOne(`${CRUD}/contrato_general/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cuerpo);
    req.flush(ok({ id: 42, ...cuerpo }));
  });

  it('3. PUT /v1/contrato_general/{id} parcial, sin id en el cuerpo', () => {
    crud.put(42, { valor_pesos: '45000000' }).subscribe();
    const req = http.expectOne(`${CRUD}/contrato_general/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ valor_pesos: '45000000' });
    req.flush(ok({ id: 42 }));
  });

  it('6. CDP del contrato: filtro por contrato y activos, limit=0 (lista vacía como [])', () => {
    let respuesta: any;
    crud.getCdps({ query: DEL_CONTRATO, limit: 0 }).subscribe((r) => (respuesta = r));
    const req = http.expectOne(`${CRUD}/disponibilidad_presupuestal/?query=${DEL_CONTRATO}&limit=0`);
    expect(req.request.method).toBe('GET');
    req.flush(ok([]));
    expect(respuesta.Data).toEqual([]);
  });

  it('7. POST de CDP con los nombres del MF (incluido valor_a_tomar)', () => {
    const cdp = {
      numero_cdp_id: 1234,
      fecha_registro: new Date('2026-10-31T00:00:00Z'),
      vigencia_cdp_id: 2026,
      contrato_general_id: { id: 42 },
      valor_a_tomar: 45000000,
    };
    crud.postCdp(cdp).subscribe();
    const req = http.expectOne(`${CRUD}/disponibilidad_presupuestal/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cdp);
    req.flush(ok({ id: 1, ...cdp }));
  });

  it('8. DELETE lógico de CDP', () => {
    crud.deleteCdp(9).subscribe();
    const req = http.expectOne(`${CRUD}/disponibilidad_presupuestal/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(ok({ id: 9 }));
  });

  it('9 y 10. estados: actual (actual:true, el más reciente, limit=1) e historial', () => {
    crud
      .getEstados({ query: `contrato_general_id.id:42,actual:true,activo:true`, sortby: 'fecha_creacion,id', order: 'desc', limit: 1 })
      .subscribe();
    http
      .expectOne(`${CRUD}/estado_contrato/?query=contrato_general_id.id:42,actual:true,activo:true&sortby=fecha_creacion,id&order=desc&limit=1`)
      .flush(ok([{ id: 3, estado_interno_parametro_id: 6799, actual: true }]));

    crud.getEstados({ query: DEL_CONTRATO, sortby: 'fecha_creacion,id', order: 'desc', limit: 0 }).subscribe();
    http.expectOne(`${CRUD}/estado_contrato/?query=${DEL_CONTRATO}&sortby=fecha_creacion,id&order=desc&limit=0`).flush(ok([]));
  });

  it('11. POST de estado (el CRUD lo marca como actual)', () => {
    const estado = {
      contrato_general_id: { id: 42 },
      usuario_id: 1,
      usuario_rol: 'ABOGADO_CONTRATACION_RECTOR',
      estado_parametro_id: 6773,
      estado_interno_parametro_id: 6799,
    };
    crud.postEstadoContrato(estado).subscribe();
    const req = http.expectOne(`${CRUD}/estado_contrato/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(estado);
    req.flush(ok({ id: 3, ...estado }));
  });

  it('12 a 15. especificaciones: GET con filtro, POST, PUT y DELETE', () => {
    crud.getEspecificacionesTecnicas({ query: DEL_CONTRATO, limit: 0 }).subscribe();
    http.expectOne(`${CRUD}/especificacion_tecnica/?query=${DEL_CONTRATO}&limit=0`).flush(ok([]));

    crud.postEspecificacionTecnica({ descripcion: 'Osciloscopio', contrato_general_id: { id: 42 } }).subscribe();
    const post = http.expectOne(`${CRUD}/especificacion_tecnica/`);
    expect(post.request.method).toBe('POST');
    post.flush(ok({ id: 1 }));

    crud.putEspecificacionTecnica(1, { cantidad: 3 }).subscribe();
    const put = http.expectOne(`${CRUD}/especificacion_tecnica/1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ cantidad: 3 });
    put.flush(ok({ id: 1 }));

    crud.deleteEspecificacionTecnica(1).subscribe();
    const del = http.expectOne(`${CRUD}/especificacion_tecnica/1`);
    expect(del.request.method).toBe('DELETE');
    del.flush(ok({ id: 1 }));
  });

  it('16 a 21. contratista, solicitante y tipo de control se guardan con PUT parcial en contrato_general', () => {
    crud.put(42, { proveedor_numero_documento: '1014285890', tipo_persona_id: 1 }).subscribe();
    crud.put(42, { sede_solicitante_id: 10, dependencia_solicitante_id: 20 }).subscribe();
    crud.put(42, { tipo_control_id: 6611 }).subscribe();
    const reqs = http.match(`${CRUD}/contrato_general/42`);
    expect(reqs.map((r) => r.request.method)).toEqual(['PUT', 'PUT', 'PUT']);
    expect(reqs.map((r) => r.request.body)).toEqual([
      { proveedor_numero_documento: '1014285890', tipo_persona_id: 1 },
      { sede_solicitante_id: 10, dependencia_solicitante_id: 20 },
      { tipo_control_id: 6611 },
    ]);
    reqs.forEach((r) => r.flush(ok({ id: 42 })));
  });

  it('23 y 24. ordenador: consulta del activo y PUT o POST', () => {
    const ordenador = {
      ordenador_argo_id: 1,
      ordenador_sicapital_id: 1001,
      documento_identidad: '19456789',
      cargo_id: 12,
      contrato_general_id: { id: 42 },
    };
    crud.getOrdenadores({ query: DEL_CONTRATO, sortby: 'fecha_creacion,id', order: 'desc', limit: 1 }).subscribe();
    http.expectOne(`${CRUD}/ordenador_contrato/?query=${DEL_CONTRATO}&sortby=fecha_creacion,id&order=desc&limit=1`).flush(ok([]));

    crud.postOrdenadorContrato(ordenador).subscribe();
    const post = http.expectOne(`${CRUD}/ordenador_contrato/`);
    expect(post.request.method).toBe('POST');
    post.flush(ok({ id: 7 }));

    crud.putOrdenadorContrato(7, ordenador).subscribe();
    const put = http.expectOne(`${CRUD}/ordenador_contrato/7`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(ordenador);
    put.flush(ok({ id: 7 }));
  });

  it('25 a 27. supervisores: GET en orden de id, POST y PUT', () => {
    const supervisor = {
      supervisor_id: 3,
      sede_legado: '',
      dependencia_legado: '',
      cargo_legado: '',
      cargo_id: 5,
      documento: 3,
      digito_verificacion: 1,
      sede_id: 10,
      dependencia_id: 20,
      contrato_general_id: { id: 42 },
    };
    crud.getSupervisores({ query: DEL_CONTRATO, sortby: 'id', order: 'asc', limit: 0 }).subscribe();
    http.expectOne(`${CRUD}/supervisor_contrato/?query=${DEL_CONTRATO}&sortby=id&order=asc&limit=0`).flush(ok([]));

    crud.postSupervisor(supervisor).subscribe();
    const post = http.expectOne(`${CRUD}/supervisor_contrato/`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(supervisor);
    post.flush(ok({ id: 8 }));

    crud.putSupervisor(8, supervisor).subscribe();
    const put = http.expectOne(`${CRUD}/supervisor_contrato/8`);
    expect(put.request.method).toBe('PUT');
    put.flush(ok({ id: 8 }));
  });

  it('28. documento vigente por entidad_tipo, entidad_id y tipo, el más reciente', () => {
    const query = 'entidad_tipo:contrato_general,entidad_id:42,tipo_documento_id:6670,activo:true';
    gestion.getDocumentos({ query, sortby: 'fecha_creacion,id', order: 'desc', limit: 1 }).subscribe();
    http.expectOne(`${CRUD}/documento_contrato/?query=${query}&sortby=fecha_creacion,id&order=desc&limit=1`).flush(ok([]));
  });

  it('29. POST de documento polimórfico (entidad_tipo contrato_general)', () => {
    const documento = {
      entidad_tipo: 'contrato_general' as const,
      entidad_id: 42,
      tipo_documento_id: 6670,
      documento_id: 900,
      documento_enlace: 'uid-1',
    };
    gestion.postDocumento(documento).subscribe();
    const req = http.expectOne(`${CRUD}/documento_contrato/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(documento);
    req.flush(ok({ id: 1, ...documento }));
  });

  it('33. amparos del contrato en /v1/amparo_poliza', () => {
    polizas.getAmparos({ query: DEL_CONTRATO, sortby: 'id', order: 'asc', limit: 0 }).subscribe();
    http.expectOne(`${CRUD}/amparo_poliza/?query=${DEL_CONTRATO}&sortby=id&order=asc&limit=0`).flush(ok([]));
  });
});
