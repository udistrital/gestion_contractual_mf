import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MapaCalorDependenciasComponent } from './mapa-calor-dependencias.component';
import { GrupoContratos } from '../../../types/tablero.models';
import { conteoVacio } from '../../../utils/tablero.utils';

const grupo = (clave: string, conteo: Partial<GrupoContratos>): GrupoContratos => {
  const g = { ...conteoVacio(), clave, nombre: `Dependencia ${clave}`, ...conteo };
  g.total = g.porSuscribir + g.suscrito + g.legalizado + g.enEjecucion + g.declinado;
  return g;
};

describe('MapaCalorDependenciasComponent', () => {
  let fixture: ComponentFixture<MapaCalorDependenciasComponent>;
  let component: MapaCalorDependenciasComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapaCalorDependenciasComponent],
      imports: [MatTooltipModule],
    });
    fixture = TestBed.createComponent(MapaCalorDependenciasComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('grupos', [
      grupo('1', { porSuscribir: 13, enEjecucion: 51 }),
      grupo('2', { suscrito: 1 }),
    ]);
    fixture.detectChanges();
  });

  it('una fila por dependencia y una celda por estado, con el tono según la concentración', () => {
    const [f1, f2] = component.filas();
    expect(f1.celdas.map((c) => c.valor)).toEqual([13, 0, 0, 51, 0]);
    expect(f1.celdas[3].tono).toBe(0);
    expect(f1.celdas[0].tono).toBe(5);
    expect(f1.celdas[1].tono).toBeNull();
    expect(f2.celdas[1].tono).toBe(7);
    expect(f1.anchoTotal).toBe(100);
    expect(f2.celdas[1].titulo).toBe('Dependencia 2 · Suscrito: 1 contrato');

    const celdas: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button.celda'));
    expect(celdas.map((c) => c.textContent!.trim()).slice(0, 5)).toEqual(['13', '·', '·', '51', '·']);
    expect(celdas[3].classList).toContain('oscura');
    expect(celdas[0].classList).not.toContain('oscura');
  });

  it('emite la dependencia de la celda elegida y la deselecciona al repetir', () => {
    const espia = jest.fn();
    component.seleccionar.subscribe(espia);
    const celdas: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button.celda'));
    celdas[0].click();
    expect(espia).toHaveBeenLastCalledWith('1');

    fixture.componentRef.setInput('seleccionada', '1');
    fixture.detectChanges();
    const filas: HTMLTableRowElement[] = Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));
    expect(filas[0].classList).toContain('seleccionada');
    expect(filas[1].classList).toContain('atenuada');
    fixture.nativeElement.querySelector('button.nombre').click();
    expect(espia).toHaveBeenLastCalledWith(null);
  });

  it('muestra un mensaje si no hay contratos', () => {
    fixture.componentRef.setInput('grupos', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin contratos en esta vigencia.');
  });
});
