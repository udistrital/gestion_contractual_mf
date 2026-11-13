import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AlertService } from 'src/app/services/alert.service';

describe('authGuard', () => {
  let mockAlertService: jest.Mocked<Partial<AlertService>>;

  const executeGuard: CanActivateFn = (route, state) =>
    TestBed.runInInjectionContext(() => authGuard(route, state));

  beforeEach(() => {
    mockAlertService = {
      showErrorAlert: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
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
});
