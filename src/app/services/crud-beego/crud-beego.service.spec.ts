import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from '../contrato-general-crud.service';
import { PolizasService } from '../polizas.service';
import { GestorDocumentalService } from '../gestor-documental.service';
import { aBeego, aPascal, aSnake, desdeBeego, normalizarRespuesta } from './crud-beego.service';
import { CONTRATO_GENERAL, DISPONIBILIDAD_PRESUPUESTAL } from './recursos';

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

const CRUD = `${environment.GESTION_CONTRACTUAL_CRUD_SERVICE}v1`;
const DEL_CONTRATO = 'query=ContratoGeneralId.Id:42,Activo:true';
const ok = (Data: unknown, Status = '200') => ({ Success: true, Status, Message: 'Request successful', Data });

describe('Adaptador del CRUD Beego v2', () => {
  it('convierte nombres entre snake_case y PascalCase', () => {
    expect(aPascal('contrato_general_id')).toBe('ContratoGeneralId');
    expect(aSnake('ContratoGeneralId')).toBe('contrato_general_id');
    expect(aSnake('Id')).toBe('id');
  });

  it('normaliza la lista vacía [{}], el Status, las fechas cero y las relaciones', () => {
    expect(normalizarRespuesta(ok([{}]), CONTRATO_GENERAL)).toEqual({
      Success: true,
      Status: 200,
      Message: 'Request successful',
      Data: [],
    });

    const respuesta = normalizarRespuesta<any>(
      ok({
        Id: 7,
        ContratoGeneralId: { Id: 42, Objeto: 'Contrato completo' },
        VigenciaCdpId: 2026,
        TipoContratoId: 0,
        FechaRegistro: '0001-01-01T00:00:00Z',
        NumeroCdpId: 1234,
      }),
      DISPONIBILIDAD_PRESUPUESTAL
    );
    expect(respuesta.Data).toEqual({
      id: 7,
      contrato_general_id: 42,
      vigencia_cdp: 2026,
      tipo_contrato_id: null,
      fecha_registro: null,
      numero_cdp_id: 1234,
    });
  });

  it('arma el cuerpo de Beego: relaciones, numéricos, booleanos, alias, excluidos y sin vacíos', () => {
    expect(
      aBeego(
        {
          id: 3,
          contrato_general_id: 42,
          numero_cdp_id: '1234',
          vigencia_cdp: '2026',
          valor_a_tomar: 500,
          fecha_registro: '2026-10-21T00:00:00.000Z',
          observacion: '',
        },
        DISPONIBILIDAD_PRESUPUESTAL
      )
    ).toEqual({
      ContratoGeneralId: { Id: 42 },
      NumeroCdpId: 1234,
      VigenciaCdpId: 2026,
      FechaRegistro: '2026-10-21T00:00:00.000Z',
    });

    expect(
      aBeego(
        { aplica_poliza: '1', fecha_suscripcion_estudios: '', origen_presupuestos_id: 6661, convenio: 3 },
        CONTRATO_GENERAL
      )
    ).toEqual({ AplicaPoliza: true, OrigenPresupuestoId: 6661 });
  });

  it('desdeBeego conserva valores que no son relaciones ni ceros', () => {
    expect(desdeBeego({ Id: 1, Activo: true, Objeto: 'x', ValorPesos: 0 }, CONTRATO_GENERAL)).toEqual({
      id: 1,
      activo: true,
      objeto: 'x',
      valor_pesos: 0,
    });
  });
});

describe('Services del CRUD Beego v2 (fachada ContratoGeneralCrudService)', () => {
  let service: ContratoGeneralCrudService;
  let polizas: PolizasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), GestorDocumentalService],
    });
    service = TestBed.inject(ContratoGeneralCrudService);
    polizas = TestBed.inject(PolizasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // Filas 1 a 3: contrato general
  it('1. GET /v1/contrato_general/{id} y responde en snake_case', () => {
    let data: any;
    service.get(42).subscribe((r) => (data = r));
    const req = http.expectOne(`${CRUD}/contrato_general/42`);
    expect(req.request.method).toBe('GET');
    req.flush(ok({ Id: 42, TipoCompromisoId: 6534, FechaSuscripcionEstudio: '0001-01-01T00:00:00Z', NumeroContrato: null }));
    expect(data).toEqual({
      Success: true,
      Status: 200,
      Message: 'Request successful',
      Data: { id: 42, tipo_compromiso_id: 6534, fecha_suscripcion_estudios: null, numero_contrato: null },
    });
  });

  it('2. POST /v1/contrato_general/ con el cuerpo en PascalCase', () => {
    let data: any;
    service
      .post({
        unidad_ejecutora_id: 6818,
        tipo_compromiso_id: 6534,
        aplica_poliza: '1',
        fecha_suscripcion_estudios: '',
        consecutivo_elaboracion: '27',
        vigencia_convenio: '',
        convenio: '',
        nombre_convenio: '',
      })
      .subscribe((r) => (data = r));
    const req = http.expectOne(`${CRUD}/contrato_general/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      UnidadEjecutoraId: 6818,
      TipoCompromisoId: 6534,
      AplicaPoliza: true,
      ConsecutivoElaboracion: '27',
    });
    req.flush(ok({ Id: 42, ConsecutivoElaboracion: '27' }, '201'));
    expect(data.Status).toBe(201);
    expect(data.Data.id).toBe(42);
  });

  it('2. con datos de convenio los guarda en /v1/convenio/ (crea si no hay uno activo)', () => {
    service.post({ unidad_ejecutora_id: 6818, nombre_convenio: 'Convenio marco', vigencia_convenio: 2026, convenio: 9 }).subscribe();
    http.expectOne(`${CRUD}/contrato_general/`).flush(ok({ Id: 42 }, '201'));
    http.expectOne(`${CRUD}/convenio/?${DEL_CONTRATO}&limit=1`).flush(ok([{}]));
    const req = http.expectOne(`${CRUD}/convenio/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      ContratoGeneralId: { Id: 42 },
      Nombre: 'Convenio marco',
      Vigencia: 2026,
      TipoConvenioId: 9,
    });
    req.flush(ok({ Id: 3 }, '201'));
  });

  it('3. PUT /v1/contrato_general/{id} parcial y sin Id en el cuerpo', () => {
    service.put(42, { objeto: 'Nuevo objeto', valor_pesos: '45000000' }).subscribe();
    const req = http.expectOne(`${CRUD}/contrato_general/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ Objeto: 'Nuevo objeto', ValorPesos: 45000000 });
    req.flush(ok({ Id: 42 }));
  });

  // Filas 6 a 8: CDP
  it('6. GET de CDP del contrato con Activo y limit=0', () => {
    let data: any;
    service.getCdpContrato(42).subscribe((r) => (data = r));
    http
      .expectOne(`${CRUD}/disponibilidad_presupuestal/?${DEL_CONTRATO}&limit=0`)
      .flush(ok([{ Id: 5, NumeroCdpId: 1234, VigenciaCdpId: 2026, ContratoGeneralId: { Id: 42 } }]));
    expect(data.Data).toEqual([{ id: 5, numero_cdp_id: 1234, vigencia_cdp: 2026, contrato_general_id: 42 }]);
  });

  it('7. POST de CDP sin valor_a_tomar (no existe en el modelo v2)', () => {
    service
      .postCdp({ numero_cdp_id: 1234, vigencia_cdp: 2026, fecha_registro: '2026-10-21' as any, contrato_general_id: 42, valor_a_tomar: 9 })
      .subscribe();
    const req = http.expectOne(`${CRUD}/disponibilidad_presupuestal/`);
    expect(req.request.body).toEqual({
      NumeroCdpId: 1234,
      VigenciaCdpId: 2026,
      FechaRegistro: '2026-10-21',
      ContratoGeneralId: { Id: 42 },
    });
    req.flush(ok({ Id: 5 }, '201'));
  });

  it('8. DELETE lógico de CDP', () => {
    service.deleteCdp(5).subscribe();
    const req = http.expectOne(`${CRUD}/disponibilidad_presupuestal/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(ok('registro desactivado (activo = false)'));
  });

  // Filas 9 a 11: estados
  it('9. estado actual con Actual:true, el más reciente y sin envoltorio', () => {
    let estado: any;
    service.getEstadoActual(42).subscribe((r) => (estado = r));
    http
      .expectOne(`${CRUD}/estado_contrato/?${DEL_CONTRATO},Actual:true&sortby=FechaCreacion,Id&order=desc&limit=1`)
      .flush(ok([{ Id: 3, EstadoInternoParametroId: 6799, Actual: true }]));
    expect(estado).toEqual({ id: 3, estado_interno_parametro_id: 6799, actual: true });
  });

  it('10. estados del contrato del más reciente al más antiguo (lista sin envoltorio)', () => {
    let estados: any;
    service.getEstados(42).subscribe((r) => (estados = r));
    http.expectOne(`${CRUD}/estado_contrato/?${DEL_CONTRATO}&sortby=FechaCreacion,Id&order=desc&limit=0`).flush(ok([{}]));
    expect(estados).toEqual([]);
  });

  it('11. POST de estado (el CRUD lo marca como actual)', () => {
    let estado: any;
    service
      .postEstadoContrato({ contrato_general_id: 42, usuario_id: 1, usuario_rol: 'ABOGADO', estado_parametro_id: 6773, estado_interno_parametro_id: 6799 })
      .subscribe((r) => (estado = r));
    const req = http.expectOne(`${CRUD}/estado_contrato/`);
    expect(req.request.body).toEqual({
      ContratoGeneralId: { Id: 42 },
      UsuarioId: 1,
      UsuarioRol: 'ABOGADO',
      EstadoParametroId: 6773,
      EstadoInternoParametroId: 6799,
    });
    req.flush(ok({ Id: 9, Actual: true }, '201'));
    expect(estado).toEqual({ id: 9, actual: true });
  });

  // Filas 12 a 15: especificaciones técnicas
  it('12 a 15. especificaciones: GET, POST, PUT y DELETE', () => {
    service.getEspecificacionesTecnicas(42).subscribe();
    http.expectOne(`${CRUD}/especificacion_tecnica/?${DEL_CONTRATO}&limit=0`).flush(ok([]));

    service.postEspecificacionTecnica({ descripcion: 'Osciloscopio', cantidad: '3', valor_unitario: 10, valor_total: 30, contrato_general_id: 42 }).subscribe();
    const post = http.expectOne(`${CRUD}/especificacion_tecnica/`);
    expect(post.request.body).toEqual({
      Descripcion: 'Osciloscopio',
      Cantidad: 3,
      ValorUnitario: 10,
      ValorTotal: 30,
      ContratoGeneralId: { Id: 42 },
    });
    post.flush(ok({ Id: 1 }, '201'));

    service.putEspecificacionTecnica(1, { id: 1, cantidad: 4 }).subscribe();
    const put = http.expectOne(`${CRUD}/especificacion_tecnica/1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ Cantidad: 4 });
    put.flush(ok({ Id: 1 }));

    service.deleteEspecificacionTecnica(1).subscribe();
    expect(http.expectOne(`${CRUD}/especificacion_tecnica/1`).request.method).toBe('DELETE');
  });

  // Filas 16 a 18: contratista en contrato_general
  it('16. el contratista se lee de contrato_general', () => {
    let data: any;
    service.getContratista(42).subscribe((r) => (data = r));
    http.expectOne(`${CRUD}/contrato_general/42`).flush(
      ok({ Id: 42, ProveedorNumeroDocumento: '1014285890', TipoPersonaId: 1, ClaseProveedorId: 0 })
    );
    expect(data.Success).toBe(true);
    expect(data.Data).toEqual({ id: 42, numero_documento: '1014285890', tipo_persona_id: 1, clase_proveedor_id: null });
  });

  it('16. sin documento de proveedor no hay contratista', () => {
    let data: any;
    service.getContratista(42).subscribe((r) => (data = r));
    http.expectOne(`${CRUD}/contrato_general/42`).flush(ok({ Id: 42, ProveedorNumeroDocumento: '' }));
    expect(data.Success).toBe(false);
    expect(data.Data).toBeNull();
  });

  it('17 y 18. el contratista se guarda con PUT parcial en contrato_general', () => {
    service.postContratista({ numero_documento: '1014285890', tipo_persona_id: 1, contrato_general_id: 42 }).subscribe();
    const req = http.expectOne(`${CRUD}/contrato_general/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ ProveedorNumeroDocumento: '1014285890', TipoPersonaId: 1 });
    req.flush(ok({ Id: 42 }));

    service.putContratista({ id: 42, numero_documento: '900123', tipo_persona_id: 2, contrato_general_id: 42 }).subscribe();
    expect(http.expectOne(`${CRUD}/contrato_general/42`).request.body).toEqual({
      ProveedorNumeroDocumento: '900123',
      TipoPersonaId: 2,
    });
  });

  // Filas 19 a 21: solicitante en contrato_general
  it('19 a 21. el solicitante se lee y se guarda en contrato_general', () => {
    let leido: any;
    service.getSolicitante(42).subscribe((r) => (leido = r));
    http.expectOne(`${CRUD}/contrato_general/42`).flush(ok({ Id: 42, SedeSolicitanteId: 10, DependenciaSolicitanteId: 20 }));
    expect(leido.Data).toEqual({ id: 42, sede_solicitante_id: 10, dependencia_solicitante_id: 20 });

    let guardado: any;
    service.postSolicitante({ sede_solicitante_id: 10, dependencia_solicitante_id: 21, contrato_general_id: 42 }).subscribe((r) => (guardado = r));
    const req = http.expectOne(`${CRUD}/contrato_general/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ SedeSolicitanteId: 10, DependenciaSolicitanteId: 21 });
    req.flush(ok({ Id: 42 }));
    expect(guardado.id).toBe(42);

    service.patchSolicitante(42, { sede_solicitante_id: 11, dependencia_solicitante_id: 21, contrato_general_id: 42 }).subscribe();
    expect(http.expectOne(`${CRUD}/contrato_general/42`).request.method).toBe('PUT');
  });

  it('19. sin sede ni dependencia de solicitante en el contrato responde 404', () => {
    let estado: number | undefined;
    service.getSolicitante(42).subscribe({ error: (e) => (estado = e.status) });
    http.expectOne(`${CRUD}/contrato_general/42`).flush(ok({ Id: 42, SedeSolicitanteId: 0, DependenciaSolicitanteId: 0 }));
    expect(estado).toBe(404);
  });

  it('Tipo y Alcance del Control se guarda en ContratoGeneral.TipoControlId', () => {
    service.putTipoControl(42, 6611).subscribe();
    const req = http.expectOne(`${CRUD}/contrato_general/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ TipoControlId: 6611 });
  });

  // Filas 23 y 24: ordenador (uno solo por contrato)
  const ORDENADOR_ACTIVO = `${CRUD}/ordenador_contrato/?${DEL_CONTRATO}&sortby=FechaCreacion,Id&order=desc&limit=1`;
  const ordenador = { ordenador_argo_id: 1, ordenador_sicapital_id: 1001, documento_identidad: '19456789', cargo_id: 12, contrato_general_id: 42 };

  it('24. si el contrato ya tiene ordenador activo lo actualiza (no duplica)', () => {
    service.postOrdenadorContrato(ordenador).subscribe();
    http.expectOne(ORDENADOR_ACTIVO).flush(ok([{ Id: 71, ContratoGeneralId: { Id: 42 } }]));
    const req = http.expectOne(`${CRUD}/ordenador_contrato/71`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      OrdenadorArgoId: 1,
      OrdenadorSicapitalId: 1001,
      DocumentoIdentidad: '19456789',
      CargoId: 12,
      ContratoGeneralId: { Id: 42 },
    });
    req.flush(ok({ Id: 71 }));
  });

  it('24. si no hay ordenador activo lo crea', () => {
    service.postOrdenadorContrato(ordenador).subscribe();
    http.expectOne(ORDENADOR_ACTIVO).flush(ok([{}]));
    const req = http.expectOne(`${CRUD}/ordenador_contrato/`);
    expect(req.request.method).toBe('POST');
    req.flush(ok({ Id: 72 }, '201'));
  });

  it('23. ordenador guardado: activo con envoltorio, o 404 si no hay', () => {
    let data: any;
    service.gerOrdenadorGuardado(42).subscribe((r) => (data = r));
    http.expectOne(ORDENADOR_ACTIVO).flush(ok([{ Id: 71, OrdenadorArgoId: 1 }]));
    expect(data.Data).toEqual({ id: 71, ordenador_argo_id: 1 });

    let estado: number | undefined;
    service.gerOrdenadorGuardado(42).subscribe({ error: (e) => (estado = e.status) });
    http.expectOne(ORDENADOR_ACTIVO).flush(ok([{}]));
    expect(estado).toBe(404);
  });

  // Filas 25 a 27: supervisores
  it('25 a 27. supervisores: GET, POST con enteros y PUT (sin envoltorio al guardar)', () => {
    service.getSupervisores(42).subscribe();
    http.expectOne(`${CRUD}/supervisor_contrato/?${DEL_CONTRATO}&sortby=Id&order=asc&limit=0`).flush(ok([]));

    const supervisor = {
      supervisor_id: '7788',
      sede_legado: 'Sede Calle 40',
      dependencia_legado: 'Facultad',
      cargo_legado: 'Decano',
      cargo_id: '45',
      documento: '79865432',
      digito_verificacion: '3',
      sede_id: '10',
      dependencia_id: '20',
      contrato_general_id: 42,
    };
    let creado: any;
    service.postSupervisor(supervisor).subscribe((r) => (creado = r));
    const post = http.expectOne(`${CRUD}/supervisor_contrato/`);
    expect(post.request.body).toEqual({
      SupervisorId: 7788,
      SedeLegado: 'Sede Calle 40',
      DependenciaLegado: 'Facultad',
      CargoLegado: 'Decano',
      CargoId: 45,
      Documento: 79865432,
      DigitoVerificacion: 3,
      SedeId: 10,
      DependenciaId: 20,
      ContratoGeneralId: { Id: 42 },
    });
    post.flush(ok({ Id: 61 }, '201'));
    expect(creado).toEqual({ id: 61 });

    service.patchSupervisor(61, supervisor).subscribe();
    expect(http.expectOne(`${CRUD}/supervisor_contrato/61`).request.method).toBe('PUT');
  });

  // Filas 28 y 29: documentos (documento_contrato polimórfica)
  it('28. documento vigente: EntidadTipo/EntidadId/TipoDocumentoId, el más reciente', () => {
    let documentos: any;
    service.getDocumentoActual(42, 6805).subscribe((r) => (documentos = r));
    http
      .expectOne(
        `${CRUD}/documento_contrato/?query=EntidadTipo:contrato_general,EntidadId:42,TipoDocumentoId:6805,Activo:true&sortby=FechaCreacion,Id&order=desc&limit=1`
      )
      .flush(ok([{ Id: 4, EntidadTipo: 'contrato_general', EntidadId: 42, DocumentoEnlace: 'uuid' }]));
    expect(documentos).toEqual([
      { id: 4, entidad_tipo: 'contrato_general', entidad_id: 42, documento_enlace: 'uuid', contrato_general_id: 42 },
    ]);
  });

  it('29. POST de documento con EntidadTipo contrato_general (sin envoltorio)', () => {
    let documento: any;
    service
      .postDocumentoContrato({ contrato_general_id: 42, tipo_documento_id: 6805, documento_id: 15, documento_enlace: 'uuid', usuario_id: 1, usuario_rol: 'ABOGADO' })
      .subscribe((r) => (documento = r));
    const req = http.expectOne(`${CRUD}/documento_contrato/`);
    expect(req.request.body).toEqual({
      TipoDocumentoId: 6805,
      DocumentoId: 15,
      DocumentoEnlace: 'uuid',
      UsuarioId: 1,
      UsuarioRol: 'ABOGADO',
      EntidadTipo: 'contrato_general',
      EntidadId: 42,
    });
    req.flush(ok({ Id: 8 }, '201'));
    expect(documento).toEqual({ id: 8 });
  });

  // Fila 33: amparos del contrato
  it('33. amparos del contrato en /v1/amparo_poliza', () => {
    let data: any;
    polizas.getAmparos(42).subscribe((r) => (data = r));
    http
      .expectOne(`${CRUD}/amparo_poliza/?${DEL_CONTRATO}&sortby=Id&order=asc&limit=0`)
      .flush(ok([{ Id: 1, AmparoId: 6602, TipoValorAmparoId: 2, Suficiencia: 20, PolizaId: null, ContratoGeneralId: { Id: 42 } }]));
    expect(data.Data).toEqual([
      { id: 1, amparo_id: 6602, tipo_valor_amparo_id: 2, suficiencia: 20, poliza_id: null, contrato_general_id: 42 },
    ]);
  });
});
