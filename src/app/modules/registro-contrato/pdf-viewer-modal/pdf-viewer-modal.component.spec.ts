import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PdfViewerModalComponent } from './pdf-viewer-modal.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';

describe('PdfViewerModalComponent', () => {
  let component: PdfViewerModalComponent;
  let fixture: ComponentFixture<PdfViewerModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PdfViewerModalComponent],
      providers: [
        GestorDocumentalService,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {close: () => {}} }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(PdfViewerModalComponent);
    component = fixture.componentInstance;
    jest.spyOn(component, 'loadPdf').mockImplementation(() => {return null as any});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
