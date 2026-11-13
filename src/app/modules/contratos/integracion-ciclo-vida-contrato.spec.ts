import { TestBed } from '@angular/core/testing';
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
 * 1. Registro de contrato -> Consulta persistida -> Edición sin duplicidad.
 * 2. Casos de error: validaciones, identificador inexistente y fallo de servicios sin confirmación falsa.
 * 3. Acciones disponibles y datos consultados según roles (ABOGADO vs JEFE) y unidad ejecutora.
 */
describe('Integración y Estabilización del Ciclo de Vida del Contrato (#402)', () => {
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
          { provide: VigenciaService, useValue: { vigenciaActualId: () => of(2026) } },
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

    it('al crear un contrato nuevo pide consecutivo al MID, hace POST al CRUD y crea estado Borrador', async () => {
      const fixture = TestBed.createComponent(PasoInfoGeneralComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneral', null);
      fixture.detectChanges();

      jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
      component.formInfoGeneral.patchValue({
        tipoCompromisoId: 1,
        tipoContratoId: 2,
        modalidadSeleccionId: 3,
        tipologiaEspecificaId: 4,
        regimenContratacionId: 5,
        procedimientoId: 6,
        plazoEjecucion: 12,
        unidadEjecucionId: 1,
        unidadEjecutoraId: 1,
      });

      component.guardarYContinuar();
      await new Promise((resuelto) => setTimeout(resuelto));

      expect(midServiceMock.postConsecutivo).toHaveBeenCalledWith(
        expect.objectContaining({ unidad_ejecutora_id: 1, vigencia_id: 2026 })
      );
      expect(crudServiceMock.post).toHaveBeenCalledWith(
        expect.objectContaining({
          consecutivo_elaboracion: 'CT-2026-101',
          vigencia_id: 2026,
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

      jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
      component.formInfoGeneral.patchValue({ plazoEjecucion: 24, unidadEjecutoraId: 1 });
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
    it('muestra alerta clara cuando el contrato consultado por ID no existe o viene vacío', () => {
      TestBed.configureTestingModule({
        declarations: [RegistroContratoComponent],
        providers: [
          {
            provide: ContratoGeneralCrudService,
            useValue: { get: jest.fn().mockReturnValue(of({ Success: true, Data: null })) },
          },
          { provide: AlertService, useValue: alertServiceMock },
          { provide: Router, useValue: { navigate: jest.fn() } },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });

      const fixture = TestBed.createComponent(RegistroContratoComponent);
      const component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneralId', 9999);
      component.cargarContratoGeneral({ forzar: true });

      expect(alertServiceMock.showErrorAlert).toHaveBeenCalledWith(
        'No se encontró el contrato general especificado',
        'Contrato no encontrado'
      );
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
          { provide: VigenciaService, useValue: { vigenciaActualId: () => of(2026) } },
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

      jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
      component.formInfoGeneral.patchValue({ plazoEjecucion: 36, unidadEjecutoraId: 1 });
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
    let fixture: any;

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
