import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoObligacionesComponent } from './paso-obligaciones.component';

describe('PasoObligacionesComponent', () => {
  let component: PasoObligacionesComponent;
  let fixture: ComponentFixture<PasoObligacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PasoObligacionesComponent]
    });
    fixture = TestBed.createComponent(PasoObligacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
