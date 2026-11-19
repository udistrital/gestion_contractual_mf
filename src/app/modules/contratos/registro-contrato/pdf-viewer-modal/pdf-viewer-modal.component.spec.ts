import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PdfViewerModalComponent } from './pdf-viewer-modal.component';
import { AlertService } from 'src/app/services/alert.service';
import { PlantillaModalComponent } from 'src/app/shared/templates/plantilla-modal/plantilla-modal.component';

/** Monta el modal con la plantilla de modal del MF, sin cargar el PDF. */
function montar(data: Record<string, unknown>) {
  TestBed.configureTestingModule({
    declarations: [PdfViewerModalComponent, PlantillaModalComponent],
    providers: [
      { provide: AlertService, useValue: { showErrorAlert: jest.fn() } },
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
      titulo: 'Minuta',
      descripcion: 'Minuta cargada el 10/11/2026',
    });
    expect(texto()).toContain('Minuta');
    expect(texto()).toContain('Minuta cargada el 10/11/2026');
  });

  it('es solo de lectura: muestra "Cerrar" y nunca "Guardar"', () => {
    for (const data of [{ file: null, titulo: 'Minuta preliminar' }, { file: null }]) {
      TestBed.resetTestingModule();
      const { botones } = montar(data);
      expect(botones().some((b) => b.includes('Cerrar'))).toBe(true);
      expect(botones().some((b) => b.includes('Guardar'))).toBe(false);
    }
  });

});
