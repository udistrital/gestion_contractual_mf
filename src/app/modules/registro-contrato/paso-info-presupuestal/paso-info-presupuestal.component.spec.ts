import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal.component';
import { ParametrosService } from 'src/app/services/parametros.service';

describe('PasoInfoPresupuestalComponent', () => {
  let component: PasoInfoPresupuestalComponent;
  let fixture: ComponentFixture<PasoInfoPresupuestalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoInfoPresupuestalComponent],
      providers: [ParametrosService],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(PasoInfoPresupuestalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
