import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'; 

describe('ModalMotivosRechazoComponent', () => {
  let component: ModalMotivosRechazoComponent;
  let fixture: ComponentFixture<ModalMotivosRechazoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalMotivosRechazoComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} }, 
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(ModalMotivosRechazoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
