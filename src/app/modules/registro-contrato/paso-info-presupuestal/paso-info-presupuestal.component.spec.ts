import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal.component';

describe('PasoInfoPresupuestalComponent', () => {
  let component: PasoInfoPresupuestalComponent;
  let fixture: ComponentFixture<PasoInfoPresupuestalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PasoInfoPresupuestalComponent]
    });
    fixture = TestBed.createComponent(PasoInfoPresupuestalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
