import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalAprobacionMasivaComponent } from './modal-aprobacion-masiva.component';
import { ContratoGeneral } from 'src/app/types/types';

describe('ModalAprobacionMasivaComponent', () => {
  let component: ModalAprobacionMasivaComponent;
  let fixture: ComponentFixture<ModalAprobacionMasivaComponent>;

  const mockDialogRef = {
    close: jest.fn(),
  };

  const mockContratos: ContratoGeneral[] = [
    {
      id: 1,
      unidad_ejecutora_id: 1,
      numero_contrato: 'CT-2026-001',
      vigencia: '2026',
      valor_pesos: 20000000,
      contratista: { nombre_completo: 'Carlos Rodríguez' },
    },
    {
      id: 2,
      unidad_ejecutora_id: 1,
      consecutivo_elaboracion: 'ELAB-2026-002',
      vigencia: '2026',
      valor_pesos: 35000000,
      contratista: { razon_social: 'Soluciones TIC SAS' },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalAprobacionMasivaComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { contratos: mockContratos } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalAprobacionMasivaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe calcular el número total de contratos y el monto acumulado', () => {
    expect(component.totalContratos).toBe(2);
    expect(component.valorTotalLote).toBe(55000000);
    expect(component.valorTotalFormateado).toContain('55.000.000');
  });

  it('debe obtener número o consecutivo de contrato', () => {
    expect(component.getNumeroContrato(mockContratos[0])).toBe('CT-2026-001');
    expect(component.getNumeroContrato(mockContratos[1])).toBe('ELAB-2026-002');
  });

  it('debe obtener nombre o razón social del contratista', () => {
    expect(component.getNombreContratista(mockContratos[0])).toBe('Carlos Rodríguez');
    expect(component.getNombreContratista(mockContratos[1])).toBe('Soluciones TIC SAS');
  });

  it('debe cerrar con confirmado=false al cancelar', () => {
    component.cancelar();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ confirmado: false });
  });

  it('debe cerrar con confirmado=true y la observación al confirmar', () => {
    component.observacion = 'VoBo favorable para trámite';
    component.confirmar();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      confirmado: true,
      observacion: 'VoBo favorable para trámite',
    });
  });

  it('debe manejar fallback cuando no hay contratos en data', () => {
    component.data = {} as any;
    expect(component.totalContratos).toBe(0);
    expect(component.valorTotalLote).toBe(0);
  });
});
