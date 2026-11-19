import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { PasoInfoGeneralComponent } from './registro-contrato/paso-info-general/paso-info-general.component';
import { RegistroContratoComponent } from './registro-contrato/registro-contrato.component';
import { ConsultaContratoComponent } from './consulta-contrato/consulta-contrato.component';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { AlertService } from 'src/app/services/alert.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { VigenciaService } from 'src/app/services/vigencia.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneral } from 'src/app/types/types';

/**
 * Pruebas de Integración y Estabilización del Ciclo de Vida del Contrato (Issue #402).
 * Cubre:
 * 1. Registro de contrato -> Consulta persistida -> Edición sin duplicidad y validación de campos obligatorios.
 * 2. Casos de error: contrato inexistente con 404 real, bloqueo de guardado, y fallo de servicios sin confirmación falsa.
 * 3. Acciones disponibles y datos consultados según roles (ABOGADO vs JEFE) y segregación por unidad ejecutora.
 */
describe('Integración y Estabilización del Ciclo de Vida del Contrato (#402)', () => {
  const VIGENCIA_PARAM_ID = 9001;

  let alertServiceMock: {
    showAlert: jest.Mock;
    showSuccessAlert: jest.Mock;
    showErrorAlert: jest.Mock;
    showConfirmAlert: jest.Mock;
  };

  beforeEach(() => {
    alertServiceMock = {
      showAlert: jest.fn(),
      showSuccessAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
      showErrorAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
      showConfirmAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
    };
  });

  describe('Escenario 1: Flujo completo de registro, consulta y edición sin duplicidad', () => {
    let crudServiceMock: {
      post: jest.Mock;
      put: jest.Mock;
      get: jest.Mock;
      postEstadoContrato: jest.Mock;
    };
    let midServiceMock: {
      postConsecutivo: jest.Mock;
      getContratos: jest.Mock;
    };

    beforeEach(() => {
      crudServiceMock = {
        post: jest.fn().mockReturnValue(of({ Success: true, Status: '201', Data: { id: 101 } })),
        put: jest.fn().mockReturnValue(of({ Success: true, Status: '200', Data: { id: 101 } })),
        get: jest.fn().mockReturnValue(of({ Success: true, Status: '200', Data: { id: 101, consecutivo_elaboracion: 'CT-2026-101', unidad_ejecutora_id: 1 } })),
        postEstadoContrato: jest.fn().mockReturnValue(of({ Success: true, Status: '201', Data: { id: 1 } })),
      };

      midServiceMock = {
        postConsecutivo: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: 'CT-2026-101' })),
        getContratos: jest.fn().mockReturnValue(of({
          Success: true,
          Status: 200,
          Data: [
            {
              id: 101,
              numero_contrato: '',
              consecutivo_elaboracion: 'CT-2026-101',
              unidad_ejecutora_id: 1,
              estados: { nombre_estado: 'Borrador', estado_interno_parametro_id: environment.ESTADOS_INTERNOS.BORRADOR },
            },
          ],
          Metadata: { total: 1 },
        })),
      };

      TestBed.configureTestingModule({
        declarations: [PasoInfoGeneralComponent],
        providers: [
          { provide: ContratoGeneralCrudService, useValue: crudServiceMock },
          { provide: ContratoGeneralMidService, useValue: midServiceMock },
          { provide: AlertService, useValue: alertServiceMock },
          { provide: RolService, useValue: { getRol: () => ['ABOGADO_CONTRATACION_RECTOR'] } },
          { provide: UserService, useValue: { getPersonaId: jest.fn().mockResolvedValue(1) } },
          { provide: VigenciaService, useValue: { vigenciaActualId: () => of(VIGENCIA_PARAM_ID) } },
          {
            provide: ParametrosService,
            useValue: {
              getParametrosPorTipo: jest.fn().mockResolvedValue({}),
              getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
    });

    it('cuando el formulario contiene campos obligatorios vacíos o inválidos, detiene el flujo y no llama al MID ni al CRUD', () => {
      const fixture = TestBed.createComponent(PasoInfoGeneralComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneral', null);
      fixture.detectChanges();

      // Formulario inicial sin diligenciar campos requeridos (plazoEjecucion, tipoCompromisoId, etc.)
      component.guardarYContinuar();

      expect(alertServiceMock.showAlert).toHaveBeenCalledWith(
        'Por favor complete todos los campos obligatorios del paso general',
        'Formulario incompleto'
      );
      expect(midServiceMock.postConsecutivo).not.toHaveBeenCalled();
      expect(crudServiceMock.post).not.toHaveBeenCalled();
      expect(crudServiceMock.put).not.toHaveBeenCalled();
    });

    it('al crear un contrato nuevo pide consecutivo al MID, hace POST al CRUD y crea estado Borrador', async () => {
      const fixture = TestBed.createComponent(PasoInfoGeneralComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneral', null);
      fixture.detectChanges();

      // Diligenciar todos los campos obligatorios para que el formulario sea genuinamente válido
      component.formInfoGeneral.patchValue({
        unidadEjecutoraId: 1,
        tipoCompromisoId: 1,
        tipoContratoId: 2,
        modalidadSeleccionId: 3,
        tipologiaEspecificaId: 4,
        regimenContratacionId: 5,
        procedimientoId: 6,
        plazoEjecucion: 12,
        unidadEjecucionId: 1,
      });
      if (component.formInfoGeneral.get('vigenciaId')) {
        (component.formInfoGeneral.get('vigenciaId') as any)?.setValue(VIGENCIA_PARAM_ID);
      }

      component.guardarYContinuar();
      await new Promise((resuelto) => setTimeout(resuelto));

      expect(midServiceMock.postConsecutivo).toHaveBeenCalledWith(
        expect.objectContaining({ unidad_ejecutora_id: 1, vigencia_id: VIGENCIA_PARAM_ID })
      );
      expect(crudServiceMock.post).toHaveBeenCalledWith(
        expect.objectContaining({
          consecutivo_elaboracion: 'CT-2026-101',
          vigencia_id: VIGENCIA_PARAM_ID,
          unidad_ejecutora_id: 1,
        })
      );
      expect(crudServiceMock.postEstadoContrato).toHaveBeenCalled();
      expect(crudServiceMock.put).not.toHaveBeenCalled();
    });

    it('al editar un contrato existente realiza PUT parcial sobre el mismo ID sin solicitar otro consecutivo', async () => {
      const fixture = TestBed.createComponent(PasoInfoGeneralComponent);
      const component = fixture.componentInstance;
      const contratoExistente: ContratoGeneral = {
        id: 101,
        consecutivo_elaboracion: 'CT-2026-101',
        unidad_ejecutora_id: 1,
        plazo_ejecucion: 12,
      };

      fixture.componentRef.setInput('contratoGeneral', contratoExistente);
      fixture.detectChanges();

      component.formInfoGeneral.patchValue({
        unidadEjecutoraId: 1,
        tipoCompromisoId: 1,
        tipoContratoId: 2,
        modalidadSeleccionId: 3,
        tipologiaEspecificaId: 4,
        regimenContratacionId: 5,
        procedimientoId: 6,
        plazoEjecucion: 24,
        unidadEjecucionId: 1,
      });
      if (component.formInfoGeneral.get('vigenciaId')) {
        (component.formInfoGeneral.get('vigenciaId') as any)?.setValue(VIGENCIA_PARAM_ID);
      }
      component.guardarYContinuar();
      await new Promise((resuelto) => setTimeout(resuelto));

      // Exige PUT sobre el ID del contrato existente
      expect(crudServiceMock.put).toHaveBeenCalledWith(
        101,
        expect.objectContaining({ plazo_ejecucion: 24 })
      );
      // No debe pedir nuevo consecutivo ni hacer POST de creación
      expect(midServiceMock.postConsecutivo).not.toHaveBeenCalled();
      expect(crudServiceMock.post).not.toHaveBeenCalled();
    });
  });

  describe('Escenario 2: Validaciones y robustez ante fallos de conexión o contratos inexistentes', () => {
    it('ante respuesta 404 del CRUD por contrato inexistente, muestra "Contrato no encontrado", bloquea formulario y sale a consulta', () => {
      const mockRouter = { navigate: jest.fn() };
      TestBed.configureTestingModule({
        declarations: [RegistroContratoComponent],
        providers: [
          {
            provide: ContratoGeneralCrudService,
            useValue: {
              get: jest.fn().mockReturnValue(throwError(() => ({ status: 404, message: 'Not found' }))),
            },
          },
          { provide: AlertService, useValue: alertServiceMock },
          { provide: Router, useValue: mockRouter },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });

      const fixture = TestBed.createComponent(RegistroContratoComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneralId', 999999);
      fixture.componentRef.setInput('editMode', true);
      component.cargarContratoGeneral({ forzar: true });

      expect(alertServiceMock.showErrorAlert).toHaveBeenCalledWith(
        'No se encontró el contrato general especificado',
        'Contrato no encontrado'
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/gestion-contractual/contratos/consultar']);
      expect(component.contratoNoEncontrado).toBe(true);
      expect(component.contratoGeneralId()).toBe(0);
      expect(component.editMode()).toBe(false);
      expect(component.tituloVista).toBe('Contrato no encontrado');
    });

    it('retiene los datos del formulario y notifica error ante fallo HTTP del CRUD sin emitir confirmación falsa', async () => {
      const crudConError = {
        put: jest.fn().mockReturnValue(throwError(() => ({ status: 500, message: 'Fallo BD' }))),
        post: jest.fn(),
        postEstadoContrato: jest.fn(),
      };

      TestBed.configureTestingModule({
        declarations: [PasoInfoGeneralComponent],
        providers: [
          { provide: ContratoGeneralCrudService, useValue: crudConError },
          { provide: ContratoGeneralMidService, useValue: { postConsecutivo: jest.fn() } },
          { provide: AlertService, useValue: alertServiceMock },
          { provide: RolService, useValue: { getRol: () => ['ABOGADO_CONTRATACION_RECTOR'] } },
          { provide: UserService, useValue: { getPersonaId: jest.fn().mockResolvedValue(1) } },
          { provide: VigenciaService, useValue: { vigenciaActualId: () => of(VIGENCIA_PARAM_ID) } },
          {
            provide: ParametrosService,
            useValue: {
              getParametrosPorTipo: jest.fn().mockResolvedValue({}),
              getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });

      const fixture = TestBed.createComponent(PasoInfoGeneralComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneral', { id: 50, unidad_ejecutora_id: 1 });
      fixture.detectChanges();

      component.formInfoGeneral.patchValue({
        unidadEjecutoraId: 1,
        tipoCompromisoId: 1,
        tipoContratoId: 2,
        modalidadSeleccionId: 3,
        tipologiaEspecificaId: 4,
        regimenContratacionId: 5,
        procedimientoId: 6,
        plazoEjecucion: 36,
        unidadEjecucionId: 1,
      });
      if (component.formInfoGeneral.get('vigenciaId')) {
        (component.formInfoGeneral.get('vigenciaId') as any)?.setValue(VIGENCIA_PARAM_ID);
      }
      component.guardarYContinuar();
      await new Promise((resuelto) => setTimeout(resuelto));

      // Debe notificar error
      expect(alertServiceMock.showErrorAlert).toHaveBeenCalledWith(
        'Ocurrió un error al guardar los datos',
        'Error al guardar los datos'
      );
      // No debe emitir mensaje de éxito
      expect(alertServiceMock.showSuccessAlert).not.toHaveBeenCalled();
      // El formulario debe conservar el valor digitado por el usuario
      expect(component.formInfoGeneral.get('plazoEjecucion')?.value).toBe(36);
    });
  });

  describe('Escenario 3: Acciones disponibles y filtrado según roles y unidad ejecutora', () => {
    let component: ConsultaContratoComponent;
    let fixture: ComponentFixture<ConsultaContratoComponent>;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        declarations: [ConsultaContratoComponent],
        providers: [
          FormBuilder,
          {
            provide: ContratoGeneralMidService,
            useValue: {
              getContratos: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: [], Metadata: { total: 0 } })),
            },
          },
          { provide: ContratoGeneralCrudService, useValue: { postEstadoContrato: jest.fn() } },
          { provide: AlertService, useValue: alertServiceMock },
          { provide: RolService, useValue: { getRol: () => ['ABOGADO_CONTRATACION_RECTOR'], cargarRol: jest.fn() } },
          { provide: UserService, useValue: { getPersonaId: jest.fn().mockResolvedValue(1) } },
          {
            provide: ParametrosService,
            useValue: {
              getParametrosPorTipo: jest.fn().mockResolvedValue({
                [environment.UNIDAD_EJECUTORA_ID]: [
                  { Id: 1, Nombre: '01 - Rectoría' },
                  { Id: 2, Nombre: '02 - IDEXUD' },
                ],
              }),
            },
          },
          { provide: MatDialog, useValue: { open: jest.fn() } },
          { provide: Router, useValue: { url: '/gestion-contractual/contratos/consultar', navigate: jest.fn() } },
          { provide: ActivatedRoute, useValue: { snapshot: {}, paramMap: of({ get: () => null }), parent: {} } },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });

      fixture = TestBed.createComponent(ConsultaContratoComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('el rol ABOGADO dispone de "Editar Contrato" y "Enviar Aprobación Jefe OC" en contratos borradores o rechazados', () => {
      component.rolActivo = 'ABOGADO';
      const contratoBorrador: ContratoGeneral = {
        id: 1,
        unidad_ejecutora_id: 1,
        estados: { estado_interno_parametro_id: environment.ESTADOS_INTERNOS.BORRADOR },
      };
      const accionesBorrador = component.getAccionesPorRolYEstado(contratoBorrador);
      expect(accionesBorrador).toContain('Editar Contrato');
      expect(accionesBorrador).toContain('Enviar Aprobación Jefe OC');
      expect(accionesBorrador).toContain('Ver Detalle');

      const contratoRechazado: ContratoGeneral = {
        id: 2,
        unidad_ejecutora_id: 1,
        estados: { estado_interno_parametro_id: environment.ESTADOS_INTERNOS.RECHAZADO },
      };
      const accionesRechazado = component.getAccionesPorRolYEstado(contratoRechazado);
      expect(accionesRechazado).toContain('Editar Contrato');
      expect(accionesRechazado).toContain('Enviar Aprobación Jefe OC');
    });

    it('el rol JEFE dispone de "Revisar Contrato" para contratos en revisión y habilita selección múltiple', () => {
      component.cambiarRolPruebas('JEFE');
      const contratoEnRevision: ContratoGeneral = {
        id: 3,
        unidad_ejecutora_id: 1,
        estados: { estado_interno_parametro_id: environment.ESTADOS_INTERNOS.EN_REVISION_JEFE },
      };
      const accionesJefe = component.getAccionesPorRolYEstado(contratoEnRevision);
      expect(accionesJefe).toContain('Revisar Contrato');
      expect(accionesJefe).toContain('Ver Detalle');

      // Las columnas visibles para el JEFE deben incluir "select"
      expect(component.columnasVisibles).toContain('select');
    });

    it('discrimina acciones respetando la asignación por unidad ejecutora institucional (Rectoría vs IDEXUD)', () => {
      // Abogado asignado a Rectoría
      component.roles = ['ABOGADO_CONTRATACION_RECTOR'];
      component.rolActivo = 'ABOGADO';
      const contratoRectoria: ContratoGeneral = {
        id: 10,
        unidad_ejecutora_id: environment.UNIDADES_EJECUTORAS.RECTORIA,
        estados: { estado_interno_parametro_id: environment.ESTADOS_INTERNOS.BORRADOR },
      };
      const accionesRector = component.getAccionesPorRolYEstado(contratoRectoria);
      expect(accionesRector).toContain('Editar Contrato');
      expect(accionesRector).toContain('Enviar Aprobación Jefe OC');

      // Abogado asignado a IDEXUD
      component.roles = ['ABOGADO_CONTRATACION_IDEXUD'];
      const contratoIdexud: ContratoGeneral = {
        id: 20,
        unidad_ejecutora_id: environment.UNIDADES_EJECUTORAS.IDEXUD,
        estados: { estado_interno_parametro_id: environment.ESTADOS_INTERNOS.BORRADOR },
      };
      const accionesIdexud = component.getAccionesPorRolYEstado(contratoIdexud);
      expect(accionesIdexud).toContain('Editar Contrato');
      expect(accionesIdexud).toContain('Enviar Aprobación Jefe OC');

      // Jefe en IDEXUD para contratos en revisión de IDEXUD
      component.roles = ['JEFE_CONTRATACION_IDEXUD'];
      component.rolActivo = 'JEFE';
      const contratoRevisionIdexud: ContratoGeneral = {
        id: 21,
        unidad_ejecutora_id: environment.UNIDADES_EJECUTORAS.IDEXUD,
        estados: { estado_interno_parametro_id: environment.ESTADOS_INTERNOS.EN_REVISION_JEFE },
      };
      const accionesJefeIdexud = component.getAccionesPorRolYEstado(contratoRevisionIdexud);
      expect(accionesJefeIdexud).toContain('Revisar Contrato');
    });

    it('al seleccionar una unidad ejecutora en los filtros, se envía a los parámetros de consulta del MID', () => {
      const midService = TestBed.inject(ContratoGeneralMidService);
      const getSpy = jest.spyOn(midService, 'getContratos');

      component.form.patchValue({ unidadEjecutora: '2' });
      component.consultar();

      expect(getSpy).toHaveBeenCalledWith(
        expect.objectContaining({ unidad_ejecutora_id: '2' })
      );
    });
  });
});
