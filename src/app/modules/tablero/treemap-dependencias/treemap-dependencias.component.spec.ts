import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TreemapDependenciasComponent } from './treemap-dependencias.component';
import { GrupoContratos } from '../../../types/tablero.models';
import { conteoVacio } from '../../../utils/tablero.utils';

const grupo = (clave: string, total: number): GrupoContratos => ({
  ...conteoVacio(),
  clave,
  nombre: `Dependencia ${clave}`,
  total,
  porSuscribir: total,
});

describe('TreemapDependenciasComponent', () => {
  let fixture: ComponentFixture<TreemapDependenciasComponent>;
  let component: TreemapDependenciasComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [TreemapDependenciasComponent] });
    fixture = TestBed.createComponent(TreemapDependenciasComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('grupos', [grupo('1', 60), grupo('2', 37), grupo('3', 2), grupo('4', 1)]);
    fixture.detectChanges();
  });

  it('agrupa en «Otras» las dependencias con menos del 3%', () => {
    const bloques = component.bloques();
    expect(bloques).toHaveLength(3);
    expect(bloques[2].otras).toBe(true);
    expect(bloques[2].grupo.nombre).toBe('Otras 2 dependencias');
    expect(bloques[2].grupo.total).toBe(3);
    expect(bloques[0].porcentaje).toBe(60);
    expect(bloques[0].tono).toBe(0);
    expect(bloques[2].tono).toBe(7);
  });

  it('las áreas suman el 100% del lienzo', () => {
    const area = component.bloques().reduce((s, b) => s + b.w * b.h, 0);
    expect(area).toBeCloseTo(10000, 0);
  });

  it('emite la dependencia elegida y la deselecciona al repetir', () => {
    const espia = jest.fn();
    component.seleccionar.subscribe(espia);
    const botones: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button.bloque'));
    botones[0].click();
    expect(espia).toHaveBeenLastCalledWith('1');

    fixture.componentRef.setInput('seleccionada', '1');
    fixture.detectChanges();
    expect(botones[0].classList).toContain('seleccionado');
    expect(botones[1].classList).toContain('atenuado');
    botones[0].click();
    expect(espia).toHaveBeenLastCalledWith(null);

    botones[2].click();
    expect(espia).toHaveBeenCalledTimes(2);
  });

  it('al hacer clic en «Otras» muestra sus dependencias y permite filtrar por una', () => {
    const espia = jest.fn();
    component.seleccionar.subscribe(espia);
    expect(fixture.nativeElement.querySelector('.detalle-otras')).toBeNull();

    fixture.nativeElement.querySelectorAll('button.bloque')[2].click();
    fixture.detectChanges();
    const otras: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button.otra'));
    const detalle = otras.map((b) => [
      b.textContent!.split(b.querySelector('b')!.textContent!)[0].trim(),
      b.querySelector('b')!.textContent,
      b.querySelector('small')!.textContent,
    ]);
    expect(detalle).toEqual([
      ['Dependencia 3', '2', '2%'],
      ['Dependencia 4', '1', '1%'],
    ]);

    otras[1].click();
    expect(espia).toHaveBeenLastCalledWith('4');

    fixture.nativeElement.querySelectorAll('button.bloque')[2].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detalle-otras')).toBeNull();
  });

  it('muestra un mensaje si no hay contratos', () => {
    fixture.componentRef.setInput('grupos', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin contratos en esta vigencia.');
  });
});
