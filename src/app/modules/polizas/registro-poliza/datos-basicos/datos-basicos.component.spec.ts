import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { DatosBasicosComponent } from './datos-basicos.component';
import { PolizasService } from 'src/app/services/polizas.service';
import {
  commonPolizasTestImports,
  commonPolizasTestSchemas,
} from 'src/app/testing/angular-testbed.helpers';

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

describe('DatosBasicosComponent', () => {
  let component: DatosBasicosComponent;
  let fixture: ComponentFixture<DatosBasicosComponent>;
  let polizasService: jest.Mocked<Partial<PolizasService>>;

  const polizaExistente = {
    id: 42,
    numero_poliza: 'P-001',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    fecha_expedicion: '2025-12-01',
    fecha_aprobacion: '2025-12-05',
    entidad_aseguradora_id: 1,
    descripcion: 'desc',
  };

  beforeEach(async () => {
    (Swal.fire as jest.Mock).mockClear();
    polizasService = {
      getPolizaPorContrato: jest.fn().mockReturnValue(of({ Data: [] })),
      postPoliza: jest.fn().mockReturnValue(of({ Data: { id: 1 } })),
      putPoliza: jest.fn().mockReturnValue(of({ Data: { id: 42 } })),
    };

    await TestBed.configureTestingModule({
      declarations: [DatosBasicosComponent],
      imports: [...commonPolizasTestImports],
      schemas: [...commonPolizasTestSchemas],
      providers: [{ provide: PolizasService, useValue: polizasService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DatosBasicosComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function fillFormValido() {
    component.polizaForm.patchValue({
      numero_poliza: 'P-002',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: new Date('2026-12-31'),
      fecha_expedicion: new Date('2025-12-01'),
      fecha_aprobacion: new Date('2025-12-05'),
      entidad_aseguradora_id: 1,
      descripcion: 'desc',
    });
  }

  describe('setter contratoId / cargarPoliza', () => {
    it('resetea polizaId y el form al cambiar de contrato', () => {
      component.polizaId = 99;
      component.contratoId = '5';

      expect(component.polizaId).toBeNull();
      expect(component.polizaForm.get('numero_poliza')?.value).toBeNull();
    });

    it('precarga el form y emite polizaGuardada si existe póliza activa', () => {
      (polizasService.getPolizaPorContrato as jest.Mock).mockReturnValue(
        of({ Data: [polizaExistente] })
      );
      const emitted: number[] = [];
      component.polizaGuardada.subscribe((id) => emitted.push(id));

      component.contratoId = '5';

      expect(polizasService.getPolizaPorContrato).toHaveBeenCalledWith(5);
      expect(component.polizaId).toBe(42);
      expect(component.polizaForm.get('numero_poliza')?.value).toBe('P-001');
      expect(emitted).toEqual([42]);
      expect(component.isLoading).toBe(false);
    });

    it('no emite ni asigna polizaId si Data[0] no existe', () => {
      (polizasService.getPolizaPorContrato as jest.Mock).mockReturnValue(
        of({ Data: [] })
      );
      const emitted: number[] = [];
      component.polizaGuardada.subscribe((id) => emitted.push(id));

      component.contratoId = '5';

      expect(component.polizaId).toBeNull();
      expect(emitted).toEqual([]);
    });

    it('error en cargarPoliza limpia isLoading sin romper', () => {
      (polizasService.getPolizaPorContrato as jest.Mock).mockReturnValue(
        throwError(() => new Error('network'))
      );

      component.contratoId = '5';

      expect(component.isLoading).toBe(false);
      expect(component.polizaId).toBeNull();
    });
  });

  describe('onSubmit', () => {
    it('no llama al service si el form es inválido', () => {
      component.contratoId = '5';

      component.onSubmit();

      expect(polizasService.postPoliza).not.toHaveBeenCalled();
      expect(polizasService.putPoliza).not.toHaveBeenCalled();
    });

    it('no llama al service si no hay contratoId', () => {
      fillFormValido();

      component.onSubmit();

      expect(polizasService.postPoliza).not.toHaveBeenCalled();
    });

    it('POST cuando no hay polizaId, con fechas ISO', () => {
      component.contratoId = '5';
      fillFormValido();

      component.onSubmit();

      expect(polizasService.postPoliza).toHaveBeenCalledWith(
        expect.objectContaining({
          contrato_general_id: 5,
          numero_poliza: 'P-002',
          fecha_inicio: expect.stringMatching(/^2026-01-01/),
          fecha_fin: expect.any(String),
        })
      );
      expect(polizasService.putPoliza).not.toHaveBeenCalled();
    });

    it('PUT cuando ya existe polizaId', () => {
      component.contratoId = '5';
      component.polizaId = 42;
      fillFormValido();

      component.onSubmit();

      expect(polizasService.putPoliza).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ numero_poliza: 'P-002' })
      );
      expect(polizasService.postPoliza).not.toHaveBeenCalled();
    });

    it('éxito muestra Swal de éxito y emite polizaGuardada con el id de la respuesta', () => {
      component.contratoId = '5';
      fillFormValido();
      const emitted: number[] = [];
      component.polizaGuardada.subscribe((id) => emitted.push(id));

      component.onSubmit();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'success' })
      );
      expect(emitted).toEqual([1]);
    });

    it('error muestra Swal de error con el mensaje', () => {
      (polizasService.postPoliza as jest.Mock).mockReturnValue(
        throwError(() => ({ message: 'fallo del servidor' }))
      );
      component.contratoId = '5';
      fillFormValido();

      component.onSubmit();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          text: expect.stringContaining('fallo del servidor'),
        })
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('hace unsubscribe de la subscripción interna', () => {
      const sub = (component as any).subscription;
      const spy = jest.spyOn(sub, 'unsubscribe');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
    });
  });
});
