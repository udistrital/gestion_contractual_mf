import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { RequestManager } from 'src/app/managers/requestManager';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { TercerosCrudService } from 'src/app/services/tercero-crud.service';
import { environment } from 'src/environments/environment';
import { TableroDatosService } from './tablero-datos.service';

describe('TableroDatosService', () => {
  let service: TableroDatosService;
  let requestManager: { setPath: jest.Mock; get: jest.Mock };
  let parametrosService: { get: jest.Mock };
  let midService: { getDependenciasBySede: jest.Mock };
  let tercerosService: { getTerceroPorId: jest.Mock };
  const hoy = new Date(2026, 9, 20, 10, 0);

  // Fila de GET v1/tableros/contratos (CRUD Beego v2): el CRUD ya calcula el
  // estado actual, desde cuándo está en él y el abogado.
  const contratoCrud = {
    contrato_general_id: 7,
    numero_contrato: null,
    consecutivo_elaboracion: '0042',
    vigencia_id: 6900,
    fecha_final: '2026-12-31T00:00:00Z',
    dependencia_solicitante_id: 31,
    sede_solicitante_id: 2,
    estado_parametro_id: 6773,
    fecha_estado: '2026-10-12T09:00:00Z',
    abogado_id: 500,
  };

  beforeEach(() => {
    requestManager = {
      setPath: jest.fn(),
      get: jest.fn().mockReturnValue(of({ Success: true, Status: '200', Data: [contratoCrud] })),
    };
    parametrosService = {
      get: jest.fn().mockReturnValue(of({ Status: '200', Data: [{ Id: 6900 }] })),
    };
    midService = {
      getDependenciasBySede: jest.fn().mockReturnValue(of([{ id: 31, nombre: 'Facultad de Ingeniería' }])),
    };
    tercerosService = {
      getTerceroPorId: jest.fn().mockReturnValue(of({ Id: 500, NombreCompleto: 'Abogado B de Prueba ' })),
    };
    TestBed.configureTestingModule({
      providers: [
        TableroDatosService,
        { provide: RequestManager, useValue: requestManager },
        { provide: ParametrosService, useValue: parametrosService },
        { provide: ContratoGeneralMidService, useValue: midService },
        { provide: TercerosCrudService, useValue: tercerosService },
      ],
    });
    service = TestBed.inject(TableroDatosService);
  });

  it('busca el Id del parámetro de vigencia y consulta el CRUD con vigencia-id', async () => {
    await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(parametrosService.get).toHaveBeenCalledWith(
      `parametro?query=TipoParametroId:${environment.VIGENCIA_ID},Nombre:2026&fields=Id&limit=1`
    );
    expect(requestManager.setPath).toHaveBeenCalledWith('GESTION_CONTRACTUAL_CRUD_SERVICE');
    expect(requestManager.get).toHaveBeenCalledWith('v1/tableros/contratos?vigencia-id=6900');
  });

  it('guarda el Id de cada vigencia para no volver a consultarlo', async () => {
    await firstValueFrom(service.cargarContratos('2026', hoy));
    await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(parametrosService.get).toHaveBeenCalledTimes(1);
    expect(requestManager.get).toHaveBeenCalledTimes(2);
  });

  it('sin vigencia trae todas las vigencias', async () => {
    await firstValueFrom(service.cargarContratos('', hoy));
    expect(parametrosService.get).not.toHaveBeenCalled();
    expect(requestManager.get).toHaveBeenCalledWith('v1/tableros/contratos');
  });

  it('un año sin parámetro de vigencia no consulta el CRUD', async () => {
    parametrosService.get.mockReturnValue(of({ Status: '200', Data: [{}] }));
    expect(await firstValueFrom(service.cargarContratos('2019', hoy))).toEqual([]);
    expect(await firstValueFrom(service.cargarContratos('20x6', hoy))).toEqual([]);
    expect(requestManager.get).not.toHaveBeenCalled();
  });

  it('propaga el error si Parámetros falla', async () => {
    parametrosService.get.mockReturnValue(throwError(() => new Error('parametros')));
    await expect(firstValueFrom(service.cargarContratos('2026', hoy))).rejects.toThrow('parametros');
  });

  it('mapea estado, días en el estado, dependencia y abogado', async () => {
    const [c] = await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(c.id).toBe(7);
    expect(c.numero).toBe('0042');
    expect(c.vigencia).toBe('2026');
    expect(c.estado).toBe('porSuscribir');
    // Entró a Por suscribir el 12/10 (hora de Bogotá guardada sin zona)
    expect(c.diasEnEstado).toBe(8);
    expect(c.fechaFinal).toEqual(new Date(2026, 11, 31));
    expect(c.dependenciaId).toBe(31);
    expect(c.dependencia).toBe('Facultad de Ingeniería');
    expect(c.abogadoId).toBe(500);
    expect(c.abogado).toBe('Abogado B de Prueba');
    expect(midService.getDependenciasBySede).toHaveBeenCalledWith(2);
    expect(tercerosService.getTerceroPorId).toHaveBeenCalledWith(500);
  });

  it('marca como sin identificar al abogado guardado con el usuario genérico', async () => {
    requestManager.get.mockReturnValue(of({ Data: [{ ...contratoCrud, abogado_id: 1 }] }));
    const [c] = await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(c.abogadoId).toBeNull();
    expect(c.abogado).toBe('Sin identificar');
    expect(tercerosService.getTerceroPorId).not.toHaveBeenCalled();
  });

  it('usa nombres de respaldo si MID o terceros fallan', async () => {
    midService.getDependenciasBySede.mockReturnValue(throwError(() => new Error('MID')));
    tercerosService.getTerceroPorId.mockReturnValue(throwError(() => new Error('Terceros')));
    const [c] = await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(c.dependencia).toBe('Dependencia 31');
    expect(c.abogado).toBe('Abogado 500');
  });

  it('maneja contratos sin dependencia ni estados y respuestas vacías', async () => {
    requestManager.get.mockReturnValue(
      of({
        Data: [
          {
            ...contratoCrud,
            contrato_general_id: 8,
            numero_contrato: 'CPS-1',
            fecha_final: null,
            dependencia_solicitante_id: null,
            sede_solicitante_id: null,
            estado_parametro_id: null,
            fecha_estado: null,
            abogado_id: null,
          },
        ],
      })
    );
    const [c] = await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(c.estado).toBeNull();
    expect(c.diasEnEstado).toBe(0);
    expect(c.fechaFinal).toBeNull();
    expect(c.dependencia).toBe('Sin dependencia registrada');
    expect(c.abogado).toBe('Sin identificar');
    expect(c.numero).toBe('CPS-1');
    expect(midService.getDependenciasBySede).not.toHaveBeenCalled();

    requestManager.get.mockReturnValue(of({ Data: null }));
    expect(await firstValueFrom(service.cargarContratos('2026', hoy))).toEqual([]);
  });

  it('usa la fecha actual por defecto y valores de respaldo para número y nombre', async () => {
    requestManager.get.mockReturnValue(
      of({
        Data: [
          { ...contratoCrud, contrato_general_id: 9, consecutivo_elaboracion: null, abogado_id: null },
          { ...contratoCrud, contrato_general_id: 10, abogado_id: 600 },
          { ...contratoCrud, contrato_general_id: 11, abogado_id: 700 },
        ],
      })
    );
    tercerosService.getTerceroPorId.mockImplementation((id: number) =>
      of(id === 600 ? { Data: { NombreCompleto: 'Abogado A de Prueba' } } : {})
    );
    const [sinRol, conData, sinNombre] = await firstValueFrom(service.cargarContratos('2026'));
    expect(sinRol.numero).toBe('#9');
    expect(sinRol.abogadoId).toBeNull();
    expect(conData.abogado).toBe('Abogado A de Prueba');
    expect(sinNombre.abogado).toBe('Abogado 700');
  });
});
