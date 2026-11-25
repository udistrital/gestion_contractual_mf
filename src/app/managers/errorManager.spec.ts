import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { HttpErrorManager } from './errorManager';

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

describe('HttpErrorManager', () => {
  let manager: HttpErrorManager;
  const error = (status: number) => new HttpErrorResponse({ status, error: { Success: false, Status: status } });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    manager = TestBed.inject(HttpErrorManager);
    (Swal.fire as jest.Mock).mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('muestra la alerta genérica por defecto', () => {
    manager.handleError(error(404)).subscribe({ error: () => undefined });
    expect(Swal.fire).toHaveBeenCalledTimes(1);
  });

  it('omite la alerta para los estados que maneja quien llama', () => {
    manager.handleError(error(404), [404]).subscribe({ error: () => undefined });
    manager.handleError(error(500), [404]).subscribe({ error: () => undefined });
    expect(Swal.fire).toHaveBeenCalledTimes(1);
  });

  it("con 'todos' omite la alerta para cualquier estado y propaga el error", () => {
    const recibidos: number[] = [];
    for (const status of [0, 400, 404, 409, 500, 504]) {
      manager.handleError(error(status), 'todos').subscribe({ error: (e) => recibidos.push(e.status) });
    }
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(recibidos).toEqual([0, 400, 404, 409, 500, 504]);
  });
});
