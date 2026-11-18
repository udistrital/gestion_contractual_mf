import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PdfViewerModalComponent } from './pdf-viewer-modal.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { PlantillaModalComponent } from 'src/app/shared/templates/plantilla-modal/plantilla-modal.component';

/** Monta el modal con la plantilla de modal del MF, sin cargar el PDF. */
function montar(data: Record<string, unknown>) {
  TestBed.configureTestingModule({
    declarations: [PdfViewerModalComponent, PlantillaModalComponent],
    providers: [
      GestorDocumentalService,
      { provide: MatDialogRef, useValue: {} },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(PdfViewerModalComponent);
  jest.spyOn(fixture.componentInstance, 'loadPdf').mockImplementation(() => null as any);
  fixture.detectChanges();
  const texto = (): string => (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';
  const botones = (): string[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).map((b) => b.textContent?.trim() ?? '');
  return { fixture, component: fixture.componentInstance, texto, botones };
}

describe('PdfViewerModalComponent', () => {
  it('se crea con la plantilla de modal del MF', () => {
    const { component, fixture } = montar({ file: null });
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('plantilla-modal')).not.toBeNull();
  });

  it('sin título en data muestra "Documentos" y sin descripción', () => {
    const { component, texto } = montar({ file: null });
    expect(component.titulo).toBe('Documentos');
    expect(component.descripcion).toBe('');
    expect(texto()).toContain('Documentos');
  });

  it('muestra el título y la descripción que recibe por data', () => {
    const { texto } = montar({
      file: null,
      datos: null,
      titulo: 'Minuta',
      descripcion: 'Minuta cargada el 10/11/2026',
    });
    expect(texto()).toContain('Minuta');
    expect(texto()).toContain('Minuta cargada el 10/11/2026');
  });

  it('desde el paso de cláusulas (datos null) no muestra "Guardar"', () => {
    const { botones } = montar({ file: null, datos: null, titulo: 'Minuta preliminar' });
    expect(botones().some((b) => b.includes('Cerrar'))).toBe(true);
    expect(botones().some((b) => b.includes('Guardar'))).toBe(false);
  });

  it('como lo abre paso-documentos ({ file }), tampoco muestra "Guardar"', () => {
    const { botones } = montar({ file: null });
    expect(botones().some((b) => b.includes('Guardar'))).toBe(false);
  });

  it('con datos de registro conserva "Guardar"', () => {
    const { botones } = montar({ file: null, datos: { base64: 'JVBER', nombre: 'n', descripcion: 'd' } });
    expect(botones().some((b) => b.includes('Guardar'))).toBe(true);
  });
});
