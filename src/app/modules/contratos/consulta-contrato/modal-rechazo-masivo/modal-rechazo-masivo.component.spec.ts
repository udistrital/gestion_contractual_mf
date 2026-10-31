import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalRechazoMasivoComponent } from './modal-rechazo-masivo.component';
import { ContratoGeneral } from 'src/app/types/types';

describe('ModalRechazoMasivoComponent', () => {
  let component: ModalRechazoMasivoComponent;
  let fixture: ComponentFixture<ModalRechazoMasivoComponent>;

  const mockDialogRef = {
    close: jest.fn(),
  };

  const mockContratos: ContratoGeneral[] = [
    {
      id: 11,
      unidad_ejecutora_id: 1,
      numero_contrato: 'CT-2026-011',
      vigencia: '2026',
      contratista: { nombre_completo: 'Mariana Duarte' },
    },
    {
      id: 12,
      unidad_ejecutora_id: 1,
      consecutivo_elaboracion: 'ELAB-2026-012',
      vigencia: '2026',
      contratista: { razon_social: 'Ingeniería Global SAS' },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalRechazoMasivoComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { contratos: mockContratos } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalRechazoMasivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.totalContratos).toBe(2);
    expect(component.tipoObservacion).toBe('general');
  });

  it('debe validar que el motivo no sea vacío en modo general', () => {
    component.motivoRechazo = '   ';
    expect(component.esValido).toBe(false);

    component.motivoRechazo = 'Ajustar CDP';
    expect(component.esValido).toBe(true);
  });

  it('no debe confirmar si el motivo es inválido', () => {
    component.motivoRechazo = '   ';
    component.confirmar();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('debe confirmar con motivo limpio cuando es válido en modo general', () => {
    component.motivoRechazo = '  Ajustar rubro presupuestal y CDP en paso 1  ';
    component.confirmar();
    expect(mockDialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmado: true,
        tipoObservacion: 'general',
        motivo: 'Ajustar rubro presupuestal y CDP en paso 1',
        motivoGeneral: 'Ajustar rubro presupuestal y CDP en paso 1',
      })
    );
  });

  it('debe permitir cambiar a modo individual y validar por contrato', () => {
    component.cambiarTipo('individual');
    expect(component.tipoObservacion).toBe('individual');
    expect(component.esValido).toBe(false);

    component.setMotivoContrato(mockContratos[0], 'Falta acta de inicio');
    expect(component.esValido).toBe(false);

    component.setMotivoContrato(mockContratos[1], 'Corregir póliza');
    expect(component.esValido).toBe(true);

    component.confirmar();
    expect(mockDialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmado: true,
        tipoObservacion: 'individual',
        motivosPorContrato: {
          11: 'Falta acta de inicio',
          12: 'Corregir póliza',
        },
      })
    );
  });

  it('debe permitir copiar motivo general a todos los contratos individuales', () => {
    component.motivoGeneral = 'Motivo general para todos';
    component.copiarGeneralAIndividuales();

    expect(component.getMotivoContrato(mockContratos[0])).toBe('Motivo general para todos');
    expect(component.getMotivoContrato(mockContratos[1])).toBe('Motivo general para todos');
  });

  it('debe cerrar con confirmado=false al pulsar cancelar', () => {
    component.cancelar();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ confirmado: false });
  });

  it('debe obtener número y contratista correctamente', () => {
    expect(component.getNumeroContrato(mockContratos[0])).toBe('CT-2026-011');
    expect(component.getNombreContratista(mockContratos[0])).toBe('Mariana Duarte');
  });

  it('debe manejar fallback cuando no hay datos en data', () => {
    component.data = {} as any;
    expect(component.totalContratos).toBe(0);
  });
});
