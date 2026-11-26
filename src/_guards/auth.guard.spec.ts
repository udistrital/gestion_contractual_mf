import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterOutlet, RouterStateSnapshot, Routes, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard } from './auth.guard';
import { AlertService } from 'src/app/services/alert.service';
import { CONTRATOS_ROUTES } from 'src/app/modules/contratos/contratos-routing.module';

@Component({
  selector: 'test-parent',
  standalone: true,
  imports: [RouterOutlet],
  template: '<div>Parent</div><router-outlet></router-outlet>',
})
class DummyParentComponent {}

@Component({
  selector: 'test-detalle',
  standalone: true,
  template: '<div>Detalle</div>',
})
class DummyDetalleComponent {}

@Component({
  selector: 'test-editar',
  standalone: true,
  template: '<div>Editar</div>',
})
class DummyEditarComponent {}

@Component({
  selector: 'test-vista',
  standalone: true,
  template: '<div>Vista</div>',
})
class DummyVistaComponent {}

/** Rutas reales de contratos con componentes sustitutos, cargadas en diferido como en la app. */
const contratosConDummy = (): Routes =>
  CONTRATOS_ROUTES.map((ruta) => (ruta.component ? { ...ruta, component: DummyVistaComponent } : ruta));

const rutasApp: Routes = [
  { path: 'gestion-contractual/contratos', canActivate: [authGuard], loadChildren: () => Promise.resolve(contratosConDummy()) },
  { path: 'contratos', canActivate: [authGuard], loadChildren: () => Promise.resolve(contratosConDummy()) },
];

const testRoutes: Routes = [
  {
    path: 'gestion-contractual/contratos',
    component: DummyParentComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'detalle/:contratoId',
        component: DummyDetalleComponent,
        canActivate: [authGuard],
      },
      {
        path: 'editar/:contratoId',
        component: DummyEditarComponent,
        canActivate: [authGuard],
      },
    ],
  },
];

describe('authGuard', () => {
  let mockAlertService: jest.Mocked<Partial<AlertService>>;

  const executeGuard: CanActivateFn = (route, state) =>
    TestBed.runInInjectionContext(() => authGuard(route, state));

  beforeEach(() => {
    mockAlertService = {
      showErrorAlert: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [DummyParentComponent, DummyDetalleComponent, DummyEditarComponent],
      providers: [
        provideRouter(testRoutes),
        { provide: AlertService, useValue: mockAlertService },
      ],
    });

    localStorage.clear();
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('deniega el acceso y muestra alerta cuando no hay menú en localStorage', () => {
    const route = { params: {} } as ActivatedRouteSnapshot;
    const state = { url: '/gestion-contractual/contratos/detalle/123' } as RouterStateSnapshot;

    const result = executeGuard(route, state);

    expect(result).toBe(false);
    expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(
      'No tiene permisos para realizar esta acción',
      'Acceso prohibido'
    );
  });

  it('permite acceso a /gestion-contractual/contratos/detalle/42 cuando el menú tiene la ruta base con prefijo', () => {
    const menuMock = [
      {
        Nombre: 'Detalle de Contratos',
        Url: '/gestion-contractual/contratos/detalle',
      },
    ];
    localStorage.setItem('menu', btoa(JSON.stringify(menuMock)));

    const route = { params: { contratoId: '42' } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/gestion-contractual/contratos/detalle/42' } as RouterStateSnapshot;

    const result = executeGuard(route, state);

    expect(result).toBe(true);
    expect(mockAlertService.showErrorAlert).not.toHaveBeenCalled();
  });

  it('permite acceso a /gestion-contractual/contratos/detalle/42 cuando el menú tiene la ruta sin prefijo /contratos/detalle', () => {
    const menuMock = [
      {
        Nombre: 'Detalle',
        Url: '/contratos/detalle',
      },
    ];
    localStorage.setItem('menu', btoa(JSON.stringify(menuMock)));

    const route = { params: { contratoId: '42' } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/gestion-contractual/contratos/detalle/42' } as RouterStateSnapshot;

    const result = executeGuard(route, state);

    expect(result).toBe(true);
    expect(mockAlertService.showErrorAlert).not.toHaveBeenCalled();
  });

  it('permite acceso a opciones anidadas en el menú', () => {
    const menuMock = [
      {
        Nombre: 'Módulo Contratación',
        Opciones: [
          {
            Nombre: 'Consultar Contratos',
            Url: '/gestion-contractual/contratos/consultar',
          },
        ],
      },
    ];
    localStorage.setItem('menu', btoa(JSON.stringify(menuMock)));

    const route = { params: {} } as ActivatedRouteSnapshot;
    const state = { url: '/gestion-contractual/contratos/consultar' } as RouterStateSnapshot;

    const result = executeGuard(route, state);

    expect(result).toBe(true);
    expect(mockAlertService.showErrorAlert).not.toHaveBeenCalled();
  });

  it('deniega acceso si la ruta no existe en el menú', () => {
    const menuMock = [
      {
        Nombre: 'Solo Tablero',
        Url: '/gestion-contractual/tablero',
      },
    ];
    localStorage.setItem('menu', btoa(JSON.stringify(menuMock)));

    const route = { params: {} } as ActivatedRouteSnapshot;
    const state = { url: '/gestion-contractual/contratos/detalle/99' } as RouterStateSnapshot;

    const result = executeGuard(route, state);

    expect(result).toBe(false);
    expect(mockAlertService.showErrorAlert).toHaveBeenCalled();
  });

  it('permite acceso a detalle/:id cuando el guard corre en la ruta padre (route.params vacío) y los params están en el árbol (state.root)', () => {
    const menuMock = [
      {
        Nombre: 'Detalle de Contratos',
        Url: '/gestion-contractual/contratos/detalle',
      },
    ];
    localStorage.setItem('menu', btoa(JSON.stringify(menuMock)));

    const childSnapshot = {
      params: { contratoId: '42' },
      firstChild: null,
    } as unknown as ActivatedRouteSnapshot;

    const parentSnapshot = {
      params: {},
      firstChild: childSnapshot,
    } as unknown as ActivatedRouteSnapshot;

    const rootSnapshot = {
      params: {},
      firstChild: parentSnapshot,
    } as unknown as ActivatedRouteSnapshot;

    const state = {
      url: '/gestion-contractual/contratos/detalle/42',
      root: rootSnapshot,
    } as unknown as RouterStateSnapshot;

    const result = executeGuard(parentSnapshot, state);

    expect(result).toBe(true);
    expect(mockAlertService.showErrorAlert).not.toHaveBeenCalled();
  });

  describe('con RouterTestingHarness', () => {
    it('permite navegar a /gestion-contractual/contratos/detalle/42 cuando el menú tiene la opción base', async () => {
      const menuMock = [
        {
          Nombre: 'Detalle de Contratos',
          Url: '/gestion-contractual/contratos/detalle',
        },
      ];
      localStorage.setItem('menu', btoa(JSON.stringify(menuMock)));

      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/gestion-contractual/contratos/detalle/42');

      expect(harness.routeNativeElement?.textContent).toContain('Detalle');
      expect(mockAlertService.showErrorAlert).not.toHaveBeenCalled();
    });

    it('permite navegar a /gestion-contractual/contratos/detalle/42 cuando el menú tiene la opción sin prefijo /contratos/detalle', async () => {
      const menuMock = [
        {
          Nombre: 'Detalle',
          Url: '/contratos/detalle',
        },
      ];
      localStorage.setItem('menu', btoa(JSON.stringify(menuMock)));

      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/gestion-contractual/contratos/detalle/42');

      expect(harness.routeNativeElement?.textContent).toContain('Detalle');
      expect(mockAlertService.showErrorAlert).not.toHaveBeenCalled();
    });

    it('rechaza navegación a subruta no listada /gestion-contractual/contratos/editar/5 cuando el menú solo tiene /gestion-contractual/contratos', async () => {
      const menuMock = [
        {
          Nombre: 'Contratos',
          Url: '/gestion-contractual/contratos',
        },
      ];
      localStorage.setItem('menu', btoa(JSON.stringify(menuMock)));

      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/gestion-contractual/contratos/editar/5');

      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(
        'No tiene permisos para realizar esta acción',
        'Acceso prohibido'
      );
    });
  });

  describe('rutas de contratos autorizadas por consultar', () => {
    const CONSULTAR = '/gestion-contractual/contratos/consultar';
    const REGISTRAR = '/gestion-contractual/contratos/registrar';

    let harness: RouterTestingHarness | undefined;

    beforeEach(() => {
      harness = undefined;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DummyVistaComponent],
        providers: [provideRouter(rutasApp), { provide: AlertService, useValue: mockAlertService }],
      });
      localStorage.clear();
    });

    /**
     * Navega con el menú dado y devuelve si el router quedó en la URL pedida. Un solo harness por
     * prueba: cada llamada usa una URL distinta para que la navegación no se ignore por repetida.
     */
    async function navegar(menu: string[], url: string): Promise<boolean> {
      localStorage.setItem('menu', btoa(JSON.stringify(menu.map((Url) => ({ Url })))));
      harness ??= await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      return TestBed.inject(Router).url === url;
    }

    it('(a) con consultar en el menú, detalle/42 entra', async () => {
      expect(await navegar([CONSULTAR], '/gestion-contractual/contratos/detalle/42')).toBe(true);
      expect(mockAlertService.showErrorAlert).not.toHaveBeenCalled();
    });

    it('(b) sin consultar (solo registrar), detalle/42 se rechaza', async () => {
      expect(await navegar([REGISTRAR], '/gestion-contractual/contratos/detalle/42')).toBe(false);
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(
        'No tiene permisos para realizar esta acción',
        'Acceso prohibido'
      );
    });

    it('(c) editar/5 entra con la vista de la que depende y se rechaza sin ella', async () => {
      expect(await navegar([CONSULTAR], '/gestion-contractual/contratos/editar/5')).toBe(true);
      expect(await navegar([REGISTRAR], '/gestion-contractual/contratos/editar/6')).toBe(false);
    });

    it('documentos/7 entra con consultar y se rechaza solo con registrar', async () => {
      expect(await navegar([CONSULTAR], '/gestion-contractual/contratos/documentos/7')).toBe(true);
      expect(await navegar([REGISTRAR], '/gestion-contractual/contratos/documentos/8')).toBe(false);
    });

    it('(d) registrar se autoriza desde consultar; consultar requiere su propia entrada', async () => {
      expect(await navegar([CONSULTAR], REGISTRAR)).toBe(true);
      expect(await navegar([CONSULTAR], CONSULTAR)).toBe(true);
    });

    it('la URL interna registrada en el menú no basta sin su vista principal', async () => {
      expect(await navegar(['/gestion-contractual/contratos/detalle'], '/gestion-contractual/contratos/detalle/42')).toBe(false);
    });

    it('(e) con y sin el prefijo /gestion-contractual en el menú y en la URL', async () => {
      expect(await navegar(['/contratos/consultar'], '/gestion-contractual/contratos/detalle/42')).toBe(true);
      expect(await navegar([CONSULTAR], '/contratos/detalle/44')).toBe(true);
      expect(await navegar(['/contratos/consultar'], '/contratos/editar/5')).toBe(true);
      expect(await navegar(['/contratos/registrar'], '/contratos/detalle/45')).toBe(false);
    });
  });
});
