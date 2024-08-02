import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoEspecificacionesComponent } from './paso-especificaciones.component';

describe('PasoEspecificacionesComponent', () => {
  let component: PasoEspecificacionesComponent;
  let fixture: ComponentFixture<PasoEspecificacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoEspecificacionesComponent]
    });
    fixture = TestBed.createComponent(PasoEspecificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
