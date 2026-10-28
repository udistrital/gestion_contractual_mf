import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { AlertService } from 'src/app/services/alert.service';
import { ModalValidarContratistaComponent } from './modal-validar-contratista.component';

describe('ModalValidarContratistaComponent', () => {
  let component: ModalValidarContratistaComponent;
  let fixture: ComponentFixture<ModalValidarContratistaComponent>;
  let mockDialogRef: jest.Mocked<MatDialogRef<ModalValidarContratistaComponent>>;
  let mockProveedoresService: { get: jest.Mock };
  let mockAlertService: { showErrorAlert: jest.Mock; showSuccessAlert: jest.Mock };

  beforeEach(() => {
    mockDialogRef = {
      close: jest.fn(),
    } as any;

    mockProveedoresService = {
      get: jest.fn(),
    };

    mockAlertService = {
      showErrorAlert: jest.fn(),
      showSuccessAlert: jest.fn(),
    };

    TestBed.configureTestingModule({
      declarations: [ModalValidarContratistaComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ProveedoresService, useValue: mockProveedoresService },
        { provide: AlertService, useValue: mockAlertService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalValidarContratistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.documentoBusqueda).toBe('');
    expect(component.datosContratista).toBeNull();
  });

  it('debe mostrar mensaje de error si el documento está vacío', () => {
    component.documentoBusqueda = '';
    component.consultarContratista();
    expect(component.errorMessage).toContain('ingrese un número de documento');
    expect(mockProveedoresService.get).not.toHaveBeenCalled();
  });

  it('debe cargar datos del contratista y ordenar contratos descendentemente', () => {
    const mockResponse = {
      Status: 200,
      Data: {
        proveedor: {
          nombre: 'CAROLINA MORALES',
          num_documento: '1014285934',
          correo: 'carolina@udistrital.edu.co',
          calificacion: 4.8,
        },
        contratos: [
          { numero_contrato: '10', vigencia: '2023', objeto: 'Servicios A', valor: 1000 },
          { numero_contrato: '25', vigencia: '2025', objeto: 'Servicios C', valor: 3000 },
          { numero_contrato: '5', vigencia: '2025', objeto: 'Servicios B', valor: 2000 }
        ]
      }
    };
    mockProveedoresService.get.mockReturnValue(of(mockResponse));

    component.documentoBusqueda = '1014285934';
    component.consultarContratista();

    expect(component.isLoading).toBe(false);
    expect(component.datosContratista).toEqual(mockResponse.Data);
    expect(component.contratosOrdenados.length).toBe(3);
    // Vigencia 2025 num 25 debe ser el primero
    expect(component.contratosOrdenados[0].numero_contrato).toBe('25');
    // Vigencia 2025 num 5 debe ser el segundo
    expect(component.contratosOrdenados[1].numero_contrato).toBe('5');
    // Vigencia 2023 num 10 debe ser el tercero
    expect(component.contratosOrdenados[2].numero_contrato).toBe('10');
    expect(component.tieneCalificacion).toBe(true);
    expect(component.valorCalificacion).toBe('4.8 / 5.0');
  });

  it('debe manejar fallback de "Sin calificación actual" si no tiene calificación', () => {
    const mockResponse = {
      Status: 200,
      Data: {
        proveedor: {
          nombre: 'PROVEEDOR SIN CALIFICACION',
          num_documento: '900123456'
        },
        contratos: []
      }
    };
    mockProveedoresService.get.mockReturnValue(of(mockResponse));

    component.documentoBusqueda = '900123456';
    component.consultarContratista();

    expect(component.tieneCalificacion).toBe(false);
    expect(component.valorCalificacion).toBe('Sin calificación actual');
  });

  it('debe manejar error al consultar proveedor', () => {
    mockProveedoresService.get.mockReturnValue(throwError(() => new Error('API Error')));

    component.documentoBusqueda = '999999';
    component.consultarContratista();

    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toContain('Error de conexión');
  });

  it('debe emitir accion de crear contrato al confirmar', () => {
    component.datosContratista = { proveedor: { nombre: 'TEST' } };
    component.crearContratoConContratista();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      accion: 'crearContrato',
      contratista: component.datosContratista,
      unidadEjecutora: null
    });
  });

  it('debe cerrar el diálogo retornando null al cancelar', () => {
    component.cerrar();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });
});
