import Swal from 'sweetalert2';
import { AlertService } from './alert.service';

const contenedor = document.createElement('div');
jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn().mockResolvedValue({ isConfirmed: true }), getContainer: () => contenedor },
}));

describe('AlertService', () => {
  const fire = jest.mocked(Swal.fire);
  const service = new AlertService();

  beforeEach(() => fire.mockClear());

  it('showConfirmAlert agrega la alerta en el elemento indicado (target)', async () => {
    const host = document.createElement('div');
    await service.showConfirmAlert('¿Seguro?', 'Atención', host);
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ target: host, text: '¿Seguro?', showCancelButton: true }));
    // El host del overlay del CDK desactiva pointer-events: al abrir, la alerta los reactiva en su contenedor.
    const opciones = fire.mock.calls[0][0] as { didOpen?: () => void };
    opciones.didOpen?.();
    expect(contenedor.style.pointerEvents).toBe('auto');
  });

  it('showConfirmAlert sin target conserva el comportamiento anterior (body)', async () => {
    await service.showConfirmAlert('¿Seguro?');
    expect(fire.mock.calls[0][0]).not.toHaveProperty('target');
    expect(fire.mock.calls[0][0]).not.toHaveProperty('didOpen');
    expect(fire.mock.calls[0][0]).toEqual(expect.objectContaining({ title: 'Atención' }));
  });
});
