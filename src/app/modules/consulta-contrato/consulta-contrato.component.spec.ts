import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParametrosService } from 'src/app/services/parametros.service';
import { ConsultaContratoComponent } from './consulta-contrato.component';

describe('ConsultaContratoComponent', () => {
  let component: ConsultaContratoComponent;
  let fixture: ComponentFixture<ConsultaContratoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultaContratoComponent],
      providers: [ParametrosService]
    });
    fixture = TestBed.createComponent(ConsultaContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
