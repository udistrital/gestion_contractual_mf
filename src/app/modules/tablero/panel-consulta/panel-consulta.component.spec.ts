import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject, of } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { TableroDatosService } from '../../../services/tablero-datos.service';
import { ContratoTablero } from '../../../types/tablero.models';
import { contratoPrueba } from '../../../testing/contratos-prueba';
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

  const configurar = (getPersonaId: () => Promise<number>, carga: any = of(contratos)) => {
    datos = { cargarContratos: jest.fn().mockReturnValue(carga) };
    TestBed.configureTestingModule({
      declarations: [PanelConsultaComponent],
      providers: [
        { provide: TableroDatosService, useValue: datos },
        { provide: UserService, useValue: { getPersonaId } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PanelConsultaComponent);
    component = fixture.componentInstance;
  };

  const crear = async (personaId: Promise<number>, rol: 'JEFE' | 'ABOGADO' = 'JEFE') => {
    configurar(() => personaId);
    fixture.componentRef.setInput('rol', rol);
    fixture.componentRef.setInput('vigencia', '2026');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  afterEach(() => jest.useRealTimers());

  it('jefe: resume todos los contratos de la vigencia', async () => {
    await crear(Promise.resolve(500));
    expect(datos.cargarContratos).toHaveBeenCalledWith('2026');
    expect(component.conteo().total).toBe(3);
    expect(component.alertas()).toHaveLength(1);
    expect(component.detalleTotal()).toBe('Vigencia 2026');
    expect(fixture.nativeElement.querySelector('app-resumen-estados')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-alertas-gestion')).not.toBeNull();
  });

  it('abogado: solo sus contratos', async () => {
    await crear(Promise.resolve(500), 'ABOGADO');
    expect(component.personaId()).toBe(500);
    expect(component.conteo().total).toBe(1);
    expect(component.detalleTotal()).toBe('Vigencia 2026 · asignados a mí');
  });

  it('recarga al cambiar la vigencia y muestra todas cuando está vacía', async () => {
    await crear(Promise.resolve(500));
    fixture.componentRef.setInput('vigencia', '');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(datos.cargarContratos).toHaveBeenLastCalledWith('');
    expect(component.detalleTotal()).toBe('Todas las vigencias');
  });

  it('muestra la carga antes de la primera respuesta, sin tarjetas en cero', async () => {
    const pendiente = new Subject<ContratoTablero[]>();
    configurar(() => Promise.resolve(500), pendiente);
    fixture.componentRef.setInput('rol', 'JEFE');
    fixture.componentRef.setInput('vigencia', '2026');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.cargandoPanel()).toBe(true);
    expect(fixture.nativeElement.querySelector('.cargando')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-resumen-estados')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-alertas-gestion')).toBeNull();

    pendiente.next(contratos);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cargando')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-resumen-estados')).not.toBeNull();
  });

  it('una vigencia sin contratos muestra el resumen vacío, no un error', async () => {
    configurar(() => Promise.resolve(500), of([]));
    fixture.componentRef.setInput('rol', 'JEFE');
    fixture.componentRef.setInput('vigencia', '2026');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.error()).toBe(false);
    expect(component.conteo().total).toBe(0);
    expect(fixture.nativeElement.querySelector('.aviso')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-resumen-estados')).not.toBeNull();
  });

  it('marca carga y error sin mostrar ceros como válidos', async () => {
    await crear(Promise.resolve(500));
    const pendiente = new Subject<ContratoTablero[]>();
    datos.cargarContratos.mockReturnValue(pendiente);
    fixture.componentRef.setInput('vigencia', '2025');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.cargando()).toBe(true);
    pendiente.error(new Error('MID'));
    fixture.detectChanges();
    expect(component.error()).toBe(true);
    expect(component.cargando()).toBe(false);
    const html: HTMLElement = fixture.nativeElement;
    expect(html.querySelector('.aviso')!.textContent).toContain('No fue posible cargar el resumen');
    expect(html.querySelector('app-resumen-estados')).toBeNull();
    expect(html.querySelector('app-alertas-gestion')).toBeNull();
  });

  it('abogado: muestra la carga mientras llega su persona_id y un aviso si no llega', async () => {
    jest.useFakeTimers();
    configurar(() => Promise.reject(new Error('No id found')));
    fixture.componentRef.setInput('rol', 'ABOGADO');
    fixture.componentRef.setInput('vigencia', '2026');
    fixture.detectChanges();
    await jest.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    expect(component.personaId()).toBeUndefined();
    expect(component.cargandoPanel()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-resumen-estados')).toBeNull();

    await jest.advanceTimersByTimeAsync(60000);
    fixture.detectChanges();
    expect(component.cargandoPanel()).toBe(false);
    expect(component.sinPersona()).toBe(true);
    // No ve contratos ajenos
    expect(component.conteo().total).toBe(0);
    expect(fixture.nativeElement.querySelector('.aviso').textContent).toContain('No fue posible identificar su usuario');
    expect(fixture.nativeElement.querySelector('app-resumen-estados')).toBeNull();
  });

  it('reintenta el persona_id hasta que el core lo guarde', async () => {
    jest.useFakeTimers();
    const getPersonaId = jest.fn().mockRejectedValueOnce(new Error('No id found')).mockResolvedValue(500);
    configurar(getPersonaId);
    fixture.componentRef.setInput('rol', 'ABOGADO');
    fixture.componentRef.setInput('vigencia', '2026');
    fixture.detectChanges();
    await jest.advanceTimersByTimeAsync(0);
    expect(component.personaId()).toBeUndefined();
    await jest.advanceTimersByTimeAsync(500);
    fixture.detectChanges();
    expect(component.personaId()).toBe(500);
    expect(getPersonaId).toHaveBeenCalledTimes(2);
    expect(component.cargandoPanel()).toBe(false);
    expect(component.conteo().total).toBe(1);
  });

  it('el jefe no espera el persona_id', async () => {
    jest.useFakeTimers();
    configurar(() => Promise.reject(new Error('No id found')));
    fixture.componentRef.setInput('rol', 'JEFE');
    fixture.componentRef.setInput('vigencia', '2026');
    fixture.detectChanges();
    await jest.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(component.cargandoPanel()).toBe(false);
    expect(component.sinPersona()).toBe(false);
    expect(component.conteo().total).toBe(3);
  });

  it('reenvía la selección de estado de las tarjetas y alertas', async () => {
    await crear(Promise.resolve(500));
    const espia = jest.fn();
    component.seleccionarEstado.subscribe(espia);
    const html: HTMLElement = fixture.nativeElement;
    html.querySelector('app-resumen-estados')!.dispatchEvent(new CustomEvent('seleccionar'));
    html.querySelector('app-alertas-gestion')!.dispatchEvent(new CustomEvent('seleccionarEstado'));
    expect(espia).toHaveBeenCalledTimes(2);
  });
});
