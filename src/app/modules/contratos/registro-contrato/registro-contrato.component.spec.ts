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
});
