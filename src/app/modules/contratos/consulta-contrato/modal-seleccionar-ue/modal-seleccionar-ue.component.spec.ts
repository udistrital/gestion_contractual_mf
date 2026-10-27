import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ModalSeleccionarUeComponent } from './modal-seleccionar-ue.component';

describe('ModalSeleccionarUeComponent', () => {
  let component: ModalSeleccionarUeComponent;
  let fixture: ComponentFixture<ModalSeleccionarUeComponent>;
  let mockDialogRef: jest.Mocked<MatDialogRef<ModalSeleccionarUeComponent>>;

  beforeEach(() => {
    mockDialogRef = {
      close: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      declarations: [ModalSeleccionarUeComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalSeleccionarUeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.selectedUe.id).toBe(1);
  });

  it('debe permitir seleccionar otra unidad ejecutora', () => {
    const ue2 = component.unidades[1];
    component.seleccionar(ue2);
    expect(component.selectedUe.id).toBe(2);
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
