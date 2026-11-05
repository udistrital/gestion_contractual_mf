import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RevisionContratoComponent } from './revision-contrato.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { MinutasMidService } from 'src/app/services/minuta-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { of, throwError } from 'rxjs';

describe('RevisionContratoComponent', () => {
  let component: RevisionContratoComponent;
  let fixture: ComponentFixture<RevisionContratoComponent>;

  const mockCrudService = {
    get: jest
      .fn()
      .mockReturnValue(
        of({ Success: true, Status: 200, Data: { unidad_ejecutora_id: 1 } })
      ),
    getEstados: jest.fn().mockReturnValue(of([])),
    getDocumentoActual: jest.fn().mockReturnValue(of([])),
  };

  const mockMinutasMidService = {
    getMinuta: jest
      .fn()
      .mockReturnValue(of({ Success: true, Data: 'JVBERi0xLjQK...' })),
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
});

describe('RevisionContratoComponent: número de contrato al aprobar', () => {
  const { RECTORIA } = environment.UNIDADES_EJECUTORAS;
  const { EN_FIRMA_ORDENADOR } = environment.ESTADOS_INTERNOS;
  const { SUSCRITO } = environment.ESTADOS_GENERALES;
  const textos = { enviado: 'El contrato fue enviado al contratista' };

  let crud: Record<string, jest.Mock>;
  let mid: Record<string, jest.Mock>;
  let alertas: Record<string, jest.Mock>;
  let orden: string[];

  function montar(contrato: Record<string, unknown>) {
    orden = [];
    crud = {
      get: jest.fn().mockReturnValue(of({ Data: { unidad_ejecutora_id: RECTORIA, ...contrato } })),
      getEstados: jest.fn().mockReturnValue(of([{ estado_interno_parametro_id: EN_FIRMA_ORDENADOR }])),
      getDocumentoActual: jest.fn().mockReturnValue(of([])),
      put: jest.fn().mockImplementation(() => {
        orden.push('put');
        return of({ Success: true, Status: 200, Data: {} });
      }),
      postEstadoContrato: jest.fn().mockImplementation(() => {
        orden.push('estado');
        return of({ id: 1 });
      }),
    };
    mid = { postNumeroContrato: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: '7' })) };
    alertas = { showErrorAlert: jest.fn(), showSuccessAlert: jest.fn() };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [RevisionContratoComponent],
      providers: [
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: AlertService, useValue: alertas },
        { provide: ContratoGeneralCrudService, useValue: crud },
        { provide: ContratoGeneralMidService, useValue: mid },
        { provide: GestorDocumentalService, useValue: { getDocumento: jest.fn() } },
        { provide: MinutasMidService, useValue: { getMinuta: jest.fn().mockReturnValue(of({ Data: 'pdf' })) } },
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

  it.each([[''], [null], [undefined]])('genera el número cuando numero_contrato es %j', (numero) => {
    montar({ numero_contrato: numero }).aprobarContrato();
    expect(mid['postNumeroContrato']).toHaveBeenCalledTimes(1);
  });

  it('no genera otro número si el contrato ya lo tiene', () => {
    montar({ numero_contrato: '5', vigencia: '2026' }).aprobarContrato();
    expect(mid['postNumeroContrato']).not.toHaveBeenCalled();
    expect(crud['put']).not.toHaveBeenCalled();
    expect(crud['postEstadoContrato']).toHaveBeenCalledTimes(2);
  });

  it('envía la vigencia y la unidad del contrato', () => {
    montar({ numero_contrato: '', vigencia: '2025' }).aprobarContrato();
    expect(mid['postNumeroContrato']).toHaveBeenCalledWith({
      unidad_ejecutora_id: RECTORIA,
      vigencia: '2025',
      estado: SUSCRITO,
    });
  });

  it('sin vigencia en el contrato envía el año actual como texto', () => {
    montar({ numero_contrato: null, vigencia: null }).aprobarContrato();
    expect(mid['postNumeroContrato'].mock.calls[0][0].vigencia).toBe(String(new Date().getFullYear()));
  });

  it('guarda número y vigencia antes de registrar los estados', () => {
    montar({ numero_contrato: '', vigencia: '' }).aprobarContrato();
    expect(crud['put']).toHaveBeenCalledWith(42, {
      numero_contrato: '7',
      vigencia: String(new Date().getFullYear()),
    });
    expect(orden).toEqual(['put', 'estado', 'estado']);
    expect(alertas['showSuccessAlert']).toHaveBeenCalledWith(
      `${textos.enviado}. Número de contrato: 7`,
      'CONTRATO ENVIADO'
    );
  });

  it('si el MID falla muestra el error y no registra estados', () => {
    const component = montar({ numero_contrato: '' });
    mid['postNumeroContrato'].mockReturnValue(throwError(() => new Error('500')));
    component.aprobarContrato();
    expect(alertas['showErrorAlert']).toHaveBeenCalledWith('Error al generar número de contrato');
    expect(crud['put']).not.toHaveBeenCalled();
    expect(crud['postEstadoContrato']).not.toHaveBeenCalled();
  });

  it('si el MID responde sin éxito muestra el error y no registra estados', () => {
    const component = montar({ numero_contrato: '' });
    mid['postNumeroContrato'].mockReturnValue(of({ Success: false, Status: 500 }));
    component.aprobarContrato();
    expect(alertas['showErrorAlert']).toHaveBeenCalled();
    expect(crud['postEstadoContrato']).not.toHaveBeenCalled();
  });

  it('si no se puede guardar el número no registra estados', () => {
    const component = montar({ numero_contrato: '' });
    crud['put'].mockReturnValue(throwError(() => new Error('500')));
    component.aprobarContrato();
    expect(alertas['showErrorAlert']).toHaveBeenCalledWith('Error al guardar número de contrato');
    expect(crud['postEstadoContrato']).not.toHaveBeenCalled();
    expect(component.numero_contrato).toBe('');
  });

  it('un reintento tras fallar los estados no genera otro número', () => {
    const component = montar({ numero_contrato: '' });
    crud['postEstadoContrato'].mockReturnValue(throwError(() => new Error('500')));
    component.aprobarContrato();
    expect(alertas['showErrorAlert']).toHaveBeenCalledWith('Error al crear estado automático');

    crud['postEstadoContrato'].mockReturnValue(of({ id: 1 }));
    component.aprobarContrato();
    expect(mid['postNumeroContrato']).toHaveBeenCalledTimes(1);
  });
});
