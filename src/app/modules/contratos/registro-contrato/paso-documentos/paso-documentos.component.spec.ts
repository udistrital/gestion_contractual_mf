import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { PasoDocumentosComponent } from './paso-documentos.component';

describe('PasoDocumentosComponent', () => {
  let component: PasoDocumentosComponent;
  let fixture: ComponentFixture<PasoDocumentosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoDocumentosComponent],
      providers: [GestorDocumentalService],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(PasoDocumentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
