import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { RegistroContratoComponent } from './registro-contrato.component';

describe('RegistroContratoComponent', () => {
  let component: RegistroContratoComponent;
  let fixture: ComponentFixture<RegistroContratoComponent>;

  beforeEach(() => {
    RegistroContratoComponent.prototype.ngAfterViewInit = jest.fn();

    TestBed.configureTestingModule({
      declarations: [RegistroContratoComponent],
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
});
