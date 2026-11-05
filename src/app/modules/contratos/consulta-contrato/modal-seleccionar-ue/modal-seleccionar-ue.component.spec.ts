import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { ModalSeleccionarUeComponent } from './modal-seleccionar-ue.component';

describe('ModalSeleccionarUeComponent', () => {
  let component: ModalSeleccionarUeComponent;
  let fixture: ComponentFixture<ModalSeleccionarUeComponent>;
  let mockDialogRef: jest.Mocked<MatDialogRef<ModalSeleccionarUeComponent>>;
  let mockParametrosService: { getParametrosPorTipo: jest.Mock };

  beforeEach(() => {
    mockDialogRef = {
      close: jest.fn(),
    } as any;

    mockParametrosService = {
      getParametrosPorTipo: jest.fn().mockResolvedValue({
        [environment.UNIDAD_EJECUTORA_ID]: [
          { Id: environment.UNIDADES_EJECUTORAS.RECTORIA, Nombre: 'Rectoría' },
          { Id: environment.UNIDADES_EJECUTORAS.IDEXUD, Nombre: 'IDEXUD' },
        ],
      }),
    };

    TestBed.configureTestingModule({
      declarations: [ModalSeleccionarUeComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ParametrosService, useValue: mockParametrosService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalSeleccionarUeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente con los IDs y nombres de parámetros CRUD (6818, 6819)', async () => {
    await fixture.whenStable();
    expect(component).toBeTruthy();
    expect(component.selectedUe.id).toBe(environment.UNIDADES_EJECUTORAS.RECTORIA);
    expect(component.unidades[0].id).toBe(6818);
    expect(component.unidades[0].nombre).toBe('Rectoría');
    expect(component.unidades[1].id).toBe(6819);
    expect(component.unidades[1].nombre).toBe('IDEXUD');
  });

  it('debe cargar dinámicamente cualquier nueva unidad ejecutora registrada en parámetros CRUD', async () => {
    mockParametrosService.getParametrosPorTipo.mockResolvedValueOnce({
      [environment.UNIDAD_EJECUTORA_ID]: [
        { Id: 6818, Nombre: 'Rectoría' },
        { Id: 6819, Nombre: 'IDEXUD' },
        { Id: 7001, Nombre: 'Nueva Unidad Ejecutora', Descripcion: 'Descripción personalizada' },
      ],
    });

    await component.ngOnInit();

    expect(component.unidades).toHaveLength(3);
    expect(component.unidades[2]).toEqual({
      id: 7001,
      codigo: '03',
      nombre: 'Nueva Unidad Ejecutora',
      descripcion: 'Descripción personalizada',
    });
  });

  it('debe permitir seleccionar otra unidad ejecutora', () => {
    const ue2 = component.unidades[1];
    component.seleccionar(ue2);
    expect(component.selectedUe.id).toBe(environment.UNIDADES_EJECUTORAS.IDEXUD);
  });

  it('debe cerrar el diálogo retornando la unidad ejecutora al confirmar', () => {
    component.confirmar();
    expect(mockDialogRef.close).toHaveBeenCalledWith(component.selectedUe);
  });

  it('debe cerrar el diálogo retornando null al cancelar', () => {
    component.cancelar();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });
});
