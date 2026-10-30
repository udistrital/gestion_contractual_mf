import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal.component';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';

describe('PasoInfoPresupuestalComponent', () => {
  let component: PasoInfoPresupuestalComponent;
  let fixture: ComponentFixture<PasoInfoPresupuestalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoInfoPresupuestalComponent],
      providers: [
        {
          provide: ParametrosService,
          useValue: {
            getParametrosPorTipo: jest.fn().mockResolvedValue({}),
            getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: AlertService,
          useValue: {
            showErrorAlert: jest.fn().mockResolvedValue(true),
            showSuccessAlert: jest.fn().mockResolvedValue(true),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PasoInfoPresupuestalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
