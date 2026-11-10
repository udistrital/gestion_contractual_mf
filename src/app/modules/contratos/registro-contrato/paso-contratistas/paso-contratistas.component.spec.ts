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
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

// Ids ficticios: el de "Contratista Único" se toma por nombre, no por Id.
const UNICO = 9120;
const CONSORCIO = 9121;
const CLASES = [
  { Id: UNICO, Nombre: 'Contratista Único' },
  { Id: CONSORCIO, Nombre: 'Consorcio' },
  { Id: 9122, Nombre: 'Unión Temporal' },
];
const tick = () => new Promise((resolve) => setTimeout(resolve));

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

  const mockParametrosService = {
    getParametrosPorTipo: jest.fn(),
  };

  const mockContratoGeneralCrudService = {
    // El contratista vive en contrato_general.
    get: jest.fn().mockReturnValue(
      of({ Success: true, Status: '200', Data: { id: 105, proveedor_numero_documento: '', tipo_persona_id: 0 } })
    ),
    put: jest.fn().mockReturnValue(of({ Success: true, Status: '200', Data: { id: 105 } })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockParametrosService.getParametrosPorTipo.mockResolvedValue({ [environment.CLASE_CONTRATISTA_ID]: CLASES });
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
        { provide: ParametrosService, useValue: mockParametrosService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoContratistasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await tick();
  });

  it('debe crearse exitosamente', () => {
    expect(component).toBeTruthy();
  });

  it('carga las clases del parámetro tipo 120 y preselecciona Contratista Único por nombre', () => {
    expect(mockParametrosService.getParametrosPorTipo).toHaveBeenCalledWith([environment.CLASE_CONTRATISTA_ID]);
    expect(component.tiposContratista).toEqual(CLASES);
    expect(component.claseContratistaUnicoId).toBe(UNICO);
    expect(component.form.get('claseContratista')?.value).toBe(UNICO);
    expect(component.mostrarConsulta).toBe(true);
    expect(component.form.get('documentoContratista')?.value).toBe('');
  });

  it('otra clase oculta la consulta del contratista', () => {
    component.form.get('documentoContratista')?.setValue('1000000001');
    component.form.get('claseContratista')?.setValue(CONSORCIO);
    expect(component.mostrarConsulta).toBe(false);
    expect(component.form.get('documentoContratista')?.value).toBeNull();
  });

  it('debe precargar datos del contratista y bloquear los controles si bloquearContratista es true', () => {
    const mockPrevalidado = {
      proveedor: {
        tipo_persona: 'NATURAL',
        numero_documento: '1000000001',
        nombre_completo_proveedor: 'CONTRATISTA DE PRUEBA',
        direccion: 'Calle 100 # 15-20',
        ciudad_contacto: 'Bogotá',
        correo: 'contratista@prueba.local',
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
    expect(component.form.get('documentoContratista')?.value).toBe('1000000001');
    expect(component.form.get('documentoContratista')?.disabled).toBe(true);
    expect(component.form.get('claseContratista')?.disabled).toBe(true);
    expect(component.contratistaObject.nombre).toBe('CONTRATISTA DE PRUEBA');
  });

  it('debe permitir guardar y continuar cuando el contratista está prevalidado y bloqueado', async () => {
    const mockPrevalidado = {
      proveedor: {
        tipo_persona: 'NATURAL',
        numero_documento: '1000000001',
        nombre_completo_proveedor: 'CONTRATISTA DE PRUEBA',
        direccion: 'Calle 100 # 15-20',
        ciudad_contacto: 'Bogotá',
        correo: 'contratista@prueba.local',
        ciudad_expedicion_documento: 'Bogotá',
        tipo_persona_id: 1,
      },
      contratos: [],
    };

    fixture.componentRef.setInput('bloquearContratista', true);
    fixture.componentRef.setInput('contratistaPrevalidado', mockPrevalidado);
    fixture.componentRef.setInput('contratoGeneral', { id: 105, numero_contrato: '123' } as any);
    fixture.detectChanges();
    await tick();

    const nextStepSpy = jest.fn();
    component.nextStep.subscribe(nextStepSpy);

    expect(component.form.valid).toBe(true);
    expect(component.datosContratista).toBeTruthy();

    component.guardarYContinuar();

    expect(mockContratoGeneralCrudService.put).toHaveBeenCalledWith(105, {
      proveedor_numero_documento: '1000000001',
      tipo_persona_id: 1,
      clase_proveedor_id: UNICO,
    });
    expect(mockAlertService.showSuccessAlert).toHaveBeenCalled();
  });

  describe('clase de contratista guardada', () => {
    it('al editar carga la clase guardada en clase_proveedor_id', async () => {
      mockContratoGeneralCrudService.get.mockReturnValueOnce(
        of({ Success: true, Status: '200', Data: { id: 106, proveedor_numero_documento: '', clase_proveedor_id: CONSORCIO } })
      );
      fixture.componentRef.setInput('contratoGeneral', { id: 106 } as any);
      fixture.detectChanges();
      await tick();
      expect(component.form.get('claseContratista')?.value).toBe(CONSORCIO);
    });

    it('un contrato sin clase guardada queda como Contratista Único', async () => {
      mockContratoGeneralCrudService.get.mockReturnValueOnce(
        of({ Success: true, Status: '200', Data: { id: 107, proveedor_numero_documento: '', clase_proveedor_id: null } })
      );
      fixture.componentRef.setInput('contratoGeneral', { id: 107 } as any);
      fixture.detectChanges();
      await tick();
      expect(component.form.get('claseContratista')?.value).toBe(UNICO);
    });
  });

  describe('sin clases en Parámetros', () => {
    async function crearCon(respuesta: Promise<unknown>) {
      mockParametrosService.getParametrosPorTipo.mockReturnValueOnce(respuesta);
      fixture = TestBed.createComponent(PasoContratistasComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await tick();
      fixture.detectChanges();
    }

    it('muestra un mensaje claro si Parámetros no devuelve opciones', async () => {
      await crearCon(Promise.resolve({ [environment.CLASE_CONTRATISTA_ID]: [] }));
      expect(component.errorClases).toContain('No se pudieron cargar las clases de contratista');
      expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar las clases de contratista');
      expect(component.form.get('claseContratista')?.value).toBeNull();
    });

    it('muestra el mismo mensaje si la consulta a Parámetros falla', async () => {
      await crearCon(Promise.reject(new Error('caído')));
      expect(component.errorClases).toContain('No se pudieron cargar las clases de contratista');
    });

    it('con el contratista bloqueado y sin clase no guarda', async () => {
      await crearCon(Promise.resolve({ [environment.CLASE_CONTRATISTA_ID]: [] }));
      fixture.componentRef.setInput('bloquearContratista', true);
      fixture.componentRef.setInput('contratistaPrevalidado', {
        proveedor: { tipo_persona: 'NATURAL', numero_documento: '1000000001', nombre_completo_proveedor: 'CONTRATISTA DE PRUEBA', tipo_persona_id: 1 },
        contratos: [],
      });
      fixture.componentRef.setInput('contratoGeneral', { id: 105 } as any);
      fixture.detectChanges();
      await tick();
      // El contratista prevalidado no se borra aunque no haya clase.
      expect(component.datosContratista).toBeTruthy();
      component.guardarYContinuar();
      expect(mockContratoGeneralCrudService.put).not.toHaveBeenCalled();
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(expect.stringContaining('No se pudieron cargar las clases'));
    });

    it('si el prevalidado llega antes que las clases, lo conserva y luego fija Contratista Único', async () => {
      let responder: (valor: unknown) => void = () => {};
      mockParametrosService.getParametrosPorTipo.mockReturnValueOnce(new Promise((r) => (responder = r)));
      fixture = TestBed.createComponent(PasoContratistasComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('bloquearContratista', true);
      fixture.componentRef.setInput('contratistaPrevalidado', {
        proveedor: { tipo_persona: 'NATURAL', numero_documento: '1000000001', nombre_completo_proveedor: 'CONTRATISTA DE PRUEBA', tipo_persona_id: 1 },
        contratos: [],
      });
      fixture.detectChanges();
      expect(component.datosContratista).toBeTruthy();
      responder({ [environment.CLASE_CONTRATISTA_ID]: CLASES });
      await tick();
      expect(component.datosContratista).toBeTruthy();
      expect(component.form.getRawValue().claseContratista).toBe(UNICO);
      expect(component.form.getRawValue().documentoContratista).toBe('1000000001');
    });

    it('sin "Contratista Único" entre las opciones también avisa', async () => {
      await crearCon(Promise.resolve({ [environment.CLASE_CONTRATISTA_ID]: [{ Id: CONSORCIO, Nombre: 'Consorcio' }] }));
      expect(component.errorClases).not.toBe('');
    });
  });
});
