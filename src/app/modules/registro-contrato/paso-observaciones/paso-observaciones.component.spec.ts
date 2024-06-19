import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoObservacionesComponent } from './paso-observaciones.component';

describe('PasoObservacionesComponent', () => {
  let component: PasoObservacionesComponent;
  let fixture: ComponentFixture<PasoObservacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PasoObservacionesComponent]
    });
    fixture = TestBed.createComponent(PasoObservacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
