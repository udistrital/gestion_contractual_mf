import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ResumenEstadosComponent } from './resumen-estados.component';
import { conteoVacio } from '../../../utils/tablero.utils';

describe('ResumenEstadosComponent', () => {
  let fixture: ComponentFixture<ResumenEstadosComponent>;
  let component: ResumenEstadosComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResumenEstadosComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ResumenEstadosComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('conteo', {
      ...conteoVacio(),
      total: 1250,
      porSuscribir: 250,
      enEjecucion: 1000,
    });
    fixture.componentRef.setInput('detalleTotal', 'Vigencia 2026');
    fixture.detectChanges();
  });

  const tarjetas = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('button.estado'));
  const leyenda = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('button.leyenda-item'));

  it('muestra la dona con el total, la leyenda y una tarjeta por cada uno de los 5 estados', () => {
    expect(fixture.nativeElement.querySelector('.dona-numero').textContent).toContain('1.250');
    expect(fixture.nativeElement.textContent).toContain('Vigencia 2026');
    expect(leyenda()).toHaveLength(6);
    expect(leyenda()[0].textContent).toContain('Todos');
    expect(fixture.nativeElement.querySelectorAll('circle.segmento')).toHaveLength(2);
    expect(tarjetas()).toHaveLength(5);
    expect(tarjetas()[0].textContent).toContain('Por suscribir');
    expect(tarjetas()[0].textContent).toContain('20%');
    expect(tarjetas()[3].getAttribute('data-estado')).toBe('enEjecucion');
  });

  it('no emite selección cuando no es seleccionable', () => {
    const espia = jest.fn();
    component.seleccionar.subscribe(espia);
    tarjetas()[0].click();
    leyenda()[0].click();
    expect(espia).not.toHaveBeenCalled();
  });

  it('emite el id del estado o vacío para todos y resalta la activa', () => {
    const espia = jest.fn();
    component.seleccionar.subscribe(espia);
    fixture.componentRef.setInput('seleccionable', true);
    fixture.componentRef.setInput('estadoActivo', '6774');
    fixture.detectChanges();

    tarjetas()[1].click();
    leyenda()[0].click();
    leyenda()[2].click();
    expect(espia.mock.calls).toEqual([['6774'], [''], ['6774']]);
    expect(tarjetas()[1].classList).toContain('activa');
    expect(leyenda()[2].classList).toContain('activa');
    expect(leyenda()[0].classList).not.toContain('activa');
  });
});
