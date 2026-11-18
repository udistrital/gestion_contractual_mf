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

  it.each([['Borrador', E.BORRADOR], ['Rechazado', E.RECHAZADO], ['sin estado', null]])(
    '%s: genera aunque haya una minuta cargada, sin consultarla',
    (_caso, estado) => {
      expect(obtener(estado as number | null).minuta).toEqual({ base64: PDF_GENERADO, origen: 'generada' });
      expect(getDocumentos).not.toHaveBeenCalled();
      expect(getMinutaPdf).toHaveBeenCalledWith(7);
    }
  );

  it('En revisión del jefe con minuta cargada: la devuelve con su fecha y no genera', () => {
    expect(obtener(E.EN_REVISION_JEFE).minuta).toEqual({
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
    const r = obtener(E.EN_REVISION_JEFE);
    expect(getMinutaPdf).not.toHaveBeenCalled();
    consulta.next({ Data: [] });
    consulta.complete();
    expect(r.minuta?.origen).toBe('generada');
  });
});
