import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { PasoGarantiasComponent } from './paso-garantias.component';
import { PolizasService } from 'src/app/services/polizas.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';

describe('PasoGarantiasComponent', () => {
  let component: PasoGarantiasComponent;
  let fixture: ComponentFixture<PasoGarantiasComponent>;
  let polizasService: jest.Mocked<Partial<PolizasService>>;
  let parametrosService: jest.Mocked<Partial<ParametrosService>>;
  let alertService: jest.Mocked<Partial<AlertService>>;

  const mockParametrosService = {
    get: jest.fn().mockReturnValue(of({ Status: '200', Data: [{ Id: 1, Nombre: 'Buen manejo del anticipo' }] })),
  };

  const mockPolizasService = {
    getAmparos: jest.fn().mockReturnValue(of({ Status: '200', Data: [] })),
    postAmparos: jest.fn().mockReturnValue(of({ Status: '200', Data: [] })),
    putAmparos: jest.fn().mockReturnValue(of({ Status: '200', Data: [] })),
  };

  const mockAlertService = {
    showAlert: jest.fn(),
    showSuccessAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
    showErrorAlert: jest.fn(),
    showConfirmAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [PasoGarantiasComponent],
      providers: [
        FormBuilder,
        { provide: ParametrosService, useValue: mockParametrosService },
        { provide: PolizasService, useValue: mockPolizasService },
        { provide: AlertService, useValue: mockAlertService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoGarantiasComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debe permitir agregar una nueva fila', () => {
    const initialLength = component.filasFormArray.length;
    component.agregarFila();
    expect(component.filasFormArray.length).toBe(initialLength + 1);
  });

  it('debe permitir eliminar una fila', () => {
    component.agregarFila();
    const countBefore = component.filasFormArray.length;
    component.eliminarFila(0);
    expect(component.filasFormArray.length).toBe(countBefore - 1);
  });
});
