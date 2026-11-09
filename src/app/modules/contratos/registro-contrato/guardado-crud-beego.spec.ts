import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AlertService } from 'src/app/services/alert.service';
import { CdpsService } from 'src/app/services/cdps.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { VigenciaService } from 'src/app/services/vigencia.service';
import { OrdenadoresSupervisoresContratacionMidService } from 'src/app/services/ordenadores-supervisores-contratacion-mid.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { PasoInfoGeneralComponent } from './paso-info-general/paso-info-general.component';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal/paso-info-presupuestal.component';
import { PasoSupervisoresComponent } from './paso-supervisores/paso-supervisores.component';

/**
 * Guardado de los pasos contra el CRUD Beego v2 (#390): los filtros se arman
 * en el paso y las respuestas tienen el formato de la rama del crud#51 (feature/385-crud-beego-v2)
 * (snake_case, Status como texto, [] en listas vacías, null en lo que no tiene valor, FK { id }).
 */

const ok = (Data: unknown) => ({ Success: true, Status: '200', Message: 'Request successful', Data });
const DEL_CONTRATO = 'contrato_general_id.id:42,activo:true';

const alertServiceMock = () => ({
  showAlert: jest.fn(),
  showSuccessAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
  showErrorAlert: jest.fn(),
});

const contrato: any = { id: 42, unidad_ejecutora_id: 1, valor_pesos: 1000000, tipo_control_id: 6611 };

describe('Guardado de los pasos con el CRUD Beego v2', () => {
  describe('PasoInfoGeneralComponent: valores nulos y tipos del modelo v2', () => {
    let component: PasoInfoGeneralComponent;
    let crud: Record<string, jest.Mock>;
    let mid: Record<string, jest.Mock>;

    async function montar(datos: any, contratoGeneralId = 0) {
      mid = { postConsecutivo: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: '27' })) };
      crud = {
        post: jest.fn().mockReturnValue(of({ Success: true, Status: '201', Data: { id: 42 } })),
        put: jest.fn().mockReturnValue(of({ Success: true, Status: '200', Data: { id: 42 } })),
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
          { provide: ContratoGeneralMidService, useValue: mid },
          { provide: VigenciaService, useValue: { vigenciaActualId: () => of(9001) } },
          { provide: UserService, useValue: { getPersonaId: jest.fn().mockResolvedValue(1) } },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      const fixture = TestBed.createComponent(PasoInfoGeneralComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('contratoGeneral', { ...datos, id: contratoGeneralId });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('los valores nulos del CRUD se muestran vacíos', async () => {
      await montar({
        ...contrato,
        fecha_suscripcion_estudio: null,
        aplica_poliza: null,
        tipo_compromiso_id: null,
        plazo_ejecucion: null,
      });
      expect(component.formInfoGeneral.get('fechaSuscripcionEstudios')?.value).toBe('');
      expect(component.formInfoGeneral.get('aplicaPoliza')?.value).toBe('');
      expect(component.formInfoGeneral.get('tipoCompromisoId')?.value).toBeNull();
      expect(component.formInfoGeneral.get('plazoEjecucion')?.value).toBeNull();
    });

    it('aplica_poliza en false se muestra como No', async () => {
      await montar({ ...contrato, aplica_poliza: false });
      expect(component.formInfoGeneral.get('aplicaPoliza')?.value).toBe('0');
    });

    it('lo que no tiene valor se envía como null, no como 0', async () => {
      await montar({
        ...contrato,
        fecha_suscripcion_estudio: null,
        aplica_poliza: null,
        perfil_contratista_id: null,
        modalidad_seleccion_id: null,
      });
      jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
      component.guardarContrato('27', 1);
      expect(crud['post']).toHaveBeenCalledWith(
        expect.objectContaining({
          perfil_contratista_id: null,
          modalidad_seleccion_id: null,
          fecha_suscripcion_estudio: null,
          aplica_poliza: null,
        })
      );
    });

    it('muestra el día guardado y lo envía igual, sin correrlo por la zona horaria', async () => {
      await montar({ ...contrato, fecha_suscripcion_estudio: '2026-10-31T00:00:00Z' });
      expect(new Date(component.formInfoGeneral.get('fechaSuscripcionEstudios')?.value as string).getDate()).toBe(31);
      jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
      component.guardarContrato('27', 1);
      expect(crud['post']).toHaveBeenCalledWith(
        expect.objectContaining({ fecha_suscripcion_estudio: '2026-10-31T00:00:00Z' })
      );
    });

    it('envía aplica_poliza como bool, plazo como entero y la fecha vacía como null', async () => {
      await montar({ ...contrato, fecha_suscripcion_estudio: null });
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

    it('en un contrato nuevo pide consecutivo, hace POST y registra el estado inicial', async () => {
      await montar(contrato);
      jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
      component.guardarYContinuar();
      await new Promise((resuelto) => setTimeout(resuelto));
      expect(mid['postConsecutivo']).toHaveBeenCalledTimes(1);
      expect(crud['post']).toHaveBeenCalledTimes(1);
      expect(crud['put']).not.toHaveBeenCalled();
      expect(crud['postEstadoContrato']).toHaveBeenCalledTimes(1);
    });

    it('en un contrato existente hace PUT al mismo id, sin consecutivo, sin POST y sin otro estado', async () => {
      await montar(contrato, 42);
      const guardado = jest.fn();
      component.contratoGuardado.subscribe(guardado);
      jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
      component.guardarYContinuar();
      await new Promise((resuelto) => setTimeout(resuelto));
      expect(crud['put']).toHaveBeenCalledTimes(1);
      expect(crud['put'].mock.calls[0][0]).toBe(42);
      expect(crud['put'].mock.calls[0][1]).not.toHaveProperty('consecutivo_elaboracion');
      expect(crud['post']).not.toHaveBeenCalled();
      expect(mid['postConsecutivo']).not.toHaveBeenCalled();
      expect(crud['postEstadoContrato']).not.toHaveBeenCalled();
      expect(guardado).toHaveBeenCalledWith(42);
    });

    it('en edición un campo que ya no aplica se limpia con null', async () => {
      await montar({ ...contrato, perfil_contratista_id: 7 }, 42);
      component.formInfoGeneral.get('perfilContratistaId')?.disable();
      jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
      component.guardarYContinuar();
      expect(crud['put'].mock.calls[0][1]).toEqual(expect.objectContaining({ perfil_contratista_id: null }));
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

    it('no envía en el PUT los datos del ordenador que no vienen del formulario', async () => {
      await montar([{ id: 7, ordenador_argo_id: 1, cargo_id: 12, ordenador_sicapital_id: 1001 }]);
      await component.guardarYContinuar();
      const cuerpo = crud['putOrdenadorContrato'].mock.calls[0][1];
      expect(cuerpo).not.toHaveProperty('cargo_id');
      expect(cuerpo).not.toHaveProperty('ordenador_sicapital_id');
      expect(cuerpo).not.toHaveProperty('documento_identidad');
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

    let mid: Record<string, jest.Mock>;
    const DEPENDENCIA_20 = { id: 20, nombre: 'Facultad de Ingeniería', sedes: [{ id: 10, nombre: 'Sede Calle 40' }] };
    // Lista completa del MID; la dependencia 20 no está (p. ej., inactiva) para probar su nombre.
    const DEPENDENCIAS = [
      { id: 21, nombre: 'Oficina Asesora Jurídica' },
      { id: 22, nombre: 'Rectoría' },
    ];

    async function montar(supervisoresGuardados: unknown[], dependencia: any = throwError(() => new Error('sin MID'))) {
      mid = {
        getDependencias: jest.fn().mockReturnValue(of(DEPENDENCIAS)),
        getDependencia: jest.fn().mockReturnValue(dependencia),
      };
      crud = {
        // El CRUD v2 ya no guarda sede_solicitante_id ni sede_id del supervisor (crud#51 3a1e5ab).
        get: jest.fn().mockReturnValue(of(ok({ ...contrato, dependencia_solicitante_id: 20 }))),
        getSupervisores: jest.fn().mockReturnValue(of(ok(supervisoresGuardados))),
        put: jest.fn().mockReturnValue(of(ok({ id: 42 }))),
        putSupervisor: jest.fn().mockReturnValue(of(ok({ id: 1 }))),
        postSupervisor: jest.fn().mockReturnValue(of(ok({ id: 9 }))),
      };
      TestBed.configureTestingModule({
        declarations: [PasoSupervisoresComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          { provide: ContratoGeneralMidService, useValue: mid },
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
      documento: 1000000004,
      sede_legado: 'SEDE',
      dependencia_legado: 'DEP',
      cargo_legado: 'Decano',
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
      // Sin sede en el formulario (a pedido de la clienta).
      expect(component.form.get('solicitante')?.getRawValue()).toEqual({ dependencia: 20 });
      expect(component.getSupervisoresFormArray().at(0).get('sede')).toBeNull();
    });

    it('lista todas las dependencias del MID, sin filtrar por sede', async () => {
      await montar([]);
      expect(mid['getDependencias']).toHaveBeenCalledTimes(1);
      // El solicitante agrega su dependencia guardada (20); el supervisor nuevo, ninguna.
      expect(component.getDependenciasSolicitante()).toEqual(expect.arrayContaining(DEPENDENCIAS));
      expect(component.getDependenciasSupervisor(0)).toEqual(DEPENDENCIAS);
    });

    describe('nombre de la dependencia guardada desde GET espacios-fisicos/dependencias/{id}', () => {
      it('muestra el nombre aunque la lista no la traiga, y no toca sede', async () => {
        await montar([], of(DEPENDENCIA_20));
        expect(mid['getDependencia']).toHaveBeenCalledWith(20);
        expect(component.getDependenciasSolicitante()).toEqual([...DEPENDENCIAS, { id: 20, nombre: 'Facultad de Ingeniería' }]);
        expect(component.form.get('solicitante')?.getRawValue()).toEqual({ dependencia: 20 });
      });

      it('si el MID falla: la dependencia queda con su Id y el formulario no se bloquea', async () => {
        await montar([]);
        expect(component.getDependenciasSolicitante()).toContainEqual({ id: 20, nombre: 'Dependencia guardada (Id 20)' });
        expect(component.form.get('solicitante')?.getRawValue().dependencia).toBe(20);
        expect(component.form.get('solicitante')?.valid).toBe(true);
      });

      it('supervisor: conserva el nombre de dependencia_legado', async () => {
        await montar([supervisorGuardado], of({ ...DEPENDENCIA_20, nombre: 'Nombre en Oikos' }));
        expect(component.getSupervisoresFormArray().at(0).get('dependencia')?.value).toBe(20);
        expect(component.getDependenciasSupervisor(0)).toContainEqual({ id: 20, nombre: 'DEP' });
      });

      it('supervisor sin dependencia_legado: toma el nombre del MID', async () => {
        await montar([{ ...supervisorGuardado, dependencia_legado: '' }], of(DEPENDENCIA_20));
        expect(component.dependenciasGuardadasSupervisor[0]).toEqual({ id: 20, nombre: 'Facultad de Ingeniería' });
      });
    });

    it('guarda el solicitante con PUT parcial en contrato_general', async () => {
      await montar([]);
      jest.spyOn(component.form.get('solicitante')!, 'invalid', 'get').mockReturnValue(false);
      component.guardarSolicitante();
      expect(crud['put']).toHaveBeenCalledWith(42, { dependencia_solicitante_id: 20 });
    });

    it('actualiza el supervisor existente con PUT y enteros, y guarda tipo_control_id en el contrato', async () => {
      await montar([supervisorGuardado]);
      // Datos del supervisor que en la pantalla llegan del MID de ordenadores y supervisores.
      component.supervisorLegacy[0] = { documento: '1000000004' };
      component.getSupervisoresFormArray().at(0).patchValue({ codigoVerificacion: '3' });
      jest.spyOn(component.form.get('supervisores')!, 'invalid', 'get').mockReturnValue(false);
      await component.guardarSupervisores();
      expect(crud['putSupervisor']).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          supervisor_id: 1000000004,
          documento: 1000000004,
          digito_verificacion: 3,
          dependencia_id: 20,
          contrato_general_id: { id: 42 },
        })
      );
      const cuerpoPut = crud['putSupervisor'].mock.calls[0][1];
      expect(cuerpoPut).not.toHaveProperty('sede_id');
      // Las columnas de legado no se escriben.
      expect(cuerpoPut).not.toHaveProperty('sede_legado');
      expect(cuerpoPut).not.toHaveProperty('dependencia_legado');
      expect(cuerpoPut).not.toHaveProperty('cargo_legado');
      expect(crud['postSupervisor']).not.toHaveBeenCalled();
      expect(crud['put']).toHaveBeenCalledWith(42, { tipo_control_id: 6611 });
    });

    it('no envía en el PUT cargo_id ni el documento sin valor, para no borrar lo guardado', async () => {
      await montar([supervisorGuardado]);
      component.supervisorLegacy[0] = { documento: '' };
      jest.spyOn(component.form.get('supervisores')!, 'invalid', 'get').mockReturnValue(false);
      await component.guardarSupervisores();
      const cuerpo = crud['putSupervisor'].mock.calls[0][1];
      expect(cuerpo).not.toHaveProperty('cargo_id');
      expect(cuerpo).not.toHaveProperty('supervisor_id');
      expect(cuerpo).not.toHaveProperty('documento');
    });

    it('crea el supervisor nuevo con POST y toma su id de Data', async () => {
      await montar([]);
      component.supervisorLegacy[0] = { documento: '1000000004' };
      jest.spyOn(component.form.get('supervisores')!, 'invalid', 'get').mockReturnValue(false);
      await component.guardarSupervisores();
      expect(crud['postSupervisor']).toHaveBeenCalledWith(
        expect.objectContaining({ supervisor_id: 1000000004, contrato_general_id: { id: 42 } })
      );
      expect(component.supervisoresIds).toEqual([9]);
    });
  });
});
