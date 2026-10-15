import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
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
});
