import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RequestManager } from '../managers/requestManager';
import { ApiResponse, ParametroResponse } from '../types/types';
import { ParametrosService } from './parametros.service';

describe('ParametrosService', () => {
  let service: ParametrosService;
  let requestManager: {
    setPath: jest.Mock;
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    requestManager = {
      setPath: jest.fn(),
      get: jest.fn().mockReturnValue(of({})),
      post: jest.fn().mockReturnValue(of({})),
      put: jest.fn().mockReturnValue(of({})),
      delete: jest.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      providers: [
        ParametrosService,
        { provide: RequestManager, useValue: requestManager },
      ],
    });
    service = TestBed.inject(ParametrosService);
  });

  it('configura el servicio de parámetros al inicializarse', () => {
    expect(requestManager.setPath).toHaveBeenCalledWith('PARAMETROS_SERVICE');
  });

  it('consulta un endpoint de parámetros', () => {
    const response = of({ Data: [] });
    requestManager.get.mockReturnValue(response);

    const result = service.get('parametros');

    expect(requestManager.setPath).toHaveBeenLastCalledWith('PARAMETROS_SERVICE');
    expect(requestManager.get).toHaveBeenCalledWith('parametros');
    expect(result).toBe(response);
  });

  it('envía datos a un endpoint de parámetros', () => {
    const element = { Nombre: 'Activo' };
    const response = of({ Data: { Id: 1 } });
    requestManager.post.mockReturnValue(response);

    const result = service.post('parametros', element);

    expect(requestManager.setPath).toHaveBeenLastCalledWith('PARAMETROS_SERVICE');
    expect(requestManager.post).toHaveBeenCalledWith('parametros', element);
    expect(result).toBe(response);
  });

  it('actualiza un parámetro', () => {
    const element = { Id: 1, Nombre: 'Actualizado' };
    const response = of({ Data: element });
    requestManager.put.mockReturnValue(response);

    const result = service.put('parametros', element);

    expect(requestManager.setPath).toHaveBeenLastCalledWith('PARAMETROS_SERVICE');
    expect(requestManager.put).toHaveBeenCalledWith('parametros', element);
    expect(result).toBe(response);
  });

  it('elimina un parámetro por su Id', () => {
    const element = { Id: 7 };
    const response = of({ Success: true });
    requestManager.delete.mockReturnValue(response);

    const result = service.delete('parametros', element);

    expect(requestManager.setPath).toHaveBeenLastCalledWith('PARAMETROS_SERVICE');
    expect(requestManager.delete).toHaveBeenCalledWith('parametros', 7);
    expect(result).toBe(response);
  });

  it('consulta por tipo los parámetros que no están en caché', async () => {
    const parametros: Record<number, ParametroResponse[]> = {
      10: [{ Id: 1, Nombre: 'Estado activo' }],
      12: [{ Id: 2, Nombre: 'Tipo de contrato' }],
    };
    const response: ApiResponse<Record<number, ParametroResponse[]>> = {
      Success: true,
      Status: 200,
      Message: '',
      Data: parametros,
    };
    requestManager.get.mockReturnValue(of(response));

    const result = await service.getParametrosPorTipo([10, 12]);

    expect(requestManager.setPath).toHaveBeenLastCalledWith(
      'GESTION_CONTRACTUAL_MID_SERVICE'
    );
    expect(requestManager.get).toHaveBeenCalledWith('parametros?ids=10,12');
    expect(result).toEqual(parametros);
  });

  it('retorna los parámetros almacenados en caché sin consultar de nuevo', async () => {
    const parametros: Record<number, ParametroResponse[]> = {
      10: [{ Id: 1, Nombre: 'Estado activo' }],
    };
    requestManager.get.mockReturnValue(
      of({
        Success: true,
        Status: 200,
        Message: '',
        Data: parametros,
      })
    );

    await service.getParametrosPorTipo([10]);
    const result = await service.getParametrosPorTipo([10]);

    expect(result).toEqual(parametros);
    expect(requestManager.get).toHaveBeenCalledTimes(1);
  });

  it('combina parámetros en caché con los tipos faltantes', async () => {
    const almacenados = [{ Id: 1, Nombre: 'Estado activo' }];
    const nuevos = [{ Id: 2, Nombre: 'Tipo de contrato' }];
    requestManager.get
      .mockReturnValueOnce(
        of({
          Success: true,
          Status: 200,
          Message: '',
          Data: { 10: almacenados },
        })
      )
      .mockReturnValueOnce(
        of({
          Success: true,
          Status: 200,
          Message: '',
          Data: { 12: nuevos },
        })
      );

    const result = await service.getParametrosPorTipo([10]);
    expect(result).toEqual({ 10: almacenados });

    const combinado = await service.getParametrosPorTipo([10, 12]);

    expect(requestManager.get).toHaveBeenNthCalledWith(
      2,
      'parametros?ids=12'
    );
    expect(combinado).toEqual({ 10: almacenados, 12: nuevos });
  });

  it('no consulta al MID si la lista de tipos está vacía', async () => {
    const result = await service.getParametrosPorTipo([]);

    expect(result).toEqual({});
    expect(requestManager.get).not.toHaveBeenCalled();
  });

  it('propaga errores al consultar parámetros por tipo', async () => {
    const error = new Error('Error de consulta');
    requestManager.get.mockReturnValue(throwError(() => error));

    await expect(service.getParametrosPorTipo([10])).rejects.toBe(error);
  });

  it('filtra los parámetros por Id de padre para un tipo', async () => {
    const parametros: ParametroResponse[] = [
      {
        Id: 1,
        Nombre: 'Hijo del padre 5',
        ParametroPadreId: { Id: 5, Nombre: 'Padre' },
      },
      {
        Id: 2,
        Nombre: 'Hijo del padre 6',
        ParametroPadreId: { Id: 6, Nombre: 'Otro padre' },
      },
      { Id: 3, Nombre: 'Sin padre' },
    ];
    requestManager.get.mockReturnValue(
      of({
        Success: true,
        Status: 200,
        Message: '',
        Data: { 20: parametros },
      })
    );
    await service.getParametrosPorTipo([20]);

    expect(service.getParametroPorPadreIdyTipoId(5, 20)).toEqual([parametros[0]]);
    expect(service.getParametroPorPadreIdyTipoId(99, 20)).toEqual([]);
  });
});