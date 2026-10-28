import { TestBed } from '@angular/core/testing';
import { ImplicitAutenticationService } from './implicit_autentication.service';
import { RolService } from './rol.service';

describe('RolService', () => {
  let service: RolService;
  const autenticacion = { getRole: jest.fn() };

  const estaResuelta = async (promesa: Promise<void>): Promise<boolean> => {
    let resuelta = false;
    void promesa.then(() => (resuelta = true));
    await Promise.resolve();
    await Promise.resolve();
    return resuelta;
  };

  beforeEach(() => {
    autenticacion.getRole.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: ImplicitAutenticationService, useValue: autenticacion }],
    });
    service = TestBed.inject(RolService);
  });

  it('debería dejar solo los roles válidos de Argo', async () => {
    autenticacion.getRole.mockResolvedValue(['Internal/everyone', 'ORDENADOR_DEL_GASTO']);

    await service.cargarRol();

    expect(service.getRol()).toEqual(['ORDENADOR_DEL_GASTO']);
  });

  it('debería resolver rolCargado solo cuando termina cargarRol', async () => {
    let resolverRoles!: (roles: string[]) => void;
    autenticacion.getRole.mockReturnValue(
      new Promise<string[]>((resolve) => (resolverRoles = resolve)),
    );
    const cargado = service.rolCargado();

    const carga = service.cargarRol();
    expect(await estaResuelta(cargado)).toBe(false);

    resolverRoles(['ADMIN_ARGO']);
    await carga;

    await expect(cargado).resolves.toBeUndefined();
    expect(service.getRol()).toEqual(['ADMIN_ARGO']);
  });

  it('debería resolver rolCargado aunque falle la carga de roles', async () => {
    autenticacion.getRole.mockRejectedValue(new Error('sin sesión'));

    await expect(service.cargarRol()).rejects.toThrow('sin sesión');

    await expect(service.rolCargado()).resolves.toBeUndefined();
    expect(service.getRol()).toEqual([]);
  });
});
