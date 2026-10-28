import { TestBed } from '@angular/core/testing';
import { TableroModule } from './tablero.module';
import { InicioTableroComponent } from './inicio-tablero/inicio-tablero.component';

describe('TableroModule', () => {
  it('declara y exporta los componentes del tablero', () => {
    TestBed.configureTestingModule({ imports: [TableroModule] });
    expect(TestBed.inject(TableroModule)).toBeTruthy();
    expect(TestBed.inject(TableroModule).constructor).toBe(TableroModule);
    expect(InicioTableroComponent).toBeDefined();
  });
});
