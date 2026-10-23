import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { RequestManager } from 'src/app/managers/requestManager';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { TercerosCrudService } from 'src/app/services/tercero-crud.service';
import { TableroDatosService } from './tablero-datos.service';

describe('TableroDatosService', () => {
  let service: TableroDatosService;
  let requestManager: { setPath: jest.Mock; get: jest.Mock };
  let midService: { getDependenciasBySede: jest.Mock };
  let tercerosService: { getTerceroPorId: jest.Mock };
  const hoy = new Date(2026, 9, 20, 10, 0);

  const contratoCrud = {
    id: 7,
    numero_contrato: null,
    consecutivo_elaboracion: '0042',
    vigencia: '2026',
    fecha_final: '2026-12-31T00:00:00.000Z',
    estados: [
      // Llegan desordenados: el servicio los ordena por fecha
      { estado_parametro_id: 6773, actual: true, usuario_id: 900, usuario_rol: 'JEFE_CONTRATACION_RECTOR', fecha_creacion: '2026-10-15T09:00:00' },
      { estado_parametro_id: 6773, actual: false, usuario_id: 500, usuario_rol: 'ABOGADO_CONTRATACION_RECTOR', fecha_creacion: '2026-10-12T09:00:00' },
    ],
    solicitante: { dependencia_solicitante_id: 31, sede_solicitante_id: 2 },
  };

  beforeEach(() => {
    requestManager = {
      setPath: jest.fn(),
      get: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: [contratoCrud] })),
    };
    midService = {
      getDependenciasBySede: jest.fn().mockReturnValue(of([{ id: 31, nombre: 'Facultad de Ingeniería' }])),
    };
    tercerosService = {
      getTerceroPorId: jest.fn().mockReturnValue(of({ Id: 500, NombreCompleto: 'Diana Rojas ' })),
    };
    TestBed.configureTestingModule({
      providers: [
        TableroDatosService,
        { provide: RequestManager, useValue: requestManager },
        { provide: ContratoGeneralMidService, useValue: midService },
        { provide: TercerosCrudService, useValue: tercerosService },
      ],
    });
    service = TestBed.inject(TableroDatosService);
  });

  it('consulta el CRUD con estados y solicitante filtrando por vigencia', async () => {
    await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(requestManager.setPath).toHaveBeenCalledWith('GESTION_CONTRACTUAL_CRUD_SERVICE');
    const url: string = requestManager.get.mock.calls[0][0];
    expect(url.startsWith('contratos-generales?include=estados,solicitante&fields=')).toBe(true);
    expect(url).toContain('limit=0');
    expect(decodeURIComponent(url)).toContain('{"activo":true,"vigencia":"2026"}');
  });

  it('sin vigencia trae todas las vigencias', async () => {
    await firstValueFrom(service.cargarContratos('', hoy));
    const url: string = requestManager.get.mock.calls[0][0];
    expect(decodeURIComponent(url)).toContain('query={"activo":true}&');
  });

  it('mapea estado, días en el estado, dependencia y abogado', async () => {
    const [c] = await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(c.id).toBe(7);
    expect(c.numero).toBe('0042');
    expect(c.estado).toBe('porSuscribir');
    // Entró a Por suscribir el 12/10 aunque el último cambio interno fue el 15/10
    expect(c.diasEnEstado).toBe(8);
    expect(c.fechaFinal).toEqual(new Date(2026, 11, 31));
    expect(c.dependencia).toBe('Facultad de Ingeniería');
    expect(c.abogadoId).toBe(500);
    expect(c.abogado).toBe('Diana Rojas');
    expect(midService.getDependenciasBySede).toHaveBeenCalledWith(2);
    expect(tercerosService.getTerceroPorId).toHaveBeenCalledWith(500);
  });

  it('acepta la relación de estados como objeto único', async () => {
    requestManager.get.mockReturnValue(
      of({ Data: [{ ...contratoCrud, estados: { ...contratoCrud.estados[1], actual: true, estado_parametro_id: 6776 } }] })
    );
    const [c] = await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(c.estado).toBe('legalizado');
    expect(c.diasEnEstado).toBe(8);
  });

  it('marca como sin identificar al abogado guardado con el usuario genérico', async () => {
    requestManager.get.mockReturnValue(
      of({ Data: [{ ...contratoCrud, estados: [{ ...contratoCrud.estados[1], usuario_id: 1, actual: true }] }] })
    );
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

  it('maneja contratos sin solicitante ni estados y respuestas vacías', async () => {
    requestManager.get.mockReturnValue(
      of({ Data: [{ id: 8, numero_contrato: 'CPS-1', vigencia: '2026', fecha_final: null, solicitante: null }] })
    );
    const [c] = await firstValueFrom(service.cargarContratos('2026', hoy));
    expect(c.estado).toBeNull();
    expect(c.dependencia).toBe('Sin dependencia registrada');
    expect(c.numero).toBe('CPS-1');

    requestManager.get.mockReturnValue(of({ Data: null }));
    expect(await firstValueFrom(service.cargarContratos('2026', hoy))).toEqual([]);
  });

  it('usa la fecha actual por defecto y valores de respaldo para número, rol y nombre', async () => {
    requestManager.get.mockReturnValue(
      of({
        Data: [
          {
            ...contratoCrud,
            id: 9,
            consecutivo_elaboracion: null,
            estados: [{ ...contratoCrud.estados[1], usuario_rol: null, actual: true }],
          },
          { ...contratoCrud, id: 10, estados: [{ ...contratoCrud.estados[1], usuario_id: 600, actual: true }] },
          { ...contratoCrud, id: 11, estados: [{ ...contratoCrud.estados[1], usuario_id: 700, actual: true }] },
        ],
      })
    );
    tercerosService.getTerceroPorId.mockImplementation((id: number) =>
      of(id === 600 ? { Data: { NombreCompleto: 'Andrés Pinzón' } } : {})
    );
    const [sinRol, conData, sinNombre] = await firstValueFrom(service.cargarContratos('2026'));
    expect(sinRol.numero).toBe('#9');
    expect(sinRol.abogadoId).toBeNull();
    expect(conData.abogado).toBe('Andrés Pinzón');
    expect(sinNombre.abogado).toBe('Abogado 700');
  });
});
