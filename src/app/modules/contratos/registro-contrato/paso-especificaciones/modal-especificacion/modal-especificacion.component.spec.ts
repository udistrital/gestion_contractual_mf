import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalEspecificacionComponent } from './modal-especificacion.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

describe('ModalEspecificacionComponent', () => {
  let component: ModalEspecificacionComponent;
  let fixture: ComponentFixture<ModalEspecificacionComponent>;
  const mockDialogRef = { close: jest.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ModalEspecificacionComponent],
      providers: [
        FormBuilder,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEspecificacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe recalcular el valor_total automáticamente cuando cambian cantidad o valor_unitario', () => {
    component.formEspecificacion.patchValue({
      descripcion: 'Prueba de ítem',
      cantidad: 5,
      valor_unitario: 1000,
    });

    expect(component.formEspecificacion.get('valor_total')?.value).toBe(5000);
    expect(component.cantidadActual).toBe(5);
    expect(component.valorUnitarioActual).toBe(1000);
    expect(component.valorTotalActual).toBe(5000);
  });

  it('debe cerrar el diálogo con los datos al guardar si el formulario es válido', () => {
    component.formEspecificacion.patchValue({
      descripcion: 'Servicio de consultoría',
      cantidad: 2,
      valor_unitario: 500000,
      valor_total: 1000000,
    });

    component.guardarEspecificacion();
    expect(mockDialogRef.close).toHaveBeenCalledWith(expect.objectContaining({
      descripcion: 'Servicio de consultoría',
      cantidad: 2,
      valor_unitario: 500000,
      valor_total: 1000000,
    }));
  });
});
