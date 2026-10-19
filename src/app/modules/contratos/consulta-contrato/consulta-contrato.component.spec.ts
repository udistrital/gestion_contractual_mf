import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { ConsultaContratoComponent } from './consulta-contrato.component';

describe('ConsultaContratoComponent', () => {
  let component: ConsultaContratoComponent;
  let fixture: ComponentFixture<ConsultaContratoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultaContratoComponent],
      providers: [
        FormBuilder,
        { provide: AlertService, useValue: { showErrorAlert: jest.fn(), showSuccessAlert: jest.fn() } },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: ParametrosService, useValue: { get: jest.fn().mockReturnValue(of({ Data: [] })) } },
        { provide: ContratoGeneralMidService, useValue: { get: jest.fn().mockReturnValue(of({ Data: [] })), getContratos: jest.fn().mockReturnValue(of({ Data: [], Total: 0 })) } },
        { provide: RolService, useValue: { getRol: jest.fn().mockReturnValue([]) } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: {}, paramMap: of({ get: () => null }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ConsultaContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
