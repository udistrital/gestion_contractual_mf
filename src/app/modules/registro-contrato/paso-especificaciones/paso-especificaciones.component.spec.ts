import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PasoEspecificacionesComponent } from './paso-especificaciones.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';

describe('PasoEspecificacionesComponent', () => {
  let component: PasoEspecificacionesComponent;
  let fixture: ComponentFixture<PasoEspecificacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoEspecificacionesComponent],
      providers: [ParametrosService, GestorDocumentalService],
      schemas: [NO_ERRORS_SCHEMA] 
    });
    fixture = TestBed.createComponent(PasoEspecificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
