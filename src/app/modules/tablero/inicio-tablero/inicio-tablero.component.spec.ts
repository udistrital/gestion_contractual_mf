import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { ParametrosService } from 'src/app/services/parametros.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { PlantillaTarjetaContenedoraComponent } from 'src/app/shared/templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component';
import { TableroDatosService } from '../../../services/tablero-datos.service';
import { contratoPrueba } from '../../../testing/contratos-prueba';
import { InicioTableroComponent } from './inicio-tablero.component';

describe('InicioTableroComponent', () => {
  let fixture: ComponentFixture<InicioTableroComponent>;
  let component: InicioTableroComponent;
  let datos: { cargarContratos: jest.Mock };
  let parametros: { get: jest.Mock };
  const anio = String(new Date().getFullYear());

  const contratos = [
    contratoPrueba({ id: 1, abogadoId: 500, dependenciaId: 10, dependencia: 'Ingeniería' }),
    contratoPrueba({ id: 2, abogadoId: 600, dependenciaId: 10, dependencia: 'Ingeniería', estado: 'suscrito' }),
    contratoPrueba({ id: 3, abogadoId: 600, dependenciaId: 20, dependencia: 'Rectoría', estado: 'legalizado' }),
    contratoPrueba({ id: 4, abogadoId: 500, dependenciaId: null, dependencia: 'Sin dependencia registrada' }),
  ];

  const crear = async (
    roles: string[],
    vigencias: any = of({ Status: '200', Data: [{ Id: 1, Nombre: '2024' }, { Id: 2, Nombre: '2025' }] })
  ) => {
    datos = { cargarContratos: jest.fn().mockReturnValue(of(contratos)) };
    parametros = { get: jest.fn().mockReturnValue(vigencias) };
    TestBed.configureTestingModule({
      declarations: [InicioTableroComponent, PlantillaTarjetaContenedoraComponent],
      providers: [
        { provide: TableroDatosService, useValue: datos },
        { provide: ParametrosService, useValue: parametros },
        { provide: UserService, useValue: { getPersonaId: () => Promise.resolve(500) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(InicioTableroComponent, {
      set: {
        providers: [
          { provide: RolService, useValue: { cargarRol: jest.fn().mockResolvedValue(undefined), getRol: () => roles } },
        ],
      },
    });
    fixture = TestBed.createComponent(InicioTableroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => localStorage.setItem('user', 'sesion'));
  afterEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  it('en el primer inicio de sesión espera a que el core guarde el usuario', async () => {
    localStorage.clear();
    jest.useFakeTimers();
    datos = { cargarContratos: jest.fn().mockReturnValue(of(contratos)) };
    TestBed.configureTestingModule({
      declarations: [InicioTableroComponent],
      providers: [
        { provide: TableroDatosService, useValue: datos },
        { provide: ParametrosService, useValue: { get: () => of(null) } },
        { provide: UserService, useValue: { getPersonaId: () => Promise.resolve(500) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(InicioTableroComponent, {
      set: {
        providers: [
          { provide: RolService, useValue: { cargarRol: () => Promise.resolve(), getRol: () => ['JEFE_CONTRATACION_RECTOR'] } },
        ],
      },
    });
    fixture = TestBed.createComponent(InicioTableroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    await jest.advanceTimersByTimeAsync(1000);
    expect(component.rol()).toBeUndefined();

    localStorage.setItem('user', 'sesion');
    await jest.advanceTimersByTimeAsync(500);
    expect(component.rol()).toBe('JEFE');
  });

  it('reintenta el persona_id hasta que el core lo guarde y deja sin rol si falla la carga', async () => {
    jest.useFakeTimers();
    const getPersonaId = jest.fn().mockRejectedValueOnce(new Error('No id found')).mockResolvedValue(500);
    TestBed.configureTestingModule({
      declarations: [InicioTableroComponent],
      providers: [
        { provide: TableroDatosService, useValue: { cargarContratos: jest.fn().mockReturnValue(of(contratos)) } },
        { provide: ParametrosService, useValue: { get: () => of({ Data: [{ Id: 1 }] }) } },
        { provide: UserService, useValue: { getPersonaId } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(InicioTableroComponent, {
      set: {
        providers: [{ provide: RolService, useValue: { cargarRol: () => Promise.reject(new Error('rol')), getRol: () => [] } }],
      },
    });
    fixture = TestBed.createComponent(InicioTableroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    await jest.advanceTimersByTimeAsync(0);
    expect(component.personaId()).toBeUndefined();
    await jest.advanceTimersByTimeAsync(500);
    expect(component.personaId()).toBe(500);
    expect(getPersonaId).toHaveBeenCalledTimes(2);
    expect(component.rol()).toBeNull();
    // Una vigencia sin nombre se descarta y se conservan las vigencias por defecto
    expect(component.vigencias()).toEqual([anio, String(+anio - 1), String(+anio - 2)]);
  });

  it('jefe: carga la vigencia actual por defecto con todos los contratos', async () => {
    await crear(['JEFE_CONTRATACION_RECTOR']);
    expect(component.rol()).toBe('JEFE');
    expect(component.vigencia()).toBe(anio);
    expect(datos.cargarContratos).toHaveBeenCalledWith(anio);
    expect(component.conteo().total).toBe(4);
    expect(component.gruposDependencias().map((g) => g.nombre)).toEqual([
      'Ingeniería',
      'Rectoría',
      'Sin dependencia registrada',
    ]);
  });

  it('abogado: solo sus contratos, y la carga se compara con toda la oficina', async () => {
    await crear(['ABOGADO_CONTRATACION_RECTOR']);
    expect(component.rol()).toBe('ABOGADO');
    expect(component.propios().map((c) => c.id)).toEqual([1, 4]);
    expect(component.todosFiltrados()).toHaveLength(4);
    expect(component.detalleTotal()).toBe(`Vigencia ${anio} · asignados a mí`);
  });

  it.each([['PROVEEDOR'], ['ADMIN_ARGO'], ['ORDENADOR_DEL_GASTO']])(
    'sin rol de jefe de contratación ni de abogado (%s) no consulta ni muestra nada',
    async (rol) => {
      await crear([rol]);
      expect(component.rol()).toBeNull();
      expect(datos.cargarContratos).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('plantilla-tarjeta-contenedora')).toBeNull();
      expect(fixture.nativeElement.textContent.trim()).toBe('');
    }
  );

  it('con rol de tablero muestra el contenedor del tablero', async () => {
    await crear(['ABOGADO_CONTRATACION_IDEXUD']);
    expect(fixture.nativeElement.querySelector('plantilla-tarjeta-contenedora')).not.toBeNull();
  });

  it('arma la lista de vigencias con el año actual primero', async () => {
    await crear(['JEFE_CONTRATACION_RECTOR']);
    expect(component.vigencias()[0]).toBe(anio);
    expect(component.vigencias()).toContain('2024');
  });

  it('conserva vigencias por defecto si parámetros falla', async () => {
    await crear(['JEFE_CONTRATACION_RECTOR'], throwError(() => new Error('parametros')));
    expect(component.vigencias()).toEqual([anio, String(+anio - 1), String(+anio - 2)]);
  });

  it('filtra resumen y carga por la dependencia elegida en el mapa de calor', async () => {
    await crear(['JEFE_CONTRATACION_RECTOR']);
    component.seleccionarDependencia('10');
    expect(component.conteo().total).toBe(2);
    expect(component.nombreDependencia()).toBe('Ingeniería');
    expect(component.detalleTotal()).toBe(`Vigencia ${anio} · Ingeniería`);
    component.seleccionarDependencia(null);
    expect(component.conteo().total).toBe(4);
  });

  it('al cambiar de vigencia recarga y quita el filtro de dependencia', async () => {
    await crear(['JEFE_CONTRATACION_RECTOR']);
    component.seleccionarDependencia('10');
    component.cambiarVigencia('2025');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(datos.cargarContratos).toHaveBeenLastCalledWith('2025');
    expect(component.dependenciaSeleccionada()).toBeNull();
  });

  it('muestra aviso si el CRUD o el MID fallan, sin presentar ceros ni datos parciales', async () => {
    await crear(['JEFE_CONTRATACION_RECTOR']);
    expect(fixture.nativeElement.querySelector('app-resumen-estados')).not.toBeNull();
    datos.cargarContratos.mockReturnValue(throwError(() => new Error('CRUD')));
    component.cambiarVigencia('2024');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.error()).toBe(true);
    const html: HTMLElement = fixture.nativeElement;
    expect(html.querySelector('.aviso')!.textContent).toContain('No fue posible cargar las estadísticas');
    expect(html.querySelector('app-resumen-estados')).toBeNull();
    expect(html.querySelector('app-mapa-calor-dependencias')).toBeNull();
    expect(html.querySelector('.subtitulo')!.textContent).not.toContain('contratos ·');
    expect(html.querySelector('.subtitulo')!.textContent).not.toMatch(/\d+ contratos/);
  });

  it('muestra la carga mientras consulta y no presenta datos hasta que termina', async () => {
    await crear(['JEFE_CONTRATACION_RECTOR']);
    const pendiente = new Subject<typeof contratos>();
    datos.cargarContratos.mockReturnValue(pendiente);
    component.cambiarVigencia('2024');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.cargandoTablero()).toBe(true);
    expect(fixture.nativeElement.querySelector('.cargando')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-resumen-estados')).toBeNull();

    pendiente.next([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cargando')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-mapa-calor-dependencias')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.subtitulo').textContent).toContain('0 contratos');
  });

  it('abogado: muestra la carga mientras llega su persona_id y un aviso si no llega', async () => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      declarations: [InicioTableroComponent, PlantillaTarjetaContenedoraComponent],
      providers: [
        { provide: TableroDatosService, useValue: { cargarContratos: jest.fn().mockReturnValue(of(contratos)) } },
        { provide: ParametrosService, useValue: { get: () => of(null) } },
        { provide: UserService, useValue: { getPersonaId: () => Promise.reject(new Error('No id found')) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(InicioTableroComponent, {
      set: {
        providers: [
          { provide: RolService, useValue: { cargarRol: () => Promise.resolve(), getRol: () => ['ABOGADO_CONTRATACION_RECTOR'] } },
        ],
      },
    });
    fixture = TestBed.createComponent(InicioTableroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await jest.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    expect(component.cargandoTablero()).toBe(true);
    expect(component.propios()).toEqual([]);

    await jest.advanceTimersByTimeAsync(60000);
    fixture.detectChanges();
    expect(component.cargandoTablero()).toBe(false);
    expect(component.sinPersona()).toBe(true);
    expect(fixture.nativeElement.querySelector('.aviso').textContent).toContain('No fue posible identificar tu usuario');
    expect(fixture.nativeElement.querySelector('app-resumen-estados')).toBeNull();
  });
});
