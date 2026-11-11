import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RevisionContratoComponent } from './revision-contrato.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';
import { environment } from 'src/environments/environment';
import { MinutasMidService } from 'src/app/services/minuta-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { Subject, of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('RevisionContratoComponent', () => {
  let component: RevisionContratoComponent;
  let fixture: ComponentFixture<RevisionContratoComponent>;

  const mockCrudService = {
    get: jest
      .fn()
      .mockReturnValue(
        of({ Success: true, Status: '200', Data: { unidad_ejecutora_id: 1 } })
      ),
    getEstados: jest.fn().mockReturnValue(of({ Success: true, Status: '200', Data: [] })),
    postEstadoContrato: jest.fn().mockReturnValue(of({ Success: true, Status: '201', Data: { id: 3 } })),
  };

  const mockGestionCrudService = {
    getDocumentos: jest.fn().mockReturnValue(of({ Success: true, Status: '200', Data: [] })),
  };

  const mockMinutasMidService = {
    getMinutaPdf: jest.fn().mockReturnValue(of('JVBERi0xLjQK')),
  };

  const mockGestorDocumentalService = {
    getDocumento: jest.fn().mockReturnValue(of({ file: 'JVBERi0xLjQK...' })),
  };

  const mockRolService = {
    getRol: jest.fn().mockReturnValue(['JEFE_CONTRATACION_RECTOR']),
  };

  const mockUserService = {
    getPersonaId: jest.fn().mockResolvedValue(1),
  };

  const mockAlertService = {
    showErrorAlert: jest.fn(),
    showSuccessAlert: jest.fn(),
    showConfirmAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [RevisionContratoComponent],
      providers: [
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: AlertService, useValue: mockAlertService },
        { provide: ContratoGeneralCrudService, useValue: mockCrudService },
        { provide: GestionContractualCrudService, useValue: mockGestionCrudService },
        { provide: ContratoGeneralMidService, useValue: {} },
        { provide: GestorDocumentalService, useValue: mockGestorDocumentalService },
        { provide: MinutasMidService, useValue: mockMinutasMidService },
        { provide: RolService, useValue: mockRolService },
        { provide: UserService, useValue: mockUserService },
      ],
    });
    fixture = TestBed.createComponent(RevisionContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('registro de estados en el CRUD', () => {
    beforeEach(() => {
      component.contrato_general_id = 42;
      jest.clearAllMocks();
    });

    it('consulta los estados del contrato del más reciente al más antiguo', () => {
      component.cargarDatosIniciales();
      expect(mockCrudService.getEstados).toHaveBeenCalledWith({
        query: 'contrato_general_id.id:42,activo:true',
        sortby: 'fecha_creacion,id',
        order: 'desc',
        limit: 0,
      });
    });

    it('toma la minuta vigente por entidad_tipo, entidad_id y tipo, la más reciente', () => {
      mockGestionCrudService.getDocumentos.mockReturnValueOnce(
        of({ Success: true, Status: '200', Data: [{ id: 9, documento_enlace: 'uid-9' }] })
      );
      component.getMinuta();
      expect(mockGestionCrudService.getDocumentos).toHaveBeenCalledWith({
        query:
          'entidad_tipo:contrato_general,entidad_id:42,' +
          `tipo_documento_id:${environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA},activo:true`,
        sortby: 'fecha_creacion,id',
        order: 'desc',
        limit: 1,
      });
      expect(mockGestorDocumentalService.getDocumento).toHaveBeenCalledWith('uid-9');
    });

    it('el modal de la minuta recibe el usuario y el rol con los que se registra', () => {
      (TestBed.inject(MatDialog).open as jest.Mock).mockReturnValue({ afterClosed: () => of(null) });
      jest.spyOn(component, 'getRolPorEstado').mockReturnValue('ORDENADOR_DEL_GASTO');
      component.usuario_id = 7;

      component.abrirModalCargarArchivo();

      const { datos } = (TestBed.inject(MatDialog).open as jest.Mock).mock.calls[0][1].data;
      expect(datos).toEqual(expect.objectContaining({ usuario_id: 7, usuario_rol: 'ORDENADOR_DEL_GASTO' }));
    });

  });
});

describe('RevisionContratoComponent: estados y número de contrato desde el MID', () => {
  const { RECTORIA } = environment.UNIDADES_EJECUTORAS;
  const { EN_FIRMA_ORDENADOR } = environment.ESTADOS_INTERNOS;
  const { SUSCRITO } = environment.ESTADOS_GENERALES;
  const textos = { enviado: 'El contrato fue enviado al contratista' };
  const respuesta = (numero_contrato: string | null, id = 1) => of({ Data: { estado: { id }, numero_contrato } });

  let crud: Record<string, jest.Mock>;
  let mid: Record<string, jest.Mock>;
  let alertas: Record<string, jest.Mock>;

  function montar(contrato: Record<string, unknown>) {
    crud = {
      get: jest.fn().mockReturnValue(of({ Data: { unidad_ejecutora_id: RECTORIA, ...contrato } })),
      getEstados: jest.fn().mockReturnValue(of({ Data: [{ estado_interno_parametro_id: EN_FIRMA_ORDENADOR }] })),
      put: jest.fn(),
      postEstadoContrato: jest.fn(),
    };
    mid = { postEstadoContrato: jest.fn().mockReturnValue(respuesta('7')) };
    alertas = { showErrorAlert: jest.fn(), showSuccessAlert: jest.fn() };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [RevisionContratoComponent],
      providers: [
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: AlertService, useValue: alertas },
        { provide: ContratoGeneralCrudService, useValue: crud },
        { provide: GestionContractualCrudService, useValue: { getDocumentos: jest.fn().mockReturnValue(of({ Data: [] })) } },
        { provide: ContratoGeneralMidService, useValue: mid },
        { provide: GestorDocumentalService, useValue: { getDocumento: jest.fn() } },
        { provide: MinutasMidService, useValue: { getMinutaPdf: jest.fn().mockReturnValue(of('JVBERi0xLjQK')) } },
        { provide: RolService, useValue: { getRol: () => ['ORDENADOR_DEL_GASTO'] } },
        { provide: UserService, useValue: { getPersonaId: jest.fn().mockResolvedValue(9) } },
      ],
    });
    const fixture = TestBed.createComponent(RevisionContratoComponent);
    const component = fixture.componentInstance;
    component.contrato_general_id = 42;
    jest.spyOn(component, 'getIdContratoUrl').mockImplementation(() => undefined);
    fixture.detectChanges();
    component.textos = textos;
    return component;
  }

  it('registra los dos estados en el MID, sin contrato ni número en el cuerpo', async () => {
    const component = montar({ numero_contrato: '' });
    await new Promise((resuelto) => setTimeout(resuelto)); // persona_id llega por promesa
    component.aprobarContrato();

    expect(mid['postEstadoContrato']).toHaveBeenCalledTimes(2);
    const [[id1, primero], [id2, segundo]] = mid['postEstadoContrato'].mock.calls;
    expect([id1, id2]).toEqual([42, 42]);
    expect(segundo.estado_parametro_id).toBe(SUSCRITO);
    for (const cambio of [primero, segundo]) {
      expect(cambio).not.toHaveProperty('contrato_general_id');
      expect(cambio).not.toHaveProperty('numero_contrato');
      expect(cambio).toEqual(expect.objectContaining({ usuario_id: 9, usuario_rol: 'ORDENADOR_DEL_GASTO' }));
    }
  });

  it('no calcula ni guarda el número: no llama al CRUD para eso', () => {
    montar({ numero_contrato: '' }).aprobarContrato();

    expect(crud['put']).not.toHaveBeenCalled();
    expect(crud['postEstadoContrato']).not.toHaveBeenCalled();
  });

  it('muestra el número que asigna el MID', () => {
    const component = montar({ numero_contrato: '' });
    mid['postEstadoContrato'].mockReturnValueOnce(respuesta(null)).mockReturnValueOnce(respuesta('7'));

    component.aprobarContrato();

    expect(component.numero_contrato).toBe('7');
    expect(alertas['showSuccessAlert']).toHaveBeenCalledWith(
      `${textos.enviado}. Número de contrato: 7`,
      'CONTRATO ENVIADO'
    );
  });

  it('si el contrato ya tenía número no lo anuncia como nuevo', () => {
    const component = montar({ numero_contrato: '5' });
    mid['postEstadoContrato'].mockReturnValue(respuesta('5'));

    component.aprobarContrato();

    expect(alertas['showSuccessAlert']).toHaveBeenCalledWith(textos.enviado, 'CONTRATO ENVIADO');
  });

  it('si falla el primer estado no registra el segundo', () => {
    const component = montar({ numero_contrato: '' });
    mid['postEstadoContrato'].mockReturnValue(throwError(() => ({ status: 500 })));

    component.aprobarContrato();

    expect(mid['postEstadoContrato']).toHaveBeenCalledTimes(1);
    expect(alertas['showErrorAlert']).toHaveBeenCalledWith('Error al crear estado automático');
  });

  it('muestra el motivo del MID cuando no puede asignar el número', () => {
    const component = montar({ numero_contrato: '' });
    mid['postEstadoContrato']
      .mockReturnValueOnce(respuesta(null))
      .mockReturnValueOnce(
        throwError(() => ({ status: 400, error: { Message: 'El contrato no tiene vigencia_id' } }))
      );

    component.aprobarContrato();

    expect(alertas['showErrorAlert']).toHaveBeenCalledWith('El contrato no tiene vigencia_id');
    expect(alertas['showSuccessAlert']).not.toHaveBeenCalled();
  });
});

describe('RevisionContratoComponent: pestaña Minuta (#405)', () => {
  const PDF = 'JVBERi0xLjQK';
  const error502 = {
    status: 502,
    tipo: 'servicio',
    mensaje: 'Un servicio no respondió (plantillas_mid). Intente de nuevo.',
    reintentable: true,
    servicio: 'plantillas_mid',
  };
  const error404 = { status: 404, tipo: 'no-encontrado', mensaje: 'El contrato no existe.', reintentable: false };

  let fixture: ComponentFixture<RevisionContratoComponent>;
  let component: RevisionContratoComponent;
  let documentos: jest.Mock;
  let gestor: jest.Mock;
  let minutaPdf: jest.Mock;

  function montar(contratoId = 42) {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [RevisionContratoComponent],
      providers: [
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: AlertService, useValue: { showErrorAlert: jest.fn(), showSuccessAlert: jest.fn() } },
        {
          provide: ContratoGeneralCrudService,
          useValue: { get: jest.fn().mockReturnValue(of({ Data: {} })), getEstados: jest.fn().mockReturnValue(of({ Data: [] })) },
        },
        { provide: GestionContractualCrudService, useValue: { getDocumentos: documentos } },
        { provide: ContratoGeneralMidService, useValue: {} },
        { provide: GestorDocumentalService, useValue: { getDocumento: gestor } },
        { provide: MinutasMidService, useValue: { getMinutaPdf: minutaPdf } },
        { provide: RolService, useValue: { getRol: () => [] } },
        { provide: UserService, useValue: { getPersonaId: jest.fn().mockResolvedValue(1) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(RevisionContratoComponent);
    component = fixture.componentInstance;
    jest.spyOn(component, 'getIdContratoUrl').mockImplementation(() => {
      component.contrato_general_id = contratoId;
    });
    jest.spyOn(component, 'getDocumentosPrecontractuales').mockImplementation(() => undefined);
    fixture.detectChanges();
  }

  const texto = (): string => (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';
  const botonReintentar = (): HTMLButtonElement | undefined =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Reintentar')
    );

  beforeEach(() => {
    documentos = jest.fn().mockReturnValue(of({ Data: [] }));
    gestor = jest.fn().mockReturnValue(of({ file: PDF }));
    minutaPdf = jest.fn().mockReturnValue(of(PDF));
  });

  it('muestra la minuta guardada con "Minuta cargada el dd/mm/aaaa" y no la genera', () => {
    documentos.mockReturnValue(
      of({ Data: [{ id: 9, documento_enlace: 'uid-9', fecha_creacion: '2026-11-10T22:15:00Z' }] })
    );
    montar();

    expect(gestor).toHaveBeenCalledWith('uid-9');
    expect(minutaPdf).not.toHaveBeenCalled();
    expect(component.estadoMinuta).toEqual({ tipo: 'documento', origen: 'guardada', fecha: '10/11/2026' });
    expect(component.documentos.minuta).toBe(PDF);
    expect(texto()).toContain('Minuta cargada el 10/11/2026');
    expect(fixture.nativeElement.querySelector('app-pdf-visualizador')).not.toBeNull();
  });

  it('sin fecha legible la etiqueta dice solo "Minuta cargada"', () => {
    documentos.mockReturnValue(of({ Data: [{ id: 9, documento_enlace: 'uid-9' }] }));
    montar();
    expect(component.etiquetaOrigenMinuta).toBe('Minuta cargada');
  });

  it('sin minuta guardada muestra la generada con su etiqueta', () => {
    montar();

    expect(minutaPdf).toHaveBeenCalledWith(42);
    expect(component.estadoMinuta).toEqual({ tipo: 'documento', origen: 'generada', fecha: null });
    expect(texto()).toContain('Minuta generada con los datos actuales, sin firmar');
  });

  it.each([
    ['falla la consulta de documentos', () => documentos.mockReturnValue(throwError(() => new Error('crud')))],
    ['falla la descarga del gestor', () => {
      documentos.mockReturnValue(of({ Data: [{ documento_enlace: 'uid-9' }] }));
      gestor.mockReturnValue(throwError(() => new Error('gestor')));
    }],
    ['el gestor no trae archivo', () => {
      documentos.mockReturnValue(of({ Data: [{ documento_enlace: 'uid-9' }] }));
      gestor.mockReturnValue(of({}));
    }],
  ])('si %s usa la minuta generada', (_caso, preparar) => {
    preparar();
    montar();
    expect(minutaPdf).toHaveBeenCalledWith(42);
    expect(component.etiquetaOrigenMinuta).toBe('Minuta generada con los datos actuales, sin firmar');
  });

  it('mientras carga muestra el spinner local', () => {
    minutaPdf.mockReturnValue(new Subject<string>());
    montar();

    expect(component.estadoMinuta).toEqual({ tipo: 'cargando' });
    expect(fixture.nativeElement.querySelector('.estado-minuta mat-spinner')).not.toBeNull();
    expect(texto()).toContain('Cargando minuta…');
    expect(fixture.nativeElement.querySelector('app-pdf-visualizador')).toBeNull();
  });

  it('con un error reintentable muestra el mensaje y "Reintentar"', () => {
    minutaPdf.mockReturnValue(throwError(() => error502));
    montar();

    expect(component.estadoMinuta).toEqual({ tipo: 'error', mensaje: error502.mensaje, reintentable: true });
    expect(texto()).toContain(error502.mensaje);
    expect(botonReintentar()).toBeDefined();
    expect(fixture.nativeElement.querySelector('app-pdf-visualizador')).toBeNull();
  });

  it('con un error no reintentable no ofrece "Reintentar"', () => {
    minutaPdf.mockReturnValue(throwError(() => error404));
    montar();

    expect(texto()).toContain('El contrato no existe.');
    expect(botonReintentar()).toBeUndefined();
  });

  it('con un error que no es de la minuta muestra el texto genérico', () => {
    minutaPdf.mockReturnValue(throwError(() => new Error('Http failure response for …: 0 Unknown Error')));
    montar();

    expect(texto()).toContain('No se pudo generar la minuta. Intente de nuevo.');
    expect(texto()).not.toContain('Http failure');
    expect(botonReintentar()).toBeDefined();
  });

  it('"Reintentar" borra el documento anterior antes de volver a pedir', () => {
    minutaPdf.mockReturnValueOnce(throwError(() => error502));
    montar();
    component.documentos.minuta = 'documento-anterior';
    let minutaAlPedir: string | undefined;
    let estadoAlPedir: string | undefined;
    minutaPdf.mockImplementationOnce(() => {
      minutaAlPedir = component.documentos.minuta;
      estadoAlPedir = component.estadoMinuta.tipo;
      return of(PDF);
    });

    botonReintentar()!.click();
    fixture.detectChanges();

    expect(minutaAlPedir).toBe('');
    expect(estadoAlPedir).toBe('cargando');
    expect(component.estadoMinuta).toEqual({ tipo: 'documento', origen: 'generada', fecha: null });
    expect(component.documentos.minuta).toBe(PDF);
  });

  it('sin contrato muestra "No hay minuta disponible."', () => {
    montar(0);

    expect(component.estadoMinuta).toEqual({ tipo: 'sin-documento' });
    expect(texto()).toContain('No hay minuta disponible.');
    expect(minutaPdf).not.toHaveBeenCalled();
  });

  it('si el visor no puede abrir el PDF muestra "La minuta llegó vacía o dañada."', () => {
    montar();

    component.onErrorVisorMinuta();
    fixture.detectChanges();

    expect(component.documentos.minuta).toBe('');
    expect(texto()).toContain('La minuta llegó vacía o dañada.');
    expect(botonReintentar()).toBeDefined();
  });
});
