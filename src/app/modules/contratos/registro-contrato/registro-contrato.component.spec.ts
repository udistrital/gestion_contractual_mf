import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';
import { PasoInfoGeneralComponent } from './paso-info-general/paso-info-general.component';
import { RegistroContratoComponent } from './registro-contrato.component';

describe('RegistroContratoComponent', () => {
  let component: RegistroContratoComponent;
  let fixture: ComponentFixture<RegistroContratoComponent>;
  let mockRouter: { navigate: jest.Mock };

  beforeEach(() => {
    RegistroContratoComponent.prototype.ngAfterViewInit = jest.fn();
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      declarations: [RegistroContratoComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(RegistroContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe generar 4 pasos dinámicos por defecto correlativos (01 a 04)', () => {
    const pasos = component.pasosDinamicos;
    expect(pasos.length).toBe(4);
    expect(pasos[0].numeroFormateado).toBe('01');
    expect(pasos[1].numeroFormateado).toBe('02');
    expect(pasos[2].numeroFormateado).toBe('03');
    expect(pasos[3].numeroFormateado).toBe('04');
    expect(pasos[3].titulo).toBe('Clausulado y Parágrafos');
  });

  it('debe actualizar los números correlativos dinámicamente al activar especificaciones técnicas (01 a 05)', () => {
    component.showEspecificacionesTecnicas = true;
    const pasos = component.pasosDinamicos;
    expect(pasos.length).toBe(5);
    expect(pasos[3].titulo).toBe('Especificaciones Técnicas');
    expect(pasos[3].numeroFormateado).toBe('04');
    expect(pasos[4].titulo).toBe('Clausulado y Parágrafos');
    expect(pasos[4].numeroFormateado).toBe('05');
  });

  it('debe actualizar los números correlativos dinámicamente cuando aplican especificaciones y pólizas (01 a 06)', () => {
    component.showEspecificacionesTecnicas = true;
    component.showAplicaPoliza = true;
    const pasos = component.pasosDinamicos;
    expect(pasos.length).toBe(6);
    expect(pasos[3].titulo).toBe('Especificaciones Técnicas');
    expect(pasos[3].numeroFormateado).toBe('04');
    expect(pasos[4].titulo).toBe('Garantías y Mecanismos de Cobertura del Riesgo');
    expect(pasos[4].numeroFormateado).toBe('05');
    expect(pasos[5].titulo).toBe('Clausulado y Parágrafos');
    expect(pasos[5].numeroFormateado).toBe('06');
  });

  it('debe permitir navegar libremente a cualquier paso con irAlPaso()', () => {
    component.stepper = { selectedIndex: 0 } as any;
    component.irAlPaso(2);
    expect(component.selectedIndex).toBe(2);
    expect(component.stepper.selectedIndex).toBe(2);

    // Devolverse al paso 0 libremente
    component.irAlPaso(0);
    expect(component.selectedIndex).toBe(0);
    expect(component.stepper.selectedIndex).toBe(0);
  });

  it('debe retroceder al paso anterior con goToPreviousStep() o navegar a consultar contratos desde el Paso 1', () => {
    component.stepper = { selectedIndex: 2 } as any;
    component.selectedIndex = 2;
    const navigateSpy = jest
      .spyOn((component as any).router, 'navigate')
      .mockResolvedValue(true);

    component.goToPreviousStep();
    expect(component.selectedIndex).toBe(1);
    expect(component.stepper.selectedIndex).toBe(1);

    component.goToPreviousStep();
    expect(component.selectedIndex).toBe(0);
    expect(component.stepper.selectedIndex).toBe(0);

    component.goToPreviousStep();
    expect(navigateSpy).toHaveBeenCalledWith([
      '/gestion-contractual/contratos/consultar',
    ]);
  });

  describe('Lógica de los 4 estados del Stepper', () => {
    it('debe marcar como "actual" el paso seleccionado activamente', () => {
      component.selectedIndex = 0;
      const paso0 = component.pasosDinamicos[0];
      expect(component.getEstadoPaso(paso0)).toBe('actual');
      expect(component.getSublabelPaso(paso0)).toBe('PASO 01 ACTIVO');
    });

    it('debe marcar como "gris" un paso no iniciado, sin campos llenos ni visitado', () => {
      component.selectedIndex = 0;
      const paso1 = component.pasosDinamicos[1];
      expect(component.getEstadoPaso(paso1)).toBe('gris');
      expect(component.getSublabelPaso(paso1)).toBe('PASO 02');
    });

    it('debe marcar como "verde" únicamente cuando el paso haya sido guardado satisfactoriamente', () => {
      component.selectedIndex = 1;
      component.marcarPasoGuardado('general');
      const paso0 = component.pasosDinamicos[0];
      expect(component.getEstadoPaso(paso0)).toBe('verde');
      expect(component.getSublabelPaso(paso0)).toBe('PASO 01 GUARDADO');
    });

    it('debe marcar como "amarillo" (alerta) si el paso fue visitado o tiene alerta pero no ha sido guardado', () => {
      component.selectedIndex = 1;
      // Simulamos que el paso 0 fue visitado o dejado sin guardar
      component.onStepSelectionChange({
        previouslySelectedIndex: 0,
        selectedIndex: 1,
      } as any);

      const paso0 = component.pasosDinamicos[0];
      expect(component.getEstadoPaso(paso0)).toBe('amarillo');
      expect(component.getSublabelPaso(paso0)).toBe('PASO 01 PENDIENTE');
    });

    it('debe permitir desmarcar un paso guardado si deja de ser válido', () => {
      component.marcarPasoGuardado('estructura');
      expect(component.pasosGuardados.has('estructura')).toBe(true);

      component.desmarcarPasoGuardado('estructura');
      expect(component.pasosGuardados.has('estructura')).toBe(false);
    });
  });

  it('recarga el contrato después de guardar el paso 1 de un contrato ya cargado', () => {
    const get = jest
      .spyOn(TestBed.inject(ContratoGeneralCrudService), 'get')
      .mockReturnValue(of({ Data: { id: 42, plazo_ejecucion: 6 } }));
    fixture.componentRef.setInput('contratoGeneralId', 42);
    fixture.detectChanges();
    expect(component.contratoGeneral?.plazo_ejecucion).toBe(6);

    get.mockReturnValue(of({ Data: { id: 42, plazo_ejecucion: 9 } }));
    component.onContratoGuardado(42);
    expect(component.contratoGeneral?.plazo_ejecucion).toBe(9);
  });

  it('recarga el contrato después de guardar el paso presupuestal', () => {
    const get = jest
      .spyOn(TestBed.inject(ContratoGeneralCrudService), 'get')
      .mockReturnValue(of({ Data: { id: 42, valor_pesos: 1000 } }));
    fixture.componentRef.setInput('contratoGeneralId', 42);
    fixture.detectChanges();
    expect(component.contratoGeneral?.valor_pesos).toBe(1000);

    get.mockReturnValue(of({ Data: { id: 42, valor_pesos: 2000 } }));
    component.onPresupuestalGuardado();
    expect(component.contratoGeneral?.valor_pesos).toBe(2000);
  });

  it('solo repite la carga de un contrato ya cargado cuando se fuerza', () => {
    const get = jest
      .spyOn(TestBed.inject(ContratoGeneralCrudService), 'get')
      .mockReturnValue(of({ Data: { id: 42 } }));
    fixture.componentRef.setInput('contratoGeneralId', 42);
    fixture.detectChanges();
    expect(get).toHaveBeenCalledTimes(1);

    component.cargarContratoGeneral();
    expect(get).toHaveBeenCalledTimes(1);

    component.cargarContratoGeneral({ forzar: true });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('muestra alerta de error y redirige a consulta cuando el contrato no existe (Data vacía)', () => {
    const alertService = TestBed.inject(AlertService);
    const alertSpy = jest.spyOn(alertService, 'showErrorAlert').mockImplementation(() => Promise.resolve());
    jest
      .spyOn(TestBed.inject(ContratoGeneralCrudService), 'get')
      .mockReturnValue(of({ Data: null }));

    fixture.componentRef.setInput('contratoGeneralId', 999);
    component.cargarContratoGeneral({ forzar: true });
    expect(alertSpy).toHaveBeenCalledWith(
      'No se encontró el contrato general especificado',
      'Contrato no encontrado'
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/gestion-contractual/contratos/consultar']);
    expect(component.contratoNoEncontrado).toBe(true);
    expect(component.tituloVista).toBe('Contrato no encontrado');
  });

  it('muestra alerta "Contrato no encontrado" y redirige a consulta cuando el CRUD responde 404', () => {
    const alertService = TestBed.inject(AlertService);
    const alertSpy = jest.spyOn(alertService, 'showErrorAlert').mockImplementation(() => Promise.resolve());
    jest
      .spyOn(TestBed.inject(ContratoGeneralCrudService), 'get')
      .mockReturnValue(throwError(() => ({ status: 404, message: 'Not found' })));

    fixture.componentRef.setInput('contratoGeneralId', 999999);
    component.cargarContratoGeneral({ forzar: true });
    expect(alertSpy).toHaveBeenCalledWith(
      'No se encontró el contrato general especificado',
      'Contrato no encontrado'
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/gestion-contractual/contratos/consultar']);
    expect(component.contratoNoEncontrado).toBe(true);
    expect(component.tituloVista).toBe('Contrato no encontrado');
  });

  it('muestra alerta de error genérico cuando la consulta al CRUD falla con 500 y no redirige', () => {
    const alertService = TestBed.inject(AlertService);
    const alertSpy = jest.spyOn(alertService, 'showErrorAlert').mockImplementation(() => Promise.resolve());
    jest
      .spyOn(TestBed.inject(ContratoGeneralCrudService), 'get')
      .mockReturnValue(throwError(() => ({ status: 500, message: 'Fallo de conexión' })));

    fixture.componentRef.setInput('contratoGeneralId', 999);
    component.cargarContratoGeneral({ forzar: true });
    expect(alertSpy).toHaveBeenCalledWith('Error al cargar el contrato general');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  describe('tituloVista', () => {
    it('debe retornar "Registrar Contrato" cuando no está en editMode', () => {
      fixture.componentRef.setInput('editMode', false);
      expect(component.tituloVista).toBe('Registrar Contrato');
    });

    it('debe retornar "Edición del contrato {numero}" cuando está en editMode y tiene numero_contrato', () => {
      fixture.componentRef.setInput('editMode', true);
      component.contratoGeneral = { numero_contrato: 'CT-2026-089' } as any;
      expect(component.tituloVista).toBe('Edición del contrato CT-2026-089');
    });

    it('debe retornar "Edición del contrato {id}" si tiene contratoGeneralId pero no numero_contrato', () => {
      fixture.componentRef.setInput('editMode', true);
      fixture.componentRef.setInput('contratoGeneralId', 42);
      component.contratoGeneral = undefined;
      expect(component.tituloVista).toBe('Edición del contrato 42');
    });
  });

  describe('Visibilidad condicional anidada de Amparos y Garantías', () => {
    it('al seleccionar "3-Orden" mantiene oculto por defecto el stepper de amparos y garantías y muestra especificaciones técnicas', () => {
      component.onTipoCompromisoChange(environment.ORDEN_ID.toString());

      expect(component.showEspecificacionesTecnicas).toBe(true);
      expect(component.showAplicaPoliza).toBe(false);
      expect(component.pasosDinamicos.some((p) => p.id === 'garantias')).toBe(false);
    });

    it('en "3-Orden", muestra el stepper de amparos y garantías si "Aplica Póliza" es "Sí" (1) y lo oculta si es "No" (0)', () => {
      component.onTipoCompromisoChange(environment.ORDEN_ID.toString());
      expect(component.showAplicaPoliza).toBe(false);

      component.onAplicaPolizaChange('1');
      expect(component.showAplicaPoliza).toBe(true);
      expect(component.pasosDinamicos.some((p) => p.id === 'garantias')).toBe(true);

      component.onAplicaPolizaChange('0');
      expect(component.showAplicaPoliza).toBe(false);
      expect(component.pasosDinamicos.some((p) => p.id === 'garantias')).toBe(false);
    });

    it.each([
      ['Contrato', environment.CONTRATO_ID],
      ['Convenio', environment.CONVENIO_ID],
    ])(
      'para %s (%s) mantiene visible de forma regular el stepper de amparos y garantías y oculta especificaciones técnicas',
      (_nombre, tipoCompromisoId) => {
        component.onTipoCompromisoChange(tipoCompromisoId.toString());

        expect(component.showEspecificacionesTecnicas).toBe(false);
        expect(component.showAplicaPoliza).toBe(true);
        expect(component.pasosDinamicos.some((p) => p.id === 'garantias')).toBe(true);
      }
    );

    it('al cambiar de Contrato o Convenio a "3-Orden", vuelve a ocultar por defecto el stepper de garantías hasta seleccionar "Sí"', () => {
      component.onTipoCompromisoChange(environment.CONTRATO_ID.toString());
      expect(component.showAplicaPoliza).toBe(true);

      component.onTipoCompromisoChange(environment.ORDEN_ID.toString());
      expect(component.showAplicaPoliza).toBe(false);

      component.onAplicaPolizaChange('1');
      expect(component.showAplicaPoliza).toBe(true);
    });

    it('al cargar un Contrato existente con aplica_poliza null mantiene visible el stepper de garantías', () => {
      jest
        .spyOn(TestBed.inject(ContratoGeneralCrudService), 'get')
        .mockReturnValue(
          of({
            Data: {
              id: 77,
              tipo_compromiso_id: environment.CONTRATO_ID,
              aplica_poliza: null,
            },
          })
        );

      fixture.componentRef.setInput('contratoGeneralId', 77);
      fixture.detectChanges();

      expect(component.showEspecificacionesTecnicas).toBe(false);
      expect(component.showAplicaPoliza).toBe(true);
      expect(component.pasosDinamicos.some((p) => p.id === 'garantias')).toBe(true);
    });

    it('en PasoInfoGeneralComponent despliega "Aplica Póliza" solo para "3-Orden" y lo oculta para Contrato y Convenio', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [PasoInfoGeneralComponent],
        providers: [
          {
            provide: ParametrosService,
            useValue: {
              get: jest.fn().mockReturnValue(of({ Status: '200', Data: { Id: 1, Data: [] } })),
              getParametrosPorTipo: jest.fn().mockResolvedValue({}),
              getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
            },
          },
          {
            provide: AlertService,
            useValue: { showErrorAlert: jest.fn(), showSuccessAlert: jest.fn() },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      const pasoFixture = TestBed.createComponent(PasoInfoGeneralComponent);
      const paso = pasoFixture.componentInstance;
      pasoFixture.detectChanges();
      await pasoFixture.whenStable();

      const polizaSpy = jest.spyOn(paso.aplicaPolizaChange, 'emit');

      paso.formInfoGeneral.get('tipoCompromisoId')?.setValue(environment.ORDEN_ID);
      expect(paso.formInfoGeneral.get('aplicaPoliza')?.enabled).toBe(true);
      expect(paso.campoAplica('aplicaPoliza')).toBe(true);

      paso.formInfoGeneral.get('aplicaPoliza')?.setValue('1');
      expect(polizaSpy).toHaveBeenLastCalledWith('1');

      paso.formInfoGeneral.get('aplicaPoliza')?.setValue('0');
      expect(polizaSpy).toHaveBeenLastCalledWith('0');

      for (const tipoId of [environment.CONTRATO_ID, environment.CONVENIO_ID]) {
        paso.formInfoGeneral.get('tipoCompromisoId')?.setValue(tipoId);
        expect(paso.formInfoGeneral.get('aplicaPoliza')?.disabled).toBe(true);
        expect(paso.campoAplica('aplicaPoliza')).toBe(false);
      }
    });
  });
});
