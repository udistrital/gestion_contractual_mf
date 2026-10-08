import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ParagrafoDialogComponent } from './paragrafo-dialog.component';

describe('ParagrafoDialogComponent', () => {
  let component: ParagrafoDialogComponent;
  let fixture: ComponentFixture<ParagrafoDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ParagrafoDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ParagrafoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
