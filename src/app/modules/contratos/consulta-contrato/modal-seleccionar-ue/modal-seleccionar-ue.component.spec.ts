import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ParametrosService } from 'src/app/services/parametros.service';
import { RolService } from 'src/app/services/rol.service';
import { environment } from 'src/environments/environment';
import { ModalSeleccionarUeComponent } from './modal-seleccionar-ue.component';

describe('ModalSeleccionarUeComponent', () => {
  let component: ModalSeleccionarUeComponent;
  let fixture: ComponentFixture<ModalSeleccionarUeComponent>;
  let mockDialogRef: jest.Mocked<MatDialogRef<ModalSeleccionarUeComponent>>;
  let mockParametrosService: { getParametrosPorTipo: jest.Mock };
  let roles: string[];

  beforeEach(() => {
    // Abogado de las dos unidades: el modal ofrece ambas.
    roles = ['ABOGADO_CONTRATACION_RECTOR', 'ABOGADO_CONTRATACION_IDEXUD'];

    mockDialogRef = {
      close: jest.fn(),
    } as any;

    mockParametrosService = {
      getParametrosPorTipo: jest.fn().mockResolvedValue({
        [environment.UNIDAD_EJECUTORA_ID]: [
          { Id: environment.UNIDADES_EJECUTORAS.RECTORIA, Nombre: 'Rectoría' },
          { Id: environment.UNIDADES_EJECUTORAS.IDEXUD, Nombre: 'IDEXUD' },
        ],
      }),
    };

    TestBed.configureTestingModule({
      declarations: [ModalSeleccionarUeComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ParametrosService, useValue: mockParametrosService },
        { provide: RolService, useValue: { getRol: () => roles } },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalSeleccionarUeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente con los IDs y nombres de parámetros CRUD (6818, 6819)', async () => {
    await fixture.whenStable();
    expect(component).toBeTruthy();
    expect(component.selectedUe?.id).toBe(environment.UNIDADES_EJECUTORAS.RECTORIA);
    expect(component.unidades[0].id).toBe(6818);
    expect(component.unidades[0].nombre).toBe('Rectoría');
    expect(component.unidades[1].id).toBe(6819);
    expect(component.unidades[1].nombre).toBe('IDEXUD');
  });

  it('no ofrece unidades de Parámetros que el usuario no tiene permitidas', async () => {
    mockParametrosService.getParametrosPorTipo.mockResolvedValueOnce({
      [environment.UNIDAD_EJECUTORA_ID]: [
        { Id: 6818, Nombre: 'Rectoría' },
        { Id: 6819, Nombre: 'IDEXUD' },
        { Id: 7001, Nombre: 'Nueva Unidad Ejecutora', Descripcion: 'Descripción personalizada' },
      ],
    });

    await component.ngOnInit();

    expect(component.unidades.map((u) => u.id)).toEqual([6818, 6819]);
  });

  it.each([
    ['ABOGADO_CONTRATACION_RECTOR', 6818],
    ['ABOGADO_CONTRATACION_IDEXUD', 6819],
  ])('con el rol %s solo ofrece y selecciona la unidad %d', async (rol, unidad) => {
    roles = [rol];
    await component.ngOnInit();

    expect(component.unidades.map((u) => u.id)).toEqual([unidad]);
    expect(component.selectedUe?.id).toBe(unidad);
    expect(component.sinUnidadPermitida).toBe(false);
  });

  it('sin unidad permitida no ofrece el catálogo, avisa y no deja continuar', async () => {
    roles = ['ADMIN_ARGO'];
    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.unidades).toEqual([]);
    expect(component.selectedUe).toBeNull();
    expect(component.sinUnidadPermitida).toBe(true);
    const html: HTMLElement = fixture.nativeElement;
    expect(html.querySelector('.aviso-sin-unidad')?.textContent).toContain(
      'no tiene una unidad ejecutora autorizada'
    );
    expect(html.querySelector<HTMLButtonElement>('.btn-continuar')?.disabled).toBe(true);

    component.confirmar();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('si Parámetros falla usa el catálogo de respaldo, filtrado por las unidades permitidas', async () => {
    roles = ['ABOGADO_CONTRATACION_IDEXUD'];
    mockParametrosService.getParametrosPorTipo.mockRejectedValueOnce(new Error('caído'));
    await component.ngOnInit();

    expect(component.unidades.map((u) => u.id)).toEqual([6819]);
  });

  it('debe permitir seleccionar otra unidad ejecutora', async () => {
    await fixture.whenStable();
    const ue2 = component.unidades[1];
    component.seleccionar(ue2);
    expect(component.selectedUe?.id).toBe(environment.UNIDADES_EJECUTORAS.IDEXUD);
  });

  it('debe cerrar el diálogo retornando la unidad ejecutora al confirmar', async () => {
    await fixture.whenStable();
    component.confirmar();
    expect(mockDialogRef.close).toHaveBeenCalledWith(component.selectedUe);
  });

  it('debe cerrar el diálogo retornando null al cancelar', () => {
    component.cancelar();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });
});
