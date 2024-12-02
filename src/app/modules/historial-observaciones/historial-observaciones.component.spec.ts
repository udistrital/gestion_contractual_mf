import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialObservacionesComponent as HistorialObservacionesComponent } from './historial-observaciones.component';

describe('HistorialObservacionesComponent', () => {
  let component: HistorialObservacionesComponent;
  let fixture: ComponentFixture<HistorialObservacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HistorialObservacionesComponent],
    });
    fixture = TestBed.createComponent(HistorialObservacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
