import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { TableroDatosService } from '../../../services/tablero-datos.service';
import { ContratoTablero } from '../../../types/tablero.models';
import { contratoPrueba } from '../testing/contratos-prueba';
import { PanelConsultaComponent } from './panel-consulta.component';

describe('PanelConsultaComponent', () => {
  let fixture: ComponentFixture<PanelConsultaComponent>;
  let component: PanelConsultaComponent;
  let datos: { cargarContratos: jest.Mock };

  const contratos = [
    contratoPrueba({ id: 1, abogadoId: 500, diasEnEstado: 7 }),
    contratoPrueba({ id: 2, abogadoId: 600, estado: 'suscrito' }),
    contratoPrueba({ id: 3, abogadoId: null, estado: 'declinado' }),
  ];

  const crear = async (personaId: Promise<number>) => {
    datos = { cargarContratos: jest.fn().mockReturnValue(of(contratos)) };
    TestBed.configureTestingModule({
      declarations: [PanelConsultaComponent],
      providers: [
        { provide: TableroDatosService, useValue: datos },
        { provide: UserService, useValue: { getPersonaId: () => personaId } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PanelConsultaComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rol', 'JEFE');
    fixture.componentRef.setInput('vigencia', '2026');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('jefe: resume todos los contratos de la vigencia', async () => {
    await crear(Promise.resolve(500));
    expect(datos.cargarContratos).toHaveBeenCalledWith('2026');
    expect(component.conteo().total).toBe(3);
    expect(component.alertas()).toHaveLength(1);
    expect(component.detalleTotal()).toBe('Vigencia 2026');
  });

  it('abogado: solo sus contratos', async () => {
    await crear(Promise.resolve(500));
    fixture.componentRef.setInput('rol', 'ABOGADO');
    fixture.detectChanges();
    expect(component.conteo().total).toBe(1);
    expect(component.detalleTotal()).toBe('Vigencia 2026 · asignados a mí');
  });

  it('abogado sin persona identificada no ve contratos ajenos', async () => {
    await crear(Promise.reject(new Error('sin id')));
    fixture.componentRef.setInput('rol', 'ABOGADO');
    fixture.detectChanges();
    expect(component.conteo().total).toBe(0);
  });

  it('recarga al cambiar la vigencia y muestra todas cuando está vacía', async () => {
    await crear(Promise.resolve(500));
    fixture.componentRef.setInput('vigencia', '');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(datos.cargarContratos).toHaveBeenLastCalledWith('');
    expect(component.detalleTotal()).toBe('Todas las vigencias');
  });

  it('marca carga y error sin romper la vista', async () => {
    await crear(Promise.resolve(500));
    const pendiente = new Subject<ContratoTablero[]>();
    datos.cargarContratos.mockReturnValue(pendiente);
    fixture.componentRef.setInput('vigencia', '2025');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.cargando()).toBe(true);
    pendiente.error(new Error('CRUD'));
    fixture.detectChanges();
    expect(component.error()).toBe(true);
    expect(component.cargando()).toBe(false);
    expect(component.conteo().total).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar el resumen');
  });

  it('reenvía la selección de estado de las tarjetas y alertas', async () => {
    await crear(Promise.resolve(500));
    const espia = jest.fn();
    component.seleccionarEstado.subscribe(espia);
    fixture.nativeElement
      .querySelector('app-resumen-estados')
      .dispatchEvent(new CustomEvent('seleccionar'));
    expect(espia).toHaveBeenCalled();
  });
});
