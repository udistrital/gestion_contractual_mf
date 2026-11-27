import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
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
    get: jest.fn().mockReturnValue(of({
      Status: '200',
      Data: [
        { Id: 1, Nombre: 'Buen manejo del anticipo' },
        { Id: 2, Nombre: 'Cumplimiento del contrato' },
      ],
    })),
  };

  const mockPolizasService = {
    getAmparos: jest.fn().mockReturnValue(of({ Status: '200', Data: [] })),
    postAmparos: jest.fn().mockReturnValue(of({ Status: '200', Data: [] })),
    putAmparos: jest.fn().mockReturnValue(of({ Status: '200', Data: [] })),
    putAmparo: jest.fn().mockReturnValue(of({ Status: '200', Data: [] })),
  };

  const mockAlertService = {
    showAlert: jest.fn(),
    showSuccessAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
    showErrorAlert: jest.fn(),
    showConfirmAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
    fixture.componentRef.setInput('contratoGeneral', { id: 100 } as any);
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

  describe('guardarYContinuar y manejo de respuestas del MID', () => {
    function poblarFila(amparoId: number, suficiencia = '10', descripcion = 'Garantía de prueba') {
      component.agregarFila();
      const fila = component.filasFormArray.at(component.filasFormArray.length - 1);
      fila.patchValue({
        amparo: amparoId,
        suficienciaPorcentaje: suficiencia,
        descripcion,
      });
    }

    beforeEach(() => {
      component.amparos = [
        { Id: 1, Nombre: 'Buen manejo del anticipo' } as any,
        { Id: 2, Nombre: 'Cumplimiento del contrato' } as any,
      ];
    });

    it('guarda con éxito y emite nextStep cuando el MID responde 200/201 completo', async () => {
      poblarFila(1);
      mockPolizasService.postAmparos.mockReturnValue(of({
        Success: true,
        Status: 201,
        Message: 'Amparos creados',
        Data: [{ id: 50, amparo_id: 1 }],
      }));

      const nextSpy = jest.spyOn(component.nextStep, 'emit');
      await component.guardarYContinuar();

      expect(mockAlertService.showSuccessAlert).toHaveBeenCalledWith(
        'La información de garantías se ha guardado correctamente',
        'Datos guardados'
      );
      expect(nextSpy).toHaveBeenCalledTimes(1);
    });

    it('maneja respuesta 206 del MID mostrando los amparos fallidos y no emite nextStep', async () => {
      poblarFila(1);
      poblarFila(2);
      mockPolizasService.postAmparos.mockReturnValue(of({
        Success: true,
        Status: 206,
        Message: 'Algunos amparos no pudieron ser creados',
        Data: {
          creados: [{ id: 51, amparo_id: 1 }],
          errores: [
            {
              amparo: { amparo_id: 2 },
              error: 'Error de validación en CRUD',
            },
          ],
        },
      }));

      const nextSpy = jest.spyOn(component.nextStep, 'emit');
      await component.guardarYContinuar();

      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(
        expect.stringContaining('Cumplimiento del contrato'),
        'Registro parcial de garantías'
      );
      // El amparo 1 creado debe actualizar su ID en la fila
      expect(component.filasFormArray.at(0).get('id')?.value).toBe(51);
      expect(nextSpy).not.toHaveBeenCalled();
    });

    it('maneja fallo HTTP mostrando mensaje de error y no emite nextStep', async () => {
      poblarFila(1);
      mockPolizasService.postAmparos.mockReturnValue(throwError(() => new Error('Error de conexión')));

      const nextSpy = jest.spyOn(component.nextStep, 'emit');
      await component.guardarYContinuar();

      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(
        'Error de conexión',
        'Error al enviar amparo'
      );
      expect(nextSpy).not.toHaveBeenCalled();
    });
  });
});
