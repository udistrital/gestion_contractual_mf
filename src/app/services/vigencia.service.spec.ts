import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ParametrosService } from 'src/app/services/parametros.service';
import { VigenciaService } from './vigencia.service';

describe('VigenciaService', () => {
  let service: VigenciaService;
  let get: jest.Mock;

  beforeEach(() => {
    get = jest.fn().mockReturnValue(of({ Data: [{ Id: 9001 }] }));
    TestBed.configureTestingModule({
      providers: [{ provide: ParametrosService, useValue: { get } }],
    });
    service = TestBed.inject(VigenciaService);
  });

  it('busca el parámetro tipo 121 cuyo Nombre es el año', async () => {
    expect(await firstValueFrom(service.vigenciaId('2026'))).toBe(9001);
    expect(get).toHaveBeenCalledWith('parametro?query=TipoParametroId:121,Nombre:2026&fields=Id&limit=1');
  });

  it('no repite la consulta de un año ya resuelto', async () => {
    await firstValueFrom(service.vigenciaId('2026'));
    await firstValueFrom(service.vigenciaId('2026'));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('responde null si el año no tiene parámetro y permite volver a consultarlo', async () => {
    get.mockReturnValueOnce(of({ Data: [{}] }));
    expect(await firstValueFrom(service.vigenciaId('2026'))).toBeNull();
    expect(await firstValueFrom(service.vigenciaId('2026'))).toBe(9001);
  });

  it('sin año responde 0 y con un año inválido null, sin consultar', async () => {
    expect(await firstValueFrom(service.vigenciaId(''))).toBe(0);
    expect(await firstValueFrom(service.vigenciaId('abc'))).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it('vigenciaActualId usa el año actual', async () => {
    await firstValueFrom(service.vigenciaActualId());
    expect(get.mock.calls[0][0]).toContain(`Nombre:${new Date().getFullYear()}&`);
  });
});
