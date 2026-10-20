import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { ConsultaContratoComponent } from './consulta-contrato.component';
import { ModalSeleccionarUeComponent } from './modal-seleccionar-ue/modal-seleccionar-ue.component';
import { ModalValidarContratistaComponent } from './modal-validar-contratista/modal-validar-contratista.component';

describe('ConsultaContratoComponent', () => {
  let component: ConsultaContratoComponent;
  let fixture: ComponentFixture<ConsultaContratoComponent>;
  let mockAlertService: { showErrorAlert: jest.Mock; showSuccessAlert: jest.Mock };
  let mockMatDialog: { open: jest.Mock };
  let mockParametrosService: { get: jest.Mock };
  let mockContratoMidService: { getContratos: jest.Mock; getEstados: jest.Mock };
  let mockRolService: { getRol: jest.Mock };
  let mockRouter: { navigate: jest.Mock };

  beforeEach(() => {
    mockAlertService = {
      showErrorAlert: jest.fn().mockResolvedValue(true),
      showSuccessAlert: jest.fn().mockResolvedValue(true),
    };

    mockMatDialog = {
      open: jest.fn(),
    };

    mockParametrosService = {
      get: jest.fn().mockReturnValue(of({ Status: '200', Data: [{ Id: 1, Nombre: '01 - Rectoría' }] })),
    };

    mockContratoMidService = {
      getContratos: jest.fn().mockReturnValue(
        of({
          Success: true,
          Status: 200,
          Data: [
            {
              id: 101,
              numero_contrato: 'CTR-2026-0042',
              vigencia: '2026',
              tipoContratoId: 'Prestación de Servicios',
              estados: { estado_parametro_id: 'Suscrito', nombre_estado: 'Suscrito' },
              contratista: { nombre: 'CAROLINA MORALES', numero_documento: '1014285934' },
            },
            {
              id: 102,
              numero_contrato: 'CTR-2026-0089',
              vigencia: '2026',
              tipoContratoId: 'Prestación de Servicios',
              estados: { estado_parametro_id: 'Por suscribir', nombre_estado: 'Por suscribir' },
              contratista: { nombre: 'CARLOS RAMIREZ', numero_documento: '80194223' },
            },
          ],
          Metadata: { total: 2 },
        })
      ),
      getEstados: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: [] })),
    };

    mockRolService = {
      getRol: jest.fn().mockReturnValue(['JEFE_CONTRATACION_RECTOR']),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      declarations: [ConsultaContratoComponent],
      providers: [
        FormBuilder,
        { provide: AlertService, useValue: mockAlertService },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: ParametrosService, useValue: mockParametrosService },
        { provide: ContratoGeneralMidService, useValue: mockContratoMidService },
        { provide: RolService, useValue: mockRolService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: {}, paramMap: of({ get: () => null }), parent: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente e inicializar rol JEFE', () => {
    expect(component).toBeTruthy();
    expect(component.rolActivo).toBe('JEFE');
    expect(component.totalRegistros).toBe(2);
  });

  it('debe inicializar rol ABOGADO si el usuario solo tiene roles de abogado', () => {
    mockRolService.getRol.mockReturnValue(['ABOGADO_CONTRATACION_RECTOR']);
    const fixtureAbogado = TestBed.createComponent(ConsultaContratoComponent);
    const compAbogado = fixtureAbogado.componentInstance;
    compAbogado.roles = ['ABOGADO_CONTRATACION_RECTOR'];
    compAbogado.determinarRolInicial();
    expect(compAbogado.rolActivo).toBe('ABOGADO');
  });

  it('debe permitir cambiar de rol en modo pruebas', () => {
    component.cambiarRolPruebas('ABOGADO');
    expect(component.rolActivo).toBe('ABOGADO');
    component.cambiarRolPruebas('JEFE');
    expect(component.rolActivo).toBe('JEFE');
  });

  it('debe reaccionar al cambio de vigencia y consultar nuevamente', () => {
    const spyConsultar = jest.spyOn(component, 'consultar');
    component.onVigenciaChange('2025');
    expect(component.vigenciaSeleccionada).toBe('2025');
    expect(component.form.get('vigencia')?.value).toBe('2025');
    expect(spyConsultar).toHaveBeenCalled();
  });

  it('debe filtrar al seleccionar una pestaña de estado con su ID numérico', () => {
    const spyConsultar = jest.spyOn(component, 'consultar');
    component.seleccionarPestanaEstado('6773');
    expect(component.estadoTabActivo).toBe('6773');
    expect(component.form.get('estado')?.value).toBe('6773');
    expect(spyConsultar).toHaveBeenCalled();
  });

  it('debe alternar la visibilidad de los filtros superiores con toggleFiltros', () => {
    expect(component.filtrosExpandidos).toBe(false);
    component.toggleFiltros();
    expect(component.filtrosExpandidos).toBe(true);
    component.toggleFiltros();
    expect(component.filtrosExpandidos).toBe(false);
  });

  it('debe detectar correctamente si hay filtros activos y generar el resumen informativo', () => {
    expect(component.hayFiltrosActivos()).toBe(false);
    expect(component.getResumenFiltrosActivos()).toContain('Haga clic para desplegar');

    component.form.patchValue({ contratista: 'CAROLINA' });
    expect(component.hayFiltrosActivos()).toBe(true);
    expect(component.getResumenFiltrosActivos()).toContain('Contratista: CAROLINA');
  });

  it('debe mapear nombre o ID de estado a número entero en prepararParametros para evitar error 400', () => {
    component.form.patchValue({ estado: 'Por suscribir' });
    const params1 = component['prepararParametros']();
    expect(typeof params1.estados.estado_parametro_id).toBe('number');
    expect(params1.estados.estado_parametro_id).toBe(6773);

    component.form.patchValue({ estado: '6774' });
    const params2 = component['prepararParametros']();
    expect(params2.estados.estado_parametro_id).toBe(6774);
  });

  it('debe filtrar por alerta y alternarla al hacer clic nuevamente', () => {
    component.filtrarPorAlerta('vencer');
    expect(component.alertaFiltroActiva).toBe('vencer');
    component.filtrarPorAlerta('vencer');
    expect(component.alertaFiltroActiva).toBe('');
  });

  it('debe abrir modal de selección de Unidad Ejecutora y encadenar validación de contratista al confirmar', () => {
    const mockDialogUe = {
      afterClosed: jest.fn().mockReturnValue(of({ id: 1, codigo: '01', nombre: '01 - Rectoría' })),
    };
    const mockDialogContratista = {
      afterClosed: jest.fn().mockReturnValue(
        of({
          accion: 'crearContrato',
          contratista: { proveedor: { nombre: 'INGRID MORALES' } },
        })
      ),
    };

    mockMatDialog.open
      .mockReturnValueOnce(mockDialogUe)
      .mockReturnValueOnce(mockDialogContratista);

    component.abrirModalCrearContrato();

    expect(mockMatDialog.open).toHaveBeenCalledWith(ModalSeleccionarUeComponent, expect.any(Object));
    expect(mockMatDialog.open).toHaveBeenCalledWith(ModalValidarContratistaComponent, expect.objectContaining({
      data: { unidadEjecutora: { id: 1, codigo: '01', nombre: '01 - Rectoría' } }
    }));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['registrar'], {
      relativeTo: component['route'].parent,
      state: {
        unidadEjecutora: '01',
        unidadEjecutoraId: 1,
        unidadEjecutoraNombre: '01 - Rectoría',
        contratistaPrevalidado: { proveedor: { nombre: 'INGRID MORALES' } },
        bloquearContratista: true,
      },
    });
  });

  it('debe abrir modal de validación de contratista y encadenar modal de UE al seleccionar crear contrato', () => {
    const mockDialogProveedor = {
      afterClosed: jest.fn().mockReturnValue(
        of({
          accion: 'crearContrato',
          contratista: { proveedor: { nombre: 'INGRID MORALES' } },
        })
      ),
    };
    const mockDialogUe = {
      afterClosed: jest.fn().mockReturnValue(of({ id: 2, codigo: '02', nombre: '02 - IDEXUD' })),
    };

    mockMatDialog.open
      .mockReturnValueOnce(mockDialogProveedor)
      .mockReturnValueOnce(mockDialogUe);

    component.abrirModalValidarContratista();

    expect(mockMatDialog.open).toHaveBeenCalledWith(ModalValidarContratistaComponent, expect.any(Object));
    expect(mockMatDialog.open).toHaveBeenCalledWith(ModalSeleccionarUeComponent, expect.any(Object));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['registrar'], {
      relativeTo: component['route'].parent,
      state: {
        unidadEjecutora: '02',
        unidadEjecutoraId: 2,
        unidadEjecutoraNombre: '02 - IDEXUD',
        contratistaPrevalidado: { proveedor: { nombre: 'INGRID MORALES' } },
        bloquearContratista: true,
      },
    });
  });

  it('debe retornar la clase de color correcta según el estado en getEstadoBadgeClass', () => {
    expect(component.getEstadoBadgeClass({ estados: { nombre_estado: 'Borrador' } } as any)).toBe('status-borrador');
    expect(component.getEstadoBadgeClass({ estados: { nombre_estado: 'Por suscribir' } } as any)).toBe('status-suscribir');
    expect(component.getEstadoBadgeClass({ estados: { nombre_estado: 'Suscrito' } } as any)).toBe('status-suscrito');
    expect(component.getEstadoBadgeClass({ estados: { nombre_estado: 'Legalizado' } } as any)).toBe('status-legalizado');
    expect(component.getEstadoBadgeClass({ estados: { nombre_estado: 'En ejecución' } } as any)).toBe('status-ejecucion');
    expect(component.getEstadoBadgeClass({ estados: { nombre_estado: 'Declinado' } } as any)).toBe('status-declinado');
  });

  it('debe retornar el nombre de la unidad ejecutora correctamente', () => {
    component.unidadEjecutora = [
      { Id: 1, Nombre: '01 - Rectoría' },
      { Id: 2, Nombre: '02 - IDEXUD' },
    ];
    expect(component.getNombreUnidadEjecutora(1)).toBe('01 - Rectoría');
    expect(component.getNombreUnidadEjecutora(2)).toBe('02 - IDEXUD');
    expect(component.getNombreUnidadEjecutora(null)).toBe('01 - Rectoría');
  });

  it('debe limpiar los filtros y recargar la vista', () => {
    component.form.patchValue({ contratista: '123', numeroContrato: '50' });
    component.estadoTabActivo = 'Suscrito';
    component.alertaFiltroActiva = 'vencer';

    component.limpiarFiltros();

    expect(component.form.get('contratista')?.value).toBeNull();
    expect(component.estadoTabActivo).toBe('');
    expect(component.alertaFiltroActiva).toBe('');
  });

  it('debe manejar error al consultar contratos', () => {
    mockContratoMidService.getContratos.mockReturnValue(throwError(() => new Error('Error backend')));
    component.consultar();
    expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith('Error al consultar contratos');
    expect(component.isLoading).toBe(false);
  });

  it('debe resolver nombres y fallbacks N/A para tipo de contrato, persona y contratista', () => {
    component.tipoContratoId = [{ Id: 1, Nombre: 'Prestación de Servicios' }];
    component.tipoPersona = [{ Id: 1, Nombre: 'Natural' }];

    expect(component.getNombreTipoContrato(1)).toBe('Prestación de Servicios');
    expect(component.getNombreTipoContrato(null)).toBe('N/A');

    expect(component.getTipoPersona({ contratista: { tipo_persona_id: 1 } })).toBe('Natural');
    expect(component.getTipoPersona(null)).toBe('N/A');

    expect(component.getNombreContratista({ contratista: { nombre: 'JUAN PABLO' } })).toBe('JUAN PABLO');
    expect(component.getNombreContratista(null)).toBe('N/A');
    expect(component.getDocumentoContratista({ contratista: { numero_documento: '123' } })).toBe('123');
    expect(component.getDocumentoContratista(null)).toBeNull();
  });

  it('debe incluir valor_contrato en displayedColumns y formatear correctamente el valor del contrato', () => {
    expect(component.displayedColumns).toContain('valor_contrato');

    expect(component.getValorContrato({ valor_pesos: 50000000 })).toContain('50.000.000');
    expect(component.getValorContrato({ valor_contrato_me: 12500000 })).toContain('12.500.000');
    expect(component.getValorContrato({ valor: '3500000' })).toContain('3.500.000');
    expect(component.getValorContrato({ valor_pesos: null, valor: undefined })).toBe('N/A');
    expect(component.getValorContrato(null)).toBe('N/A');
  });
});

