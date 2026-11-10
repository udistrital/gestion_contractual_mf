import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubirArchivoComponent } from './cargar-archivo.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';
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

  it('registra la minuta por entidad y con el usuario, como la guarda el CRUD', () => {
    const post = jest
      .spyOn(TestBed.inject(GestionContractualCrudService), 'postDocumento')
      .mockReturnValue(of({ Data: { id: 5 } }) as any);
    (component as any).data = { datos: { contrato_general_id: 42, usuario_id: 7, usuario_rol: 'ORDENADOR_DEL_GASTO' } };

    component.registrarDocumento({ Id: 10, Enlace: 'uid-10' });

    expect(post.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        entidad_tipo: 'contrato_general',
        entidad_id: 42,
        usuario_id: 7,
        usuario_rol: 'ORDENADOR_DEL_GASTO',
        documento_id: 10,
        documento_enlace: 'uid-10',
      })
    );
  });
});
