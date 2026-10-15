import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PasoGarantiasComponent } from './paso-garantias.component';
import { PolizasService } from 'src/app/services/polizas.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import {
  commonPolizasTestImports,
  commonPolizasTestSchemas,
  cdkStepperTestProvider,
} from 'src/app/testing/angular-testbed.helpers';

describe('PasoGarantiasComponent', () => {
  let component: PasoGarantiasComponent;
  let fixture: ComponentFixture<PasoGarantiasComponent>;
  let polizasService: jest.Mocked<Partial<PolizasService>>;
  let parametrosService: jest.Mocked<Partial<ParametrosService>>;
  let alertService: jest.Mocked<Partial<AlertService>>;

  const setLocalStorage = (contratoId: number | null) => {
    if (contratoId === null) {
      localStorage.removeItem('paso-info-general');
    } else {
      localStorage.setItem('paso-info-general', JSON.stringify({ id: contratoId }));
    }
  };

  /** Invoca el método privado directamente y lo espera, en vez de depender
   * del timing del ngOnInit (fire-and-forget) disparado por detectChanges. */
  const runLoadSavedData = (): Promise<void> =>
    (component as unknown as { loadSavedData: () => Promise<void> }).loadSavedData();

  beforeEach(async () => {
    localStorage.clear();

    polizasService = {
      getAmparosPorContrato: jest.fn().mockReturnValue(
        of({ Status: 200, Data: [] })
      ),
      postAmparos: jest.fn().mockReturnValue(of({ Success: true })),
      putAmparo: jest.fn().mockReturnValue(of({ Success: true })),
      deleteAmparo: jest.fn().mockReturnValue(of({ Success: true })),
    };
    parametrosService = {
      get: jest.fn().mockReturnValue(of({ Status: '200', Data: [] })),
    };
    alertService = {
      showSuccessAlert: jest.fn(),
      showErrorAlert: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [PasoGarantiasComponent],
      imports: [...commonPolizasTestImports],
      schemas: [...commonPolizasTestSchemas],
      providers: [
        { provide: PolizasService, useValue: polizasService },
        { provide: ParametrosService, useValue: parametrosService },
        { provide: AlertService, useValue: alertService },
        cdkStepperTestProvider(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoGarantiasComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('loadSavedData', () => {
    it('agrega una fila vacía si no hay info general en localStorage', async () => {
      setLocalStorage(null);

      await runLoadSavedData();

      expect(polizasService.getAmparosPorContrato).not.toHaveBeenCalled();
      expect(component.filasFormArray.length).toBe(1);
    });

    it('agrega una fila vacía si el contrato guardado no tiene id', async () => {
      localStorage.setItem('paso-info-general', JSON.stringify({}));

      await runLoadSavedData();

      expect(polizasService.getAmparosPorContrato).not.toHaveBeenCalled();
      expect(component.filasFormArray.length).toBe(1);
    });

    it('agrega una fila vacía cuando el service responde sin Data', async () => {
      setLocalStorage(7);
      (polizasService.getAmparosPorContrato as jest.Mock).mockReturnValue(
        of({ Status: 200, Data: [] })
      );

      await runLoadSavedData();

      expect(polizasService.getAmparosPorContrato).toHaveBeenCalledWith(7);
      expect(component.filasFormArray.length).toBe(1);
    });

    it('precarga suficienciaSalarios cuando tipo_valor_amparo_id es 1', async () => {
      setLocalStorage(7);
      (polizasService.getAmparosPorContrato as jest.Mock).mockReturnValue(
        of({
          Status: 200,
          Data: [
            {
              id: 1,
              amparo_id: 10,
              tipo_valor_amparo_id: 1,
              suficiencia: '5',
              descripcion: 'desc',
            },
          ],
        })
      );

      await runLoadSavedData();

      const fila = component.filasFormArray.at(0);
      expect(fila.get('suficienciaSalarios')?.value).toBe(5);
      expect(fila.get('suficienciaPorcentaje')?.value).toBe('');
      expect(component.filasFormArray.length).toBe(1);
    });

    it('precarga suficienciaPorcentaje cuando tipo_valor_amparo_id es 2', async () => {
      setLocalStorage(7);
      (polizasService.getAmparosPorContrato as jest.Mock).mockReturnValue(
        of({
          Status: 200,
          Data: [
            {
              id: 1,
              amparo_id: 10,
              tipo_valor_amparo_id: 2,
              suficiencia: '30',
              descripcion: 'desc',
            },
          ],
        })
      );

      await runLoadSavedData();

      const fila = component.filasFormArray.at(0);
      expect(fila.get('suficienciaPorcentaje')?.value).toBe(30);
      expect(fila.get('suficienciaSalarios')?.value).toBe('');
    });

    it('cae a agregarFila si el service rechaza', async () => {
      setLocalStorage(7);
      (polizasService.getAmparosPorContrato as jest.Mock).mockReturnValue(
        throwError(() => new Error('network error'))
      );

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      await runLoadSavedData();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading saved data:',
        expect.any(Error)
      );
      expect(component.filasFormArray.length).toBe(1);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('guardarYContinuar', () => {
    function fillFila(overrides: Record<string, unknown> = {}) {
      const fila = component.crearFilaFormGroup();
      fila.patchValue({
        amparo: 10,
        suficienciaPorcentaje: 20,
        descripcion: 'desc',
        ...overrides,
      });
      component.filasFormArray.push(fila);
      return fila;
    }

    beforeEach(() => {
      component.contratoGeneralId = 7;
    });

    it('marca el formulario como touched y no llama al service si es inválido', async () => {
      fillFila({ descripcion: '' });

      await component.guardarYContinuar();

      expect(polizasService.postAmparos).not.toHaveBeenCalled();
    });

    it('crea en lote las filas nuevas (sin id) vía postAmparos', async () => {
      fillFila();

      await component.guardarYContinuar();

      expect(polizasService.postAmparos).toHaveBeenCalledTimes(1);
      const body = (polizasService.postAmparos as jest.Mock).mock.calls[0][0];
      expect(body[0].id).toBeUndefined();
      expect(alertService.showSuccessAlert).toHaveBeenCalled();
    });

    it('actualiza una a una las filas existentes (con id) vía putAmparo', async () => {
      fillFila({ id: 55 });

      await component.guardarYContinuar();

      expect(polizasService.putAmparo).toHaveBeenCalledWith(
        55,
        expect.objectContaining({ amparo_id: 10 })
      );
      expect(polizasService.postAmparos).not.toHaveBeenCalled();
    });

    it('elimina las filas que ya no están en la tabla vía deleteAmparo', async () => {
      (component as any).idsOriginales = [99];

      await component.guardarYContinuar();

      expect(polizasService.deleteAmparo).toHaveBeenCalledWith(99);
    });

    it('muestra error y no continúa si postAmparos responde Success:false', async () => {
      fillFila();
      (polizasService.postAmparos as jest.Mock).mockReturnValue(
        of({ Success: false, Message: 'fallo parcial' })
      );

      let nextStepEmitted = false;
      component.nextStep.subscribe(() => (nextStepEmitted = true));

      await component.guardarYContinuar();

      expect(alertService.showErrorAlert).toHaveBeenCalled();
      expect(nextStepEmitted).toBe(false);
    });

    it('muestra error genérico si alguna request rechaza (catch)', async () => {
      fillFila({ id: 55 });
      (polizasService.putAmparo as jest.Mock).mockReturnValue(
        throwError(() => new Error('boom'))
      );

      await component.guardarYContinuar();

      expect(alertService.showErrorAlert).toHaveBeenCalledWith(
        'Ocurrió un error al guardar la información de garantías',
        'Error al guardar'
      );
      expect(component.isLoading).toBe(false);
    });

    it('muestra error si no hay contratoGeneralId', async () => {
      component.contratoGeneralId = null;
      fillFila();

      await component.guardarYContinuar();

      expect(alertService.showErrorAlert).toHaveBeenCalledWith(
        'No se ha encontrado información del contrato',
        'Error al guardar'
      );
      expect(polizasService.postAmparos).not.toHaveBeenCalled();
    });
  });

  describe('configurarAmparoListener', () => {
    it('deshabilita porcentaje y habilita/requiere salarios para el amparo AMPARO_CREC_ID', () => {
      const fila = component.crearFilaFormGroup();
      component.configurarAmparoListener(fila);

      fila.get('amparo')?.setValue(environment.AMPARO_CREC_ID);

      expect(fila.get('suficienciaPorcentaje')?.disabled).toBe(true);
      expect(fila.get('suficienciaSalarios')?.enabled).toBe(true);
    });

    it('habilita porcentaje y deshabilita salarios para cualquier otro amparo', () => {
      const fila = component.crearFilaFormGroup();
      component.configurarAmparoListener(fila);

      fila.get('amparo')?.setValue(999999);

      expect(fila.get('suficienciaPorcentaje')?.enabled).toBe(true);
      expect(fila.get('suficienciaSalarios')?.disabled).toBe(true);
    });
  });

  describe('validadores de teclado', () => {
    function keyEvent(key: string, target: Partial<HTMLInputElement> = {}): KeyboardEvent {
      const input = Object.assign(document.createElement('input'), target);
      return { key, target: input, preventDefault: jest.fn() } as unknown as KeyboardEvent;
    }

    it('onlyNumbersFrom1To100 permite teclas de control', () => {
      const event = keyEvent('Backspace');
      component.onlyNumbersFrom1To100(event, '5');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onlyNumbersFrom1To100 bloquea teclas no numéricas', () => {
      const event = keyEvent('a', { selectionStart: 0 });
      component.onlyNumbersFrom1To100(event, '');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('onlyNumbersFrom1To100 bloquea valores fuera de 1-100', () => {
      const event = keyEvent('1', { selectionStart: 3 });
      component.onlyNumbersFrom1To100(event, '100');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('onlyNumbersFrom1To100 permite valores dentro de 1-100', () => {
      const event = keyEvent('5', { selectionStart: 1 });
      component.onlyNumbersFrom1To100(event, '1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('onlyPositiveIntegers bloquea teclas no numéricas ni de control', () => {
      const event = keyEvent('-');
      component.onlyPositiveIntegers(event, '1');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('onlyPositiveIntegers bloquea el valor 0', () => {
      const event = keyEvent('0');
      component.onlyPositiveIntegers(event, '');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('onlyPositiveIntegers permite enteros positivos', () => {
      const event = keyEvent('5');
      component.onlyPositiveIntegers(event, '1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('cargarTipoAmparos', () => {
    it('puebla this.amparos cuando la respuesta trae Status "200"', () => {
      (parametrosService.get as jest.Mock).mockReturnValue(
        of({ Status: '200', Data: [{ Id: 1, Nombre: 'Cumplimiento' }] })
      );

      component.cargarTipoAmparos();

      expect(component.amparos).toEqual([{ Id: 1, Nombre: 'Cumplimiento' }]);
    });

    it('no puebla this.amparos si Status no es "200"', () => {
      (parametrosService.get as jest.Mock).mockReturnValue(
        of({ Status: '500', Data: [{ Id: 1 }] })
      );

      component.cargarTipoAmparos();

      expect(component.amparos).toEqual([]);
    });
  });
});
