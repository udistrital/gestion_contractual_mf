import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MinutaDocumento, MinutaDocumentoService } from './minuta-documento.service';
import { GestionContractualCrudService } from './gestion-contractual-crud.service';
import { GestorDocumentalService } from './gestor-documental.service';
import { MinutasMidService } from './minuta-mid.service';
import { ErrorMinuta } from '../types/types';

const E = environment.ESTADOS_INTERNOS;
const PDF_CARGADO = 'JVBERi1jYXJnYWRv';
const PDF_GENERADO = 'JVBERi1nZW5lcmFkbw==';

describe('MinutaDocumentoService', () => {
  let servicio: MinutaDocumentoService;
  let getDocumentos: jest.Mock;
  let getDocumento: jest.Mock;
  let getMinutaPdf: jest.Mock;

  beforeEach(() => {
    getDocumentos = jest.fn().mockReturnValue(
      of({ Data: [{ id: 9, documento_enlace: 'uid-9', fecha_creacion: '2026-11-10T22:15:00Z' }] })
    );
    getDocumento = jest.fn().mockReturnValue(of({ file: PDF_CARGADO }));
    getMinutaPdf = jest.fn().mockReturnValue(of(PDF_GENERADO));
    TestBed.configureTestingModule({
      providers: [
        { provide: GestionContractualCrudService, useValue: { getDocumentos } },
        { provide: GestorDocumentalService, useValue: { getDocumento } },
        { provide: MinutasMidService, useValue: { getMinutaPdf } },
      ],
    });
    servicio = TestBed.inject(MinutaDocumentoService);
  });

  function obtener(estado: number | null) {
    const r: { minuta?: MinutaDocumento; error?: unknown } = {};
    servicio.obtenerMinuta(7, estado).subscribe({ next: (m) => (r.minuta = m), error: (e) => (r.error = e) });
    return r;
  }

  it.each([
    ['Borrador', E.BORRADOR],
    ['Rechazado', E.RECHAZADO],
    ['sin estado', null],
  ])(
    '%s: genera aunque haya una minuta cargada, sin consultarla',
    (_caso, estado) => {
      expect(obtener(estado as number | null).minuta).toEqual({ base64: PDF_GENERADO, origen: 'generada' });
      expect(getDocumentos).not.toHaveBeenCalled();
      expect(getMinutaPdf).toHaveBeenCalledWith(7);
    }
  );

  it('En revisión del jefe: devuelve la minuta cargada (la registrada al enviar) y no genera', () => {
    expect(obtener(E.EN_REVISION_JEFE).minuta).toEqual({
      base64: PDF_CARGADO,
      origen: 'cargada',
      fecha: '2026-11-10T22:15:00Z',
    });
    expect(getMinutaPdf).not.toHaveBeenCalled();
  });

  it('Aprobado por el jefe con minuta cargada: la devuelve con su fecha y no genera', () => {
    expect(obtener(E.APROBADO_JEFE).minuta).toEqual({
      base64: PDF_CARGADO,
      origen: 'cargada',
      fecha: '2026-11-10T22:15:00Z',
    });
    expect(getDocumentos).toHaveBeenCalledWith({
      query: `entidad_tipo:contrato_general,entidad_id:7,tipo_documento_id:${environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA},activo:true`,
      sortby: 'fecha_creacion,id',
      order: 'desc',
      limit: 1,
    });
    expect(getDocumento).toHaveBeenCalledWith('uid-9');
    expect(getMinutaPdf).not.toHaveBeenCalled();
  });

  it.each<[string, () => void]>([
    ['no hay minuta cargada', () => getDocumentos.mockReturnValue(of({ Data: [] }))],
    ['falla la consulta de documentos', () => getDocumentos.mockReturnValue(throwError(() => new Error('crud')))],
    ['falla la descarga del gestor', () => getDocumento.mockReturnValue(throwError(() => new Error('gestor')))],
    ['el gestor no trae archivo', () => getDocumento.mockReturnValue(of({}))],
  ])('fuera de Borrador, si %s, genera una sola vez', (_caso, preparar) => {
    preparar();
    expect(obtener(E.EN_FIRMA_ORDENADOR).minuta).toEqual({ base64: PDF_GENERADO, origen: 'generada' });
    expect(getMinutaPdf).toHaveBeenCalledTimes(1);
  });

  it('el error al generar llega tal cual (ErrorMinuta) y no se reintenta', () => {
    const error: ErrorMinuta = { status: 502, tipo: 'servicio', mensaje: 'x', reintentable: true };
    getDocumentos.mockReturnValue(of({ Data: [] }));
    getMinutaPdf.mockReturnValue(throwError(() => error));
    expect(obtener(E.FIRMAS_COMPLETAS).error).toBe(error);
    expect(getMinutaPdf).toHaveBeenCalledTimes(1);
  });

  it('no genera mientras la consulta de la minuta cargada no responde', () => {
    const consulta = new Subject<unknown>();
    getDocumentos.mockReturnValue(consulta);
    const r = obtener(E.APROBADO_JEFE);
    expect(getMinutaPdf).not.toHaveBeenCalled();
    consulta.next({ Data: [] });
    consulta.complete();
    expect(r.minuta?.origen).toBe('generada');
  });
});

describe('MinutaDocumentoService.registrarMinutaVigente (envío al jefe, #405)', () => {
  const MINUTA = environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA;
  let servicio: MinutaDocumentoService;
  let getMinutaPdf: jest.Mock;
  let postAny: jest.Mock;
  let postDocumento: jest.Mock;
  let getDocumentos: jest.Mock;
  let desactivarDocumento: jest.Mock;
  let warn: jest.SpyInstance;
  let orden: string[];

  beforeEach(() => {
    orden = [];
    getMinutaPdf = jest.fn(() => (orden.push('generar'), of(PDF_GENERADO)));
    postAny = jest.fn(() => (orden.push('subir'), of({ Status: '200', res: { Id: 4100, Enlace: 'uid-nueva' } })));
    postDocumento = jest.fn(() => (orden.push('registrar'), of({ Data: { id: 30 } })));
    getDocumentos = jest.fn(() => of({ Data: [{ id: 30 }, { id: 12 }, { id: 21 }] }));
    desactivarDocumento = jest.fn((id: number) => (orden.push(`desactivar ${id}`), of({ Data: { Id: id } })));
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: GestionContractualCrudService, useValue: { getDocumentos, postDocumento, desactivarDocumento } },
        { provide: GestorDocumentalService, useValue: { postAny } },
        { provide: MinutasMidService, useValue: { getMinutaPdf } },
      ],
    });
    servicio = TestBed.inject(MinutaDocumentoService);
  });

  afterEach(() => warn.mockRestore());

  function registrar() {
    const r: { id?: number; error?: unknown; completo?: boolean } = {};
    servicio.registrarMinutaVigente(7, 33, 'ABOGADO_CONTRATACION_RECTOR').subscribe({
      next: (id) => (r.id = id),
      error: (e) => (r.error = e),
      complete: () => (r.completo = true),
    });
    return r;
  }

  it('éxito: genera, sube, registra y desactiva las anteriores, nunca la nueva', () => {
    const r = registrar();

    expect(r).toEqual({ id: 30, completo: true });
    expect(orden).toEqual(['generar', 'subir', 'registrar', 'desactivar 12', 'desactivar 21']);
    expect(getMinutaPdf).toHaveBeenCalledWith(7);
    expect(postAny).toHaveBeenCalledWith(
      'document/upload',
      [
        {
          IdTipoDocumento: environment.TIPO_DOCUMENTO_ID_GESTOR_DOCUMENTAL.MINUTAS,
          nombre: 'MINUTA 7',
          descripcion: 'Minuta generada al enviar a revisión del jefe, contrato general id 7',
          metadatos: {},
          file: PDF_GENERADO,
        },
      ],
      'todos'
    );
    expect(postDocumento).toHaveBeenCalledWith(
      {
        tipo_documento_id: MINUTA,
        entidad_tipo: 'contrato_general',
        entidad_id: 7,
        usuario_id: 33,
        usuario_rol: 'ABOGADO_CONTRATACION_RECTOR',
        documento_id: 4100,
        documento_enlace: 'uid-nueva',
      },
      'todos'
    );
    expect(getDocumentos).toHaveBeenCalledWith({
      query: `entidad_tipo:contrato_general,entidad_id:7,tipo_documento_id:${MINUTA},activo:true`,
      limit: 0,
    });
    expect(desactivarDocumento).not.toHaveBeenCalledWith(30, expect.anything());
    expect(desactivarDocumento).toHaveBeenCalledTimes(2);
    expect(warn).not.toHaveBeenCalled();
  });

  it('sin minutas anteriores no desactiva nada', () => {
    getDocumentos.mockReturnValue(of({ Data: [{ id: 30 }] }));
    expect(registrar()).toEqual({ id: 30, completo: true });
    expect(desactivarDocumento).not.toHaveBeenCalled();
  });

  it.each([
    [
      'faltan datos (422)',
      {
        status: 422,
        tipo: 'faltan-datos',
        mensaje: 'Faltan datos en el paso General y Presupuestal: ordenador del gasto.',
        reintentable: true,
        faltantes: ['ordenador'],
      },
    ],
    [
      'un servicio no responde (502)',
      {
        status: 502,
        tipo: 'servicio',
        mensaje: 'No se pudo generar la minuta. Intente en unos minutos; si el problema continúa, contacte a soporte.',
        reintentable: true,
      },
    ],
  ])('falla al generar por %s: propaga el ErrorMinuta y no sube, registra ni desactiva', (_caso, error) => {
    getMinutaPdf.mockReturnValue(throwError(() => error as ErrorMinuta));
    const r = registrar();
    expect(r.error).toEqual(error);
    expect(postAny).not.toHaveBeenCalled();
    expect(postDocumento).not.toHaveBeenCalled();
    expect(desactivarDocumento).not.toHaveBeenCalled();
  });

  const ERROR_REGISTRO = {
    status: null,
    tipo: 'registro',
    mensaje: 'No se pudo guardar la minuta. Intente en unos minutos; si el problema continúa, contacte a soporte.',
    reintentable: true,
  };

  it.each([
    ['un error HTTP', () => throwError(() => ({ status: 500 }))],
    ['una respuesta sin Id', () => of({ Status: '200', res: {} })],
  ])('falla al subir al gestor (%s): error de registro y no registra ni desactiva', (_caso, respuesta) => {
    postAny.mockImplementation(respuesta);
    const r = registrar();
    expect(r.error).toEqual(ERROR_REGISTRO);
    expect(postDocumento).not.toHaveBeenCalled();
    expect(desactivarDocumento).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it.each([
    ['un error HTTP', () => throwError(() => ({ status: 400 }))],
    ['una respuesta sin id', () => of({ Data: {} })],
  ])('falla al registrar (%s): error de registro, avisa la minuta huérfana en el gestor y no desactiva', (_caso, respuesta) => {
    postDocumento.mockImplementation(respuesta);
    const r = registrar();
    expect(r.error).toEqual(ERROR_REGISTRO);
    expect(desactivarDocumento).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no se registró'),
      expect.objectContaining({ contratoId: 7, documento_id: 4100, documento_enlace: 'uid-nueva' })
    );
  });

  it('falla al desactivar una anterior: avisa y continúa con las demás y con el envío', () => {
    desactivarDocumento.mockImplementation((id: number) =>
      id === 12 ? throwError(() => ({ status: 500 })) : (orden.push(`desactivar ${id}`), of({}))
    );
    const r = registrar();
    expect(r).toEqual({ id: 30, completo: true });
    expect(desactivarDocumento).toHaveBeenCalledWith(21, 'todos');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('No se pudieron desactivar'),
      expect.objectContaining({ contratoId: 7, idVigente: 30 })
    );
  });

  it('falla la consulta de las anteriores: avisa y continúa con el envío', () => {
    getDocumentos.mockReturnValue(throwError(() => ({ status: 502 })));
    expect(registrar()).toEqual({ id: 30, completo: true });
    expect(desactivarDocumento).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No se pudieron desactivar'), expect.anything());
  });
});
