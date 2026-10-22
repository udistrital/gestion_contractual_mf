import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CargaAbogadosComponent } from './carga-abogados.component';
import { calcularAlertas } from '../../../utils/tablero.utils';
import { contratoPrueba } from '../testing/contratos-prueba';

describe('CargaAbogadosComponent', () => {
  let fixture: ComponentFixture<CargaAbogadosComponent>;
  let component: CargaAbogadosComponent;

  const contratos = [
    contratoPrueba({ id: 1, abogadoId: 500, abogado: 'Diana Rojas', diasEnEstado: 9 }),
    contratoPrueba({ id: 2, abogadoId: 500, abogado: 'Diana Rojas', estado: 'enEjecucion' }),
    contratoPrueba({ id: 3, abogadoId: 600, abogado: 'Andrés Pinzón', estado: 'suscrito' }),
    contratoPrueba({ id: 4, abogadoId: 600, abogado: 'Andrés Pinzón', estado: 'suscrito' }),
    contratoPrueba({ id: 5, abogadoId: 600, abogado: 'Andrés Pinzón', estado: 'declinado' }),
    contratoPrueba({ id: 6, abogadoId: null, abogado: 'Sin identificar' }),
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [CargaAbogadosComponent] });
    fixture = TestBed.createComponent(CargaAbogadosComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('contratos', contratos);
    fixture.componentRef.setInput('alertas', calcularAlertas(contratos, new Date(2026, 9, 20)));
    fixture.componentRef.setInput('rol', 'JEFE');
    fixture.detectChanges();
  });

  it('jefe: una fila por abogado con pendientes y alertas', () => {
    const filas = component.filas();
    expect(filas.map((f) => f.nombre)).toEqual(['Andrés Pinzón', 'Diana Rojas', 'Sin identificar']);
    expect(filas[0].pendientes).toBe(2);
    expect(filas[1].alertas).toBe(1);
    expect(component.maximo()).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.avatar')[0].textContent).toBe('AP');
  });

  it('abogado: compara sus contratos con el promedio de la oficina', () => {
    fixture.componentRef.setInput('rol', 'ABOGADO');
    fixture.componentRef.setInput('abogadoId', 500);
    fixture.detectChanges();
    const ps = component.cargaPropia().find((f) => f.clave === 'porSuscribir')!;
    const su = component.cargaPropia().find((f) => f.clave === 'suscrito')!;
    expect(ps.mios).toBe(1);
    expect(su.mios).toBe(0);
    expect(su.promedio).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Promedio por abogado de la oficina');
  });

  it('abogado sin usuario identificado ve un aviso', () => {
    fixture.componentRef.setInput('rol', 'ABOGADO');
    fixture.componentRef.setInput('abogadoId', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No fue posible identificar tu usuario');
  });
});
