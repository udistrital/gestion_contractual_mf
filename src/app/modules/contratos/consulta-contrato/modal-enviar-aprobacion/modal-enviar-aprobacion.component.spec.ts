import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalEnviarAprobacionComponent } from './modal-enviar-aprobacion.component';

describe('ModalEnviarAprobacionComponent', () => {
  let component: ModalEnviarAprobacionComponent;
  let fixture: ComponentFixture<ModalEnviarAprobacionComponent>;

  const mockDialogRef = {
    close: jest.fn(),
  };

  const mockData = {
    contrato: {
      id: 101,
      numero_contrato: 'CT-2026-101',
      vigencia: '2026',
      valor_pesos: 55000000,
      contratista: {
        nombre_completo: 'Juan Pérez Silva',
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalEnviarAprobacionComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEnviarAprobacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe extraer el número de contrato correctamente', () => {
    expect(component.numeroContrato).toBe('CT-2026-101');
  });

  it('debe extraer el nombre del contratista', () => {
    expect(component.nombreContratista).toBe('Juan Pérez Silva');
  });

  it('debe formatear el valor del contrato en pesos', () => {
    expect(component.valorContrato).toContain('55.000.000');
  });

  it('debe cerrar con confirmado=false al pulsar cancelar()', () => {
    component.cancelar();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ confirmado: false });
  });

  it('debe cerrar con confirmado=true y la observación al pulsar confirmar()', () => {
    component.observacion = '  Revisión prioritaria de pólizas y CDP  ';
    component.confirmar();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      confirmado: true,
      observacion: 'Revisión prioritaria de pólizas y CDP',
    });
  });

  it('debe manejar fallback cuando no hay datos de contratista o número', () => {
    component.data = { contrato: {} as any };
    expect(component.numeroContrato).toBe('Sin número');
    expect(component.nombreContratista).toBe('No registrado');
    expect(component.valorContrato).toBe('$ 0');
  });
});
