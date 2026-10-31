import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasoContratistasComponent } from './paso-contratistas.component';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from 'src/app/shared/modules/material.module';
import { CdkStepper } from '@angular/cdk/stepper';
import { MatStepper } from '@angular/material/stepper';
import { AlertService } from 'src/app/services/alert.service';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { of } from 'rxjs';

describe('PasoContratistasComponent', () => {
  let component: PasoContratistasComponent;
  let fixture: ComponentFixture<PasoContratistasComponent>;

  const mockAlertService = {
    showAlert: jest.fn(),
    showError: jest.fn(),
    showSuccessAlert: jest.fn().mockResolvedValue(true),
    showErrorAlert: jest.fn().mockResolvedValue(true),
  };

  const mockProveedoresService = {
    get: jest.fn(),
  };

  const mockContratoGeneralCrudService = {
    // El contratista vive en contrato_general (modelo v2).
    get: jest.fn().mockReturnValue(
      of({ Success: true, Status: 200, Data: { id: 105, proveedor_numero_documento: null } })
    ),
    put: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: { id: 105 } })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, MaterialModule, NoopAnimationsModule],
      declarations: [PasoContratistasComponent],
      providers: [
        FormBuilder,
        { provide: CdkStepper, useValue: {} },
        { provide: MatStepper, useValue: {} },
        { provide: AlertService, useValue: mockAlertService },
        { provide: ProveedoresService, useValue: mockProveedoresService },
        { provide: ContratoGeneralCrudService, useValue: mockContratoGeneralCrudService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoContratistasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse exitosamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar el formulario con clase1 y campos vacíos', () => {
    expect(component.form.get('claseContratista')?.value).toBe('clase1');
    expect(component.form.get('documentoContratista')?.value).toBe('');
  });

  it('debe precargar datos del contratista y bloquear los controles si bloquearContratista es true', () => {
    const mockPrevalidado = {
      proveedor: {
        tipo_persona: 'NATURAL',
        numero_documento: '1014285890',
        nombre_completo_proveedor: 'INGRID PAOLA MORALES MORALES',
        direccion: 'Calle 100 # 15-20',
        ciudad_contacto: 'Bogotá',
        correo: 'ingrid@correo.udistrital.edu.co',
        ciudad_expedicion_documento: 'Bogotá',
        tipo_persona_id: 1,
      },
      contratos: [],
      ultimoContrato: {
        numero_contrato: 'CTR-2024-001',
        vigencia: '2024',
      },
    };

    fixture.componentRef.setInput('bloquearContratista', true);
    fixture.componentRef.setInput('contratistaPrevalidado', mockPrevalidado);
    fixture.detectChanges();

    expect(component.datosContratista).toEqual(mockPrevalidado);
    expect(component.form.get('documentoContratista')?.value).toBe('1014285890');
    expect(component.form.get('documentoContratista')?.disabled).toBe(true);
    expect(component.form.get('claseContratista')?.disabled).toBe(true);
    expect(component.contratistaObject.nombre).toBe('INGRID PAOLA MORALES MORALES');
  });

  it('debe permitir guardar y continuar cuando el contratista está prevalidado y bloqueado', async () => {
    const mockPrevalidado = {
      proveedor: {
        tipo_persona: 'NATURAL',
        numero_documento: '1014285890',
        nombre_completo_proveedor: 'INGRID PAOLA MORALES MORALES',
        direccion: 'Calle 100 # 15-20',
        ciudad_contacto: 'Bogotá',
        correo: 'ingrid@correo.udistrital.edu.co',
        ciudad_expedicion_documento: 'Bogotá',
        tipo_persona_id: 1,
      },
      contratos: [],
    };

    fixture.componentRef.setInput('bloquearContratista', true);
    fixture.componentRef.setInput('contratistaPrevalidado', mockPrevalidado);
    fixture.componentRef.setInput('contratoGeneral', { id: 105, numero_contrato: '123' } as any);
    fixture.detectChanges();

    const nextStepSpy = jest.fn();
    component.nextStep.subscribe(nextStepSpy);

    expect(component.form.valid).toBe(true);
    expect(component.datosContratista).toBeTruthy();

    component.guardarYContinuar();

    expect(mockContratoGeneralCrudService.put).toHaveBeenCalledWith(105, {
      proveedor_numero_documento: '1014285890',
      tipo_persona_id: 1,
    });
    expect(mockAlertService.showSuccessAlert).toHaveBeenCalled();
  });
});
