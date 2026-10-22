import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AlertasGestionComponent } from './alertas-gestion.component';
import { calcularAlertas } from '../../../utils/tablero.utils';
import { contratoPrueba } from '../../../testing/contratos-prueba';

describe('AlertasGestionComponent', () => {
  let fixture: ComponentFixture<AlertasGestionComponent>;
  let component: AlertasGestionComponent;
  const hoy = new Date(2026, 9, 20);

  const alertas = calcularAlertas(
    [
      contratoPrueba({ id: 1, numero: 'CPS-1', diasEnEstado: 4 }),
      contratoPrueba({ id: 2, numero: 'CPS-2', estado: 'suscrito', diasEnEstado: 8 }),
      contratoPrueba({ id: 3, numero: 'CPS-3', estado: 'legalizado', diasEnEstado: 5 }),
      contratoPrueba({ id: 4, numero: 'CPS-4', estado: 'enEjecucion', fechaFinal: new Date(2026, 9, 21) }),
      contratoPrueba({ id: 5, numero: 'CPS-5', diasEnEstado: 6 }),
    ],
    hoy
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AlertasGestionComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AlertasGestionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('alertas', alertas);
    fixture.detectChanges();
  });

  it('cuenta las alertas por tipo y prioridad', () => {
    expect(component.conteoPorTipo()).toEqual({ porSuscribir: 2, suscrito: 1, legalizado: 1, enEjecucion: 1 });
    expect(component.altas()).toBe(3);
    expect(component.medias()).toBe(2);
  });

  it('lista solo hasta el límite y permite ver todas', () => {
    const items = () => fixture.nativeElement.querySelectorAll('li.item');
    const boton = () => fixture.nativeElement.querySelector('button.mas') as HTMLButtonElement;
    expect(items()).toHaveLength(4);
    expect(boton().textContent).toContain('Ver las 5 alertas');
    expect(fixture.nativeElement.textContent).toContain('Umbral: 3 días por defecto (máximo 5)');

    boton().click();
    fixture.detectChanges();
    expect(items()).toHaveLength(5);
    expect(boton().textContent).toContain('Ver menos');

    boton().click();
    fixture.detectChanges();
    expect(items()).toHaveLength(4);
  });

  it('no muestra el botón de ver todas si las alertas caben en el límite', () => {
    fixture.componentRef.setInput('limite', 5);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li.item')).toHaveLength(5);
    expect(fixture.nativeElement.querySelector('button.mas')).toBeNull();
  });

  it('resalta el tipo de alerta del estado activo', () => {
    fixture.componentRef.setInput('estadoActivo', '6774');
    fixture.detectChanges();
    const activos: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button.tipo.activo'));
    expect(activos).toHaveLength(1);
    expect(activos[0].textContent).toContain('Suscritos sin legalizar');
  });

  it('oculta el abogado cuando se pide', () => {
    expect(fixture.nativeElement.querySelector('.contexto').textContent).toContain('Diana Rojas');
    fixture.componentRef.setInput('mostrarAbogado', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.contexto').textContent).not.toContain('Diana Rojas');
  });

  it('emite el estado del tipo elegido solo si es seleccionable', () => {
    const espia = jest.fn();
    component.seleccionarEstado.subscribe(espia);
    const tipos: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button.tipo'));
    tipos[1].click();
    expect(espia).not.toHaveBeenCalled();

    fixture.componentRef.setInput('seleccionable', true);
    fixture.detectChanges();
    tipos[1].click();
    expect(espia).toHaveBeenCalledWith('6774');
  });

  it('muestra un mensaje cuando no hay alertas', () => {
    fixture.componentRef.setInput('alertas', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin contratos pendientes de gestión.');
  });
});
