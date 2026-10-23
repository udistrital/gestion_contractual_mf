import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SemaforoGestionComponent } from './semaforo-gestion.component';
import { calcularAlertas } from '../../../utils/tablero.utils';
import { contratoPrueba } from '../../../testing/contratos-prueba';

describe('SemaforoGestionComponent', () => {
  let fixture: ComponentFixture<SemaforoGestionComponent>;
  let component: SemaforoGestionComponent;

  const alertas = calcularAlertas(
    [
      contratoPrueba({ id: 1, numero: 'CPS-1', diasEnEstado: 4 }),
      contratoPrueba({ id: 2, numero: 'CPS-2', estado: 'suscrito', diasEnEstado: 8 }),
      contratoPrueba({ id: 3, numero: 'CPS-3', estado: 'enEjecucion', fechaFinal: new Date(2026, 9, 21) }),
    ],
    new Date(2026, 9, 20)
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SemaforoGestionComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(SemaforoGestionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('alertas', alertas);
    fixture.componentRef.setInput('total', 10);
    fixture.detectChanges();
  });

  it('cuenta prioridades, contratos al día y alertas por tipo', () => {
    expect(component.altas()).toBe(2);
    expect(component.medias()).toBe(1);
    expect(component.alDia()).toBe(7);
    expect(component.conteoPorTipo()).toEqual({ porSuscribir: 1, suscrito: 1, legalizado: 0, enEjecucion: 1 });
  });

  it('no muestra contratos al día negativos si hay más alertas que el total', () => {
    fixture.componentRef.setInput('total', 2);
    fixture.detectChanges();
    expect(component.alDia()).toBe(0);
  });

  it('formatea los números con separador de miles', () => {
    expect(component.formato(1234)).toBe('1.234');
  });

  it('lista todas las alertas y oculta el abogado cuando se pide', () => {
    expect(fixture.nativeElement.querySelectorAll('li.item')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('.contexto').textContent).toContain('Diana Rojas');
    fixture.componentRef.setInput('mostrarAbogado', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.contexto').textContent).not.toContain('Diana Rojas');
  });

  it('muestra un mensaje cuando no hay alertas', () => {
    fixture.componentRef.setInput('alertas', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin contratos pendientes de gestión.');
  });
});
