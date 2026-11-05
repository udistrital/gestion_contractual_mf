import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubirArchivoComponent } from './cargar-archivo.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { of } from 'rxjs';

describe('CargarArchivoComponent', () => {
  let component: SubirArchivoComponent;
  let fixture: ComponentFixture<SubirArchivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SubirArchivoComponent],
      providers: [
        GestorDocumentalService,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SubirArchivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('registra la minuta sin usuario_id ni usuario_rol, que el DTO del CRUD rechaza', () => {
    const post = jest
      .spyOn(TestBed.inject(ContratoGeneralCrudService), 'postDocumentoContrato')
      .mockReturnValue(of({ id: 5 }));
    (component as any).data = { datos: { contrato_general_id: 42 } };

    component.registrarDocumento({ Id: 10, Enlace: 'uid-10' });

    const cuerpo = post.mock.calls[0][0];
    expect(cuerpo).toEqual(
      expect.objectContaining({ contrato_general_id: 42, documento_id: 10, documento_enlace: 'uid-10' })
    );
    expect(cuerpo).not.toHaveProperty('usuario_id');
    expect(cuerpo).not.toHaveProperty('usuario_rol');
  });
});
