import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AlertService } from 'src/app/services/alert.service';
import { CdpsService } from 'src/app/services/cdps.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { OrdenadoresSupervisoresContratacionMidService } from 'src/app/services/ordenadores-supervisores-contratacion-mid.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { PasoInfoGeneralComponent } from './paso-info-general/paso-info-general.component';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal/paso-info-presupuestal.component';
import { PasoSupervisoresComponent } from './paso-supervisores/paso-supervisores.component';

/**
 * Guardado de los pasos contra el CRUD Beego v2 (#390): los filtros se arman
 * en el paso y las respuestas tienen el formato de la rama feature/385-json-snake-case
 * (snake_case, Status como texto, [] en listas vacías, ceros en vez de nulos, FK { id }).
 */

const ok = (Data: unknown) => ({ Success: true, Status: '200', Message: 'Request successful', Data });
const DEL_CONTRATO = 'contrato_general_id.id:42,activo:true';

const alertServiceMock = () => ({
  showAlert: jest.fn(),
  showSuccessAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
  showErrorAlert: jest.fn(),
});

const contrato: any = { id: 42, unidad_ejecutora_id: 1, valor_pesos: 1000000, tipo_control_id: 6611 };

const FECHA_CERO = '0001-01-01T00:00:00Z';

describe('Guardado de los pasos con el CRUD Beego v2', () => {
  describe('PasoInfoGeneralComponent: valores cero y tipos del modelo v2', () => {
    let component: PasoInfoGeneralComponent;
    let crud: Record<string, jest.Mock>;

    async function montar(datos: any) {
      crud = {
        post: jest.fn().mockReturnValue(of({ Success: true, Status: '201', Data: { id: 42 } })),
        postEstadoContrato: jest.fn().mockReturnValue(of({ Success: true, Status: '201', Data: { id: 3 } })),
      };
      TestBed.configureTestingModule({
        declarations: [PasoInfoGeneralComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          { provide: RolService, useValue: { getRol: () => ['ABOGADO_CONTRATACION_RECTOR'] } },
          {
            provide: ParametrosService,
            useValue: {
              getParametrosPorTipo: jest.fn().mockResolvedValue({}),
              getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
            },
          },
          { provide: ContratoGeneralCrudService, useValue: crud },
          { provide: ContratoGeneralMidService, useValue: {} },
          { provide: UserService, useValue: { getPersonaId: jest.fn().mockResolvedValue(1) } },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      const fixture = TestBed.createComponent(PasoInfoGeneralComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneral', datos);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('la fecha cero del CRUD (0001-01-01) se muestra vacía', async () => {
      await montar({ ...contrato, fecha_suscripcion_estudio: FECHA_CERO, aplica_poliza: false });
      expect(component.formInfoGeneral.get('fechaSuscripcionEstudios')?.value).toBe('');
      expect(component.formInfoGeneral.get('aplicaPoliza')?.value).toBe('0');
    });

    it('envía aplica_poliza como bool, plazo como entero y la fecha vacía como null', async () => {
      await montar({ ...contrato, fecha_suscripcion_estudio: FECHA_CERO });
      component.formInfoGeneral.patchValue({ aplicaPoliza: '1', plazoEjecucion: '6' as any });
      jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
      component.guardarContrato('27', 1);
      expect(crud['post']).toHaveBeenCalledWith(
        expect.objectContaining({
          aplica_poliza: true,
          plazo_ejecucion: 6,
          fecha_suscripcion_estudio: null,
          consecutivo_elaboracion: '27',
        })
      );
    });
  });

  describe('PasoInfoPresupuestalComponent: un solo ordenador activo', () => {
    let fixture: ComponentFixture<PasoInfoPresupuestalComponent>;
    let component: PasoInfoPresupuestalComponent;
    let crud: Record<string, jest.Mock>;

    async function montar(ordenadoresGuardados: unknown[]) {
      crud = {
        getOrdenadores: jest.fn().mockReturnValue(of(ok(ordenadoresGuardados))),
        getCdps: jest.fn().mockReturnValue(of(ok([]))),
        postOrdenadorContrato: jest.fn().mockReturnValue(of(ok({ id: 8 }))),
        putOrdenadorContrato: jest.fn().mockReturnValue(of(ok({ id: 7 }))),
        put: jest.fn().mockReturnValue(of(ok({ id: 42 }))),
      };
      TestBed.configureTestingModule({
        declarations: [PasoInfoPresupuestalComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          { provide: ParametrosService, useValue: { getParametrosPorTipo: jest.fn().mockResolvedValue({}) } },
          {
            provide: CdpsService,
            useValue: {
              getLocalCDP: jest.fn().mockReturnValue([]),
              updateLocalCDP: jest.fn(),
              get: jest.fn().mockReturnValue(of({ Status: 200, Data: [] })),
            },
          },
          { provide: ContratoGeneralCrudService, useValue: crud },
          {
            provide: OrdenadoresSupervisoresContratacionMidService,
            useValue: {
              getRolOrdenadores: jest.fn().mockReturnValue(of({ Status: 200, Data: [] })),
              getOrdenadorActuales: jest.fn().mockReturnValue(of({ Status: 200, Data: [{ nombre_ordenador: 'Ordenador' }] })),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoInfoPresupuestalComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneral', contrato);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      component.form.get('ordenadorGasto')?.setValue(3);
      jest.spyOn(component.form, 'valid', 'get').mockReturnValue(true);
    }

    const consultaOrdenador = {
      query: DEL_CONTRATO,
      sortby: 'fecha_creacion,id',
      order: 'desc',
      limit: 1,
    };

    it('al cargar consulta el ordenador activo más reciente y los CDP del contrato', async () => {
      await montar([{ id: 7, ordenador_argo_id: 3 }]);
      expect(crud['getOrdenadores']).toHaveBeenCalledWith(consultaOrdenador);
      expect(crud['getCdps']).toHaveBeenCalledWith({ query: DEL_CONTRATO, limit: 0 });
      expect(component.form.get('ordenadorGasto')?.value).toBe(3);
    });

    it('si el contrato ya tiene ordenador activo lo actualiza con PUT (no duplica)', async () => {
      await montar([{ id: 7, ordenador_argo_id: 1 }]);
      await component.guardarYContinuar();
      expect(crud['putOrdenadorContrato']).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ ordenador_argo_id: 3, contrato_general_id: { id: 42 } })
      );
      expect(crud['postOrdenadorContrato']).not.toHaveBeenCalled();
      expect(crud['put']).toHaveBeenCalledWith(42, expect.any(Object));
    });

    it('envía valor_pesos como número y el ordenador con contrato_general_id { id }', async () => {
      await montar([]);
      await component.guardarYContinuar();
      expect(crud['put']).toHaveBeenCalledWith(42, expect.objectContaining({ valor_pesos: 1000000 }));
    });

    it('si no hay ordenador activo lo crea con POST', async () => {
      await montar([]);
      await component.guardarYContinuar();
      expect(crud['postOrdenadorContrato']).toHaveBeenCalledWith(
        expect.objectContaining({ ordenador_argo_id: 3, contrato_general_id: { id: 42 } })
      );
      expect(crud['putOrdenadorContrato']).not.toHaveBeenCalled();
    });
  });

  describe('PasoSupervisoresComponent: solicitante, supervisores y tipo de control', () => {
    let fixture: ComponentFixture<PasoSupervisoresComponent>;
    let component: PasoSupervisoresComponent;
    let crud: Record<string, jest.Mock>;

    async function montar(supervisoresGuardados: unknown[]) {
      crud = {
        get: jest.fn().mockReturnValue(of(ok({ ...contrato, sede_solicitante_id: 10, dependencia_solicitante_id: 20 }))),
        getSupervisores: jest.fn().mockReturnValue(of(ok(supervisoresGuardados))),
        put: jest.fn().mockReturnValue(of(ok({ id: 42 }))),
        putSupervisor: jest.fn().mockReturnValue(of(ok({ id: 1 }))),
        postSupervisor: jest.fn().mockReturnValue(of(ok({ id: 9 }))),
      };
      TestBed.configureTestingModule({
        declarations: [PasoSupervisoresComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          {
            provide: ContratoGeneralMidService,
            useValue: {
              getSedes: jest.fn().mockReturnValue(of([])),
              getDependenciasBySede: jest.fn().mockReturnValue(of([])),
            },
          },
          { provide: ContratoGeneralCrudService, useValue: crud },
          {
            provide: OrdenadoresSupervisoresContratacionMidService,
            useValue: { getSupervisoresDependencia: jest.fn().mockReturnValue(of({ Data: [] })) },
          },
          {
            provide: ParametrosService,
            useValue: {
              getParametrosPorTipo: jest.fn().mockResolvedValue({
                [environment.TIPO_CONTROL_ID]: [{ Id: 6611, Nombre: 'Técnico, administrativo y financiero' }],
              }),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoSupervisoresComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneral', contrato);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    const supervisorGuardado = {
      id: 1,
      documento: 79123456,
      sede_legado: 'SEDE',
      dependencia_legado: 'DEP',
      cargo_legado: 'Decano',
      sede_id: 10,
      dependencia_id: 20,
      digito_verificacion: 3,
    };

    it('lee el solicitante de contrato_general y los supervisores activos en orden de id', async () => {
      await montar([supervisorGuardado]);
      expect(crud['get']).toHaveBeenCalledWith(42);
      expect(crud['getSupervisores']).toHaveBeenCalledWith({
        query: DEL_CONTRATO,
        sortby: 'id',
        order: 'asc',
        limit: 0,
      });
      expect(component.form.get('solicitante')?.value).toEqual(
        expect.objectContaining({ sede: 10, dependencia: 20 })
      );
    });

    it('guarda el solicitante con PUT parcial en contrato_general', async () => {
      await montar([]);
      jest.spyOn(component.form.get('solicitante')!, 'invalid', 'get').mockReturnValue(false);
      component.guardarSolicitante();
      expect(crud['put']).toHaveBeenCalledWith(42, {
        sede_solicitante_id: 10,
        dependencia_solicitante_id: 20,
      });
    });

    it('actualiza el supervisor existente con PUT y enteros, y guarda tipo_control_id en el contrato', async () => {
      await montar([supervisorGuardado]);
      // Datos del supervisor que en la pantalla llegan del MID de ordenadores y supervisores.
      component.supervisorLegacy[0] = {
        documento: '79123456',
        sede_legado: 'SEDE',
        dependencia_legado: 'DEP',
        cargo_legado: 'Decano',
      };
      component.getSupervisoresFormArray().at(0).patchValue({ codigoVerificacion: '3' });
      jest.spyOn(component.form.get('supervisores')!, 'invalid', 'get').mockReturnValue(false);
      await component.guardarSupervisores();
      expect(crud['putSupervisor']).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          supervisor_id: 79123456,
          documento: 79123456,
          // cargoId no es un control del formulario (TODO de develop): va como null, no NaN.
          cargo_id: null,
          digito_verificacion: 3,
          sede_id: 10,
          dependencia_id: 20,
          contrato_general_id: { id: 42 },
        })
      );
      expect(crud['postSupervisor']).not.toHaveBeenCalled();
      expect(crud['put']).toHaveBeenCalledWith(42, { tipo_control_id: 6611 });
    });

    it('crea el supervisor nuevo con POST y toma su id de Data', async () => {
      await montar([]);
      component.supervisorLegacy[0] = {
        documento: '79123456',
        sede_legado: '',
        dependencia_legado: '',
        cargo_legado: '',
      };
      jest.spyOn(component.form.get('supervisores')!, 'invalid', 'get').mockReturnValue(false);
      await component.guardarSupervisores();
      expect(crud['postSupervisor']).toHaveBeenCalledWith(
        expect.objectContaining({ supervisor_id: 79123456, contrato_general_id: { id: 42 } })
      );
      expect(component.supervisoresIds).toEqual([9]);
    });
  });
});
