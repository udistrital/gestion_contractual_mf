import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PdfVisualizadorComponent } from './pdf-visualizador.component';

const PDF = btoa('%PDF-1.4\n%%EOF\n');

describe('PdfVisualizadorComponent', () => {
  let component: PdfVisualizadorComponent;
  let fixture: ComponentFixture<PdfVisualizadorComponent>;
  let errores: number;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PdfVisualizadorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PdfVisualizadorComponent);
    component = fixture.componentInstance;
    errores = 0;
    component.errorDocumento.subscribe(() => errores++);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    fixture.detectChanges();
  });

  afterEach(() => jest.restoreAllMocks());

  const visor = () => fixture.nativeElement.querySelector('pdf-viewer');

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga un base64 válido', () => {
    fixture.componentRef.setInput('base64Document', PDF);
    fixture.detectChanges();

    expect(component.pdfLoaded).toBe(true);
    expect(component.pdfSrc?.length).toBe(atob(PDF).length);
    expect(visor()).not.toBeNull();
    expect(errores).toBe(0);
  });

  it.each([
    ['vacío', ''],
    ['null', null],
  ])('con un valor %s vacía el visor y no conserva el PDF anterior', (_caso, valor) => {
    fixture.componentRef.setInput('base64Document', PDF);
    fixture.detectChanges();

    fixture.componentRef.setInput('base64Document', valor);
    fixture.detectChanges();

    expect(component.pdfLoaded).toBe(false);
    expect(component.pdfSrc).toBeUndefined();
    expect(visor()).toBeNull();
    expect(errores).toBe(0);
  });

  it('si atob falla vacía el visor y avisa al padre', () => {
    fixture.componentRef.setInput('base64Document', PDF);
    fixture.detectChanges();

    fixture.componentRef.setInput('base64Document', 'esto no es base64 ###');
    fixture.detectChanges();

    expect(component.pdfLoaded).toBe(false);
    expect(component.pdfSrc).toBeUndefined();
    expect(errores).toBe(1);
  });

  it('si el visor (pdf.js) no puede abrir el PDF vacía el visor y avisa al padre', () => {
    fixture.componentRef.setInput('base64Document', PDF);
    fixture.detectChanges();

    component.onErrorPdf(new Error('Invalid PDF structure'));
    fixture.detectChanges();

    expect(component.pdfLoaded).toBe(false);
    expect(visor()).toBeNull();
    expect(errores).toBe(1);
  });

  it('el evento (error) de pdf-viewer está enlazado a onErrorPdf', () => {
    fixture.componentRef.setInput('base64Document', PDF);
    fixture.detectChanges();
    const espia = jest.spyOn(component, 'onErrorPdf');

    visor().dispatchEvent(new CustomEvent('error', { detail: 'falla' }));

    expect(espia).toHaveBeenCalled();
    expect(errores).toBe(1);
  });
});
