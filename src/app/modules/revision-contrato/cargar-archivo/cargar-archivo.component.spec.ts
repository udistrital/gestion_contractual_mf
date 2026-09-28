import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CargarArchivoComponent } from './cargar-archivo.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';

describe('CargarArchivoComponent', () => {
  let component: CargarArchivoComponent;
  let fixture: ComponentFixture<CargarArchivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CargarArchivoComponent],
      providers: [
        GestorDocumentalService,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CargarArchivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
