import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { PasoGarantiasComponent } from './paso-garantias.component';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PolizasService } from 'src/app/services/polizas.service';
import { AlertService } from 'src/app/services/alert.service';

describe('PasoGarantiasComponent', () => {
  let component: PasoGarantiasComponent;
  let fixture: ComponentFixture<PasoGarantiasComponent>;

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar con filas y permitir agregar una nueva fila', () => {
    expect(component.filasFormArray.length).toBeGreaterThanOrEqual(1);
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
