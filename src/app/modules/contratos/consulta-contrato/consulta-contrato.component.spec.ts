import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { UserService } from 'src/app/services/user.service';
import { ConsultaContratoComponent } from './consulta-contrato.component';
import { ModalSeleccionarUeComponent } from './modal-seleccionar-ue/modal-seleccionar-ue.component';
import { ModalValidarContratistaComponent } from './modal-validar-contratista/modal-validar-contratista.component';

describe('ConsultaContratoComponent', () => {
  let component: ConsultaContratoComponent;
  let fixture: ComponentFixture<ConsultaContratoComponent>;
  let mockAlertService: { showErrorAlert: jest.Mock; showSuccessAlert: jest.Mock };
  let mockMatDialog: { open: jest.Mock };
  let mockParametrosService: { get: jest.Mock; getParametrosPorTipo: jest.Mock; getParametroPorPadreIdyTipoId: jest.Mock; };
  let mockContratoMidService: { getContratos: jest.Mock; getEstados: jest.Mock };
  let mockRolService: { getRol: jest.Mock };
  let mockRouter: { navigate: jest.Mock };
  let mockCrudService: { postEstadoContrato: jest.Mock };
  let mockUserService: { getPersonaId: jest.Mock };

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
      getParametrosPorTipo: jest.fn().mockResolvedValue({
        [environment.UNIDAD_EJECUTORA_ID]: [
          { Id: 1, Nombre: '01 - Rectoría' },
          { Id: 2, Nombre: '02 - IDEXUD' },
        ],
        [environment.VIGENCIA_ID]: [
          { Id: 1, Nombre: '2026' },
          { Id: 2, Nombre: '2025' },
        ],
        [environment.TIPO_CONTRATO_ID]: [{ Id: 1, Nombre: 'Prestación de Servicios' }],
        [environment.TIPO_PERSONA_ID]: [{ Id: 1, Nombre: 'Natural' }],
        [environment.TIPO_ESTADO_ID]: [
          { Id: 6774, Nombre: 'Suscrito' },
          { Id: 6773, Nombre: 'Por suscribir' },
        ],
      }),
      getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
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

    mockCrudService = {
      postEstadoContrato: jest.fn().mockReturnValue(of({ id: 1 })),
    };

    mockUserService = {
      getPersonaId: jest.fn().mockResolvedValue(1),
    };

    TestBed.configureTestingModule({
      declarations: [ConsultaContratoComponent],
      providers: [
        FormBuilder,
        { provide: AlertService, useValue: mockAlertService },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: ParametrosService, useValue: mockParametrosService },
        { provide: ContratoGeneralMidService, useValue: mockContratoMidService },
        { provide: ContratoGeneralCrudService, useValue: mockCrudService },
        { provide: UserService, useValue: mockUserService },
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
    const anioActual = new Date().getFullYear().toString();
    expect(component.hayFiltrosActivos()).toBe(true);
    expect(component.getResumenFiltrosActivos()).toContain(`Vigencia: ${anioActual}`);

    component.form.patchValue({ contratista: 'CAROLINA' });
    expect(component.hayFiltrosActivos()).toBe(true);
    expect(component.getResumenFiltrosActivos()).toContain('Contratista: CAROLINA');

    component.form.patchValue({ vigencia: '', contratista: '' });
    component.vigenciaSeleccionada = '';
    expect(component.hayFiltrosActivos()).toBe(false);
    expect(component.getResumenFiltrosActivos()).toContain('Haga clic para desplegar');
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

  it('debe filtrar la tabla por el estado elegido en las tarjetas de resumen', () => {
    const consultarSpy = jest.spyOn(component, 'consultar');
    component.seleccionarPestanaEstado('6774');
    expect(component.estadoTabActivo).toBe('6774');
    expect(component.form.get('estado')?.value).toBe('6774');
    expect(consultarSpy).toHaveBeenCalled();
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

  it('debe limpiar los filtros y recargar la vista manteniendo la vigencia presente por defecto', () => {
    const anioActual = new Date().getFullYear().toString();
    component.form.patchValue({ contratista: '123', numeroContrato: '50' });
    component.estadoTabActivo = 'Suscrito';

    component.limpiarFiltros();

    expect(component.form.get('contratista')?.value).toBeNull();
    expect(component.estadoTabActivo).toBe('');
    expect(component.vigenciaSeleccionada).toBe(anioActual);
    expect(component.form.get('vigencia')?.value).toBe(anioActual);
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

  it('debe incluir valor_contrato y estado en displayedColumns y formatear correctamente el valor del contrato', () => {
    expect(component.displayedColumns).toContain('valor_contrato');
    expect(component.displayedColumns).toContain('estado');
    expect(component.displayedColumns).toContain('numero_contrato');

    expect(component.getValorContrato({ valor_pesos: 50000000 })).toContain('50.000.000');
    expect(component.getValorContrato({ valor_contrato_me: 12500000 })).toContain('12.500.000');
    expect(component.getValorContrato({ valor: '3500000' })).toContain('3.500.000');
    expect(component.getValorContrato({ valor_pesos: null, valor: undefined })).toBe('N/A');
    expect(component.getValorContrato(null)).toBe('N/A');
  });

  describe('Flujo de Aprobación y Rechazo Masivo (Issue #382)', () => {
    it('debe incluir la columna "select" en columnasVisibles cuando el rol activo es JEFE', () => {
      component.rolActivo = 'JEFE';
      expect(component.columnasVisibles).toContain('select');
      expect(component.columnasVisibles[0]).toBe('select');
    });

    it('no debe incluir la columna "select" en columnasVisibles cuando el rol activo es ABOGADO', () => {
      component.rolActivo = 'ABOGADO';
      expect(component.columnasVisibles).not.toContain('select');
    });

    it('debe identificar contratos pendientes de aprobación (EN_REVISION_JEFE = 6800) únicamente por estado_interno_parametro_id', () => {
      const c1: any = { id: 1, estados: { estado_interno_parametro_id: 6800 } };
      const c2: any = { id: 2, estados: { estado_interno_parametro_id: 6799 } };
      const cSinId: any = { id: 3, estados: { nombre_estado: 'No aprobar sin revisión' } };

      expect(component.esContratoPorAprobar(c1)).toBe(true);
      expect(component.esContratoPorAprobar(c2)).toBe(false);
      expect(component.getEstadoInternoId(cSinId)).toBeUndefined();
      expect(component.esContratoPorAprobar(cSinId)).toBe(false);
    });

    it('debe seleccionar y deseleccionar contratos por aprobar masivamente con toggleTodosLosContratos()', () => {
      component.dataSource.data = [
        { id: 1, estados: { estado_interno_parametro_id: 6800 }, valor_pesos: 10000000 } as any,
        { id: 2, estados: { estado_interno_parametro_id: 6800 }, valor_pesos: 20000000 } as any,
        { id: 3, estados: { estado_interno_parametro_id: 6799 }, valor_pesos: 5000000 } as any,
      ];

      expect(component.contratosPorAprobarVisibles.length).toBe(2);
      expect(component.estanTodosSeleccionados()).toBe(false);

      component.toggleTodosLosContratos();
      expect(component.seleccionContratos.selected.length).toBe(2);
      expect(component.estanTodosSeleccionados()).toBe(true);
      expect(component.valorTotalSeleccionado).toBe(30000000);
      expect(component.valorTotalSeleccionadoFormateado).toContain('30.000.000');

      component.toggleTodosLosContratos();
      expect(component.seleccionContratos.selected.length).toBe(0);
      expect(component.estanTodosSeleccionados()).toBe(false);
    });

    it('debe abrir ModalEnviarAprobacionComponent y actualizar estado a EN_REVISION_JEFE', () => {
      const contrato: any = {
        id: 77,
        estados: { estado_interno_parametro_id: 6799, nombre_estado: 'Borrador' },
      };
      mockMatDialog.open.mockReturnValue({
        afterClosed: () => of({ confirmado: true, observacion: 'Revisión urgente' }),
      });

      component.abrirModalEnviarAprobacion(contrato);

      expect(mockMatDialog.open).toHaveBeenCalled();
      expect(contrato.estados.estado_interno_parametro_id).toBe(6800);
      expect(contrato.estados.nombre_estado).toBe('Por aprobar');
      expect(contrato.observaciones).toBe('Revisión urgente');
      expect(mockAlertService.showSuccessAlert).toHaveBeenCalledWith(
        'El contrato fue enviado para aprobación de la Jefatura con éxito.'
      );
    });

    it('debe abrir ModalAprobacionMasivaComponent y aplicar VoBo oficial a los contratos seleccionados', () => {
      const c1: any = { id: 1, estados: { estado_interno_parametro_id: 6800 }, valor_pesos: 15000000 };
      const c2: any = { id: 2, estados: { estado_interno_parametro_id: 6800 }, valor_pesos: 25000000 };
      component.seleccionContratos.select(c1, c2);

      mockMatDialog.open.mockReturnValue({
        afterClosed: () => of({ confirmado: true, observacion: 'VoBo registrado por Jefatura' }),
      });

      component.abrirModalAprobacionMasiva();

      expect(mockMatDialog.open).toHaveBeenCalled();
      expect(c1.estados.estado_interno_parametro_id).toBe(6809);
      expect(c1.estados.nombre_estado).toBe('VoBo Jefatura');
      expect(c1.observaciones).toBe('VoBo registrado por Jefatura');
      expect(c2.estados.estado_interno_parametro_id).toBe(6809);
      expect(component.seleccionContratos.selected.length).toBe(0);
      expect(mockAlertService.showSuccessAlert).toHaveBeenCalledWith(
        'Se ha registrado el VoBo oficial para 2 contrato(s) satisfactoriamente.'
      );
    });

    it('debe abrir ModalRechazoMasivoComponent y aplicar estado RECHAZADO con motivo obligatorio', () => {
      const c1: any = { id: 1, estados: { estado_interno_parametro_id: 6800 } };
      component.seleccionContratos.select(c1);

      mockMatDialog.open.mockReturnValue({
        afterClosed: () => of({ confirmado: true, motivo: 'Corregir pólizas de cumplimiento' }),
      });

      component.abrirModalRechazoMasivo();

      expect(mockMatDialog.open).toHaveBeenCalled();
      expect(c1.estados.estado_interno_parametro_id).toBe(6803);
      expect(c1.estados.nombre_estado).toBe('Rechazado');
      expect(c1.observaciones).toBe('Corregir pólizas de cumplimiento');
      expect(component.seleccionContratos.selected.length).toBe(0);
      expect(mockAlertService.showSuccessAlert).toHaveBeenCalledWith(
        'Se devolvieron 1 contrato(s) con las observaciones de rechazo.'
      );
    });

    it('debe abrir ModalRechazoMasivoComponent y aplicar motivos individuales por contrato cuando se seleccione modalidad individual', () => {
      const c1: any = { id: 10, estados: { estado_interno_parametro_id: 6800 } };
      const c2: any = { id: 20, estados: { estado_interno_parametro_id: 6800 } };
      component.seleccionContratos.select(c1, c2);

      mockMatDialog.open.mockReturnValue({
        afterClosed: () =>
          of({
            confirmado: true,
            tipoObservacion: 'individual',
            motivosPorContrato: {
              10: 'Subsanar CDP para contrato 10',
              20: 'Falta acta de inicio en contrato 20',
            },
          }),
      });

      component.abrirModalRechazoMasivo();

      expect(c1.estados.estado_interno_parametro_id).toBe(6803);
      expect(c1.observaciones).toBe('Subsanar CDP para contrato 10');
      expect(c2.estados.estado_interno_parametro_id).toBe(6803);
      expect(c2.observaciones).toBe('Falta acta de inicio en contrato 20');
      expect(component.seleccionContratos.selected.length).toBe(0);
    });

    it('debe identificar contratos con VoBo de Jefatura y rechazados', () => {
      const cVobo: any = { estados: { estado_interno_parametro_id: 6809 } };
      const cRechazado: any = { estados: { estado_interno_parametro_id: 6803 } };
      const cBorrador: any = { estados: { estado_interno_parametro_id: 6799 } };

      expect(component.tieneVoBoJefatura(cVobo)).toBe(true);
      expect(component.tieneVoBoJefatura(cBorrador)).toBe(false);
      expect(component.esContratoRechazado(cRechazado)).toBe(true);
      expect(component.esContratoRechazado(cBorrador)).toBe(false);
    });

    it('debe asignar badges y nombres de estado acordes para estados internos', () => {
      const cVobo: any = { estados: { estado_interno_parametro_id: 6809 } };
      const cAprobar: any = { estados: { estado_interno_parametro_id: 6800 } };
      const cRech: any = { estados: { estado_interno_parametro_id: 6803 } };
      const cBorrador: any = { estados: { estado_interno_parametro_id: 6799 } };

      expect(component.getEstadoBadgeClass(cVobo)).toBe('status-vobo');
      expect(component.getEstadoNombre(cVobo)).toBe('VoBo Jefatura');

      expect(component.getEstadoBadgeClass(cAprobar)).toBe('status-por-aprobar');
      expect(component.getEstadoNombre(cAprobar)).toBe('Por aprobar');

      expect(component.getEstadoBadgeClass(cRech)).toBe('status-rechazado');
      expect(component.getEstadoNombre(cRech)).toBe('Rechazado');

      expect(component.getEstadoBadgeClass(cBorrador)).toBe('status-borrador');
      expect(component.getEstadoNombre(cBorrador)).toBe('Borrador');
    });

    it('debe ejecutar abrirModalEnviarAprobacion al realizarAccion con Enviar Aprobación Jefe OC', () => {
      const spyModal = jest.spyOn(component, 'abrirModalEnviarAprobacion').mockImplementation();
      const contrato: any = { id: 8 };

      component.realizarAccion(contrato, 'Enviar Aprobación Jefe OC');
      expect(spyModal).toHaveBeenCalledWith(contrato);
    });

    it('no debe mostrar showSuccessAlert ni mutar el estado si postEstadoContrato falla en envío, aprobación o rechazo masivo', () => {
      mockCrudService.postEstadoContrato.mockReturnValue(throwError(() => new Error('Fallo backend')));

      const contratoEnvio: any = {
        id: 77,
        estados: { estado_interno_parametro_id: 6799, nombre_estado: 'Borrador' },
      };
      mockMatDialog.open.mockReturnValueOnce({
        afterClosed: () => of({ confirmado: true, observacion: 'Revisión urgente' }),
      });

      component.abrirModalEnviarAprobacion(contratoEnvio);
      expect(contratoEnvio.estados.estado_interno_parametro_id).toBe(6799);
      expect(mockAlertService.showSuccessAlert).not.toHaveBeenCalled();
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(
        'No fue posible enviar el contrato para aprobación.'
      );

      const cLote: any = { id: 1, estados: { estado_interno_parametro_id: 6800 } };
      component.seleccionContratos.select(cLote);
      mockMatDialog.open.mockReturnValueOnce({
        afterClosed: () => of({ confirmado: true, observacion: 'VoBo' }),
      });

      component.abrirModalAprobacionMasiva();
      expect(cLote.estados.estado_interno_parametro_id).toBe(6800);
      expect(mockAlertService.showSuccessAlert).not.toHaveBeenCalled();
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(
        'Ocurrió un error al registrar la aprobación masiva de contratos.'
      );
    });
  });

  describe('Carga y consumo de parámetros con caché', () => {
    it('debe precargar los parámetros maestros usando getParametrosPorTipo en loadInitialData', async () => {
      await component['loadInitialData']();
      expect(mockParametrosService.getParametrosPorTipo).toHaveBeenCalledWith(component.tiposParametrosRequeridos);
      expect(component.unidadEjecutora.length).toBe(2);
      expect(component.vigencia.length).toBe(2);
      expect(component.vigencia[0].Nombre).toBe('2026');
      expect(component.tipoContratoId.length).toBe(1);
      expect(component.tipoPersona.length).toBe(1);
      expect(component.estado.length).toBe(2);
    });

    it('debe manejar error al fallar la carga de parámetros iniciales', async () => {
      mockParametrosService.getParametrosPorTipo.mockRejectedValueOnce(new Error('Fallo MID'));
      await component['loadInitialData']();
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(
        'Ocurrió un error al cargar los datos iniciales',
        'Error al cargar los datos iniciales'
      );
    });
  });
});

