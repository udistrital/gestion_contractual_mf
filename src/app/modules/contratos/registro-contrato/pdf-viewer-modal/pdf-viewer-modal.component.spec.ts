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

  it('sin título en data muestra "Documentos"', () => {
    expect(component.titulo).toBe('Documentos');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Documentos');
  });
});

describe('PdfViewerModalComponent con título', () => {
  it('muestra el título que recibe por data', () => {
    TestBed.configureTestingModule({
      declarations: [PdfViewerModalComponent],
      providers: [
        GestorDocumentalService,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { file: null, datos: null, titulo: 'Minuta preliminar' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(PdfViewerModalComponent);
    jest.spyOn(fixture.componentInstance, 'loadPdf').mockImplementation(() => null as any);
    fixture.detectChanges();

    expect(fixture.componentInstance.titulo).toBe('Minuta preliminar');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Minuta preliminar');
  });
});
