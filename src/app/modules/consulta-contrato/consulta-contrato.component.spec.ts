import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaContratoComponent } from './consulta-contrato.component';

describe('ConsultaContratoComponent', () => {
  let component: ConsultaContratoComponent;
  let fixture: ComponentFixture<ConsultaContratoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultaContratoComponent]
    });
    fixture = TestBed.createComponent(ConsultaContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
