import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalEspecificacionComponent as ModalEspecificacionComponent } from './modal-especificacion.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('ModalEspecificacionComponent', () => {
  let component: ModalEspecificacionComponent;
  let fixture: ComponentFixture<ModalEspecificacionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalEspecificacionComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} }, 
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(ModalEspecificacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
