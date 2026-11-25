import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { RolService } from './rol.service';
import { UnidadesPermitidasService } from './unidades-permitidas.service';

const { RECTORIA, IDEXUD } = environment.UNIDADES_EJECUTORAS;

describe('UnidadesPermitidasService', () => {
  let roles: string[];
  let service: UnidadesPermitidasService;

  beforeEach(() => {
    roles = [];
    TestBed.configureTestingModule({
      providers: [{ provide: RolService, useValue: { getRol: () => roles } }],
    });
    service = TestBed.inject(UnidadesPermitidasService);
  });

  it.each([
    [['ABOGADO_CONTRATACION_RECTOR'], [RECTORIA]],
    [['ABOGADO_CONTRATACION_IDEXUD'], [IDEXUD]],
    [['ABOGADO_CONTRATACION_IDEXUD', 'ABOGADO_CONTRATACION_RECTOR'], [RECTORIA, IDEXUD]],
    [['JEFE_CONTRATACION_RECTOR'], [RECTORIA]],
    [['ABOGADO_CONTRATACION_RECTOR', 'JEFE_CONTRATACION_RECTOR'], [RECTORIA]],
    [['ADMIN_ARGO'], []],
    [['ORDENADOR_DEL_GASTO'], []],
    [[], []],
  ])('con los roles %j permite %j', async (rolesUsuario, esperado) => {
    roles = rolesUsuario;
    expect(await service.obtenerIds()).toEqual(esperado);
  });

  it('no permite unidades si no hay roles cargados', async () => {
    roles = undefined as unknown as string[];
    expect(await service.obtenerIds()).toEqual([]);
  });

  it('filtra el catálogo conservando su orden y descarta las unidades ajenas', async () => {
    roles = ['ABOGADO_CONTRATACION_IDEXUD', 'ABOGADO_CONTRATACION_RECTOR'];
    const catalogo = [{ Id: IDEXUD }, { Id: 7001 }, { Id: RECTORIA }];
    expect(await service.filtrar(catalogo, (u) => u.Id)).toEqual([{ Id: IDEXUD }, { Id: RECTORIA }]);
  });

  it('compara ids que llegan como texto desde Parámetros', async () => {
    roles = ['ABOGADO_CONTRATACION_RECTOR'];
    const catalogo = [{ Id: String(RECTORIA) }, { Id: String(IDEXUD) }];
    expect(await service.filtrar(catalogo, (u) => Number(u.Id))).toEqual([{ Id: String(RECTORIA) }]);
  });
});
