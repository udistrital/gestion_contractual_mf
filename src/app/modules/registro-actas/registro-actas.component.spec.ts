import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RegistroActasComponent } from './registro-actas.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';

describe('RegistroActasComponent', () => {
  let component: RegistroActasComponent;
  let fixture: ComponentFixture<RegistroActasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [RegistroActasComponent],
      providers: [{ provide: GestorDocumentalService, useValue: {} }],
    });
    fixture = TestBed.createComponent(RegistroActasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

