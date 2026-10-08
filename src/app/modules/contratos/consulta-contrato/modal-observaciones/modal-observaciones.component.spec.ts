import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalObservacionesComponent as ModalObservacionesComponent } from './modal-observaciones.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('ModalObservacionesComponent', () => {
  let component: ModalObservacionesComponent;
  let fixture: ComponentFixture<ModalObservacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalObservacionesComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} }, 
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(ModalObservacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
