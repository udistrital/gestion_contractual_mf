import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { PdfViewerModalComponent } from './pdf-viewer-modal.component';
import { AlertService } from 'src/app/services/alert.service';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';
import { PlantillaModalComponent } from 'src/app/shared/templates/plantilla-modal/plantilla-modal.component';

const DATOS_ACTA = {
  base64: 'pdf',
  nombre: 'ACTA DE INICIO 1',
  descripcion: 'Acta de inicio',
  id_tipo_documento_gestor: 175,
  tipo_documento_id: 175,
  entidad_tipo: 'acta_inicio',
  entidad_id: 3,
};

/** Monta el modal con la plantilla de modal del MF, sin cargar el PDF. */
function montar(data: Record<string, unknown>) {
  TestBed.configureTestingModule({
    declarations: [PdfViewerModalComponent, PlantillaModalComponent],
    providers: [
      { provide: AlertService, useValue: { showErrorAlert: jest.fn(), showSuccessAlert: jest.fn() } },
      { provide: GestorDocumentalService, useValue: { postAny: jest.fn() } },
      { provide: GestionContractualCrudService, useValue: { postDocumento: jest.fn() } },
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

  it('sin datos para guardar (la minuta) es de solo lectura: muestra "Cerrar" y nunca "Guardar"', () => {
    for (const data of [{ file: null, titulo: 'Minuta preliminar' }, { file: null, titulo: 'Minuta' }, { file: null }]) {
      TestBed.resetTestingModule();
      const { botones } = montar(data);
      expect(botones().some((b) => b.includes('Cerrar'))).toBe(true);
      expect(botones().some((b) => b.includes('Guardar'))).toBe(false);
    }
  });

  it('con datos para guardar (acta de inicio, #359) muestra "Guardar"', () => {
    const { botones } = montar({ file: null, datos: { ...DATOS_ACTA } });
    expect(botones().some((b) => b.includes('Guardar'))).toBe(true);
  });

  it('guarda con el tipo de documento y la entidad que llegan en data.datos', () => {
    const { component } = montar({ file: null, datos: { ...DATOS_ACTA } });
    const gestor = TestBed.inject(GestorDocumentalService) as unknown as { postAny: jest.Mock };
    const crud = TestBed.inject(GestionContractualCrudService) as unknown as { postDocumento: jest.Mock };
    gestor.postAny.mockReturnValue(of({ Status: '200', res: { Id: 7, Enlace: 'uid' } }));
    crud.postDocumento.mockReturnValue(of({ Data: { id: 1 } }));

    component.guardarDocumentoGestorDocumental();

    expect(gestor.postAny).toHaveBeenCalledWith('document/upload', [
      expect.objectContaining({ IdTipoDocumento: 175, file: 'pdf' }),
    ]);
    expect(crud.postDocumento).toHaveBeenCalledWith({
      tipo_documento_id: 175,
      entidad_tipo: 'acta_inicio',
      entidad_id: 3,
      documento_id: 7,
      documento_enlace: 'uid',
    });
  });

  it('sin datos, guardar no sube ni registra nada', () => {
    const { component } = montar({ file: null });
    const gestor = TestBed.inject(GestorDocumentalService) as unknown as { postAny: jest.Mock };
    component.guardarDocumentoGestorDocumental();
    expect(gestor.postAny).not.toHaveBeenCalled();
  });
});
