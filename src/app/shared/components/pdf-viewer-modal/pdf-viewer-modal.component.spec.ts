import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PdfViewerModalComponent } from './pdf-viewer-modal.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';
import { of } from 'rxjs';

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

  it('guarda con el tipo de documento y la entidad que llegan en data.datos', () => {
    const gestor = TestBed.inject(GestorDocumentalService);
    const crud = TestBed.inject(GestionContractualCrudService);
    const subir = jest
      .spyOn(gestor, 'postAny')
      .mockReturnValue(of({ Status: '200', res: { Id: 7, Enlace: 'uid' } }));
    const registrar = jest
      .spyOn(crud, 'postDocumento')
      .mockReturnValue(of({ Data: { id: 1 } }) as any);
    component.data.datos = {
      base64: 'pdf',
      nombre: 'ACTA DE INICIO 1',
      descripcion: 'Acta de inicio',
      id_tipo_documento_gestor: 175,
      tipo_documento_id: 175,
      entidad_tipo: 'acta_inicio',
      entidad_id: 3,
    };

    component.guardarDocumentoGestorDocumental();

    expect(subir).toHaveBeenCalledWith('document/upload', [
      expect.objectContaining({ IdTipoDocumento: 175, file: 'pdf' }),
    ]);
    expect(registrar).toHaveBeenCalledWith({
      tipo_documento_id: 175,
      entidad_tipo: 'acta_inicio',
      entidad_id: 3,
      documento_id: 7,
      documento_enlace: 'uid',
    });
  });
});