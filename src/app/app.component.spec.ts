import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { HuellaNavegadorService } from './core/services/huella-navegador/huella-navegador.service';

describe('AppComponent', () => {
  const huellaNavegador = { iniciar: jest.fn() };

  beforeEach(() => {
    huellaNavegador.iniciar.mockClear();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [{ provide: HuellaNavegadorService, useValue: huellaNavegador }],
    });
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'argo-gestion-contractual-mf'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('argo-gestion-contractual-mf');
  });

  it('debería iniciar la huella del navegador después del primer render', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(huellaNavegador.iniciar).not.toHaveBeenCalled();

    fixture.detectChanges();

    expect(huellaNavegador.iniciar).toHaveBeenCalledTimes(1);
  });

});
