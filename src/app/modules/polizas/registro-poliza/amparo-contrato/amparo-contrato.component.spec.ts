import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AmparoContratoComponent } from './amparo-contrato.component';
import { PolizasService } from 'src/app/services/polizas.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';
import {
  commonPolizasTestImports,
  commonPolizasTestSchemas,
  mockMatSnackBar,
} from 'src/app/testing/angular-testbed.helpers';

describe('AmparoContratoComponent', () => {
  let component: AmparoContratoComponent;
  let fixture: ComponentFixture<AmparoContratoComponent>;
  let polizasService: jest.Mocked<Partial<PolizasService>>;
  let parametrosService: jest.Mocked<Partial<ParametrosService>>;
  let alertService: jest.Mocked<Partial<AlertService>>;
  let snackBar: ReturnType<typeof mockMatSnackBar>;

  const amparoBase = {
    id: 1,
    descripcion: 'Cumplimiento del contrato',
    tipo_valor_amparo_id: 1,
    suficiencia: '10',
    poliza_id: null,
    valor: null,
    fecha_inicio: null,
    fecha_fin: null,
    amparo: 'Cumplimiento',
  };

  beforeEach(async () => {
    polizasService = {
      getAmparosContratoMid: jest.fn().mockReturnValue(of({ Data: [] })),
      putAmparo: jest.fn().mockReturnValue(of({ Success: true })),
      getActaAprobacionPoliza: jest
        .fn()
        .mockReturnValue(of({ Success: true, Status: 200, Data: 'QUNUQQ==' })),
      subirActa: jest
        .fn()
        .mockReturnValue(
          of({ Status: '200', res: { Id: 10, Enlace: 'enlace-nuxeo' } })
        ),
      registrarDocumentoActa: jest.fn().mockReturnValue(of({ Success: true })),
    };
    parametrosService = {
      get: jest.fn().mockReturnValue(of({ Data: [] })),
    };
    // El registro pide confirmación porque además guarda el acta de aprobación
    alertService = {
      showConfirmAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
    };
    snackBar = mockMatSnackBar();

    await TestBed.configureTestingModule({
      declarations: [AmparoContratoComponent],
      imports: [...commonPolizasTestImports],
      schemas: [...commonPolizasTestSchemas],
      providers: [
        { provide: PolizasService, useValue: polizasService },
        { provide: ParametrosService, useValue: parametrosService },
        { provide: AlertService, useValue: alertService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AmparoContratoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('carga de amparos', () => {
    it('separa vinculados/disponibles cuando polizaId ya está seteado', () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({
          Data: [
            { ...amparoBase, id: 1, poliza_id: 99 },
            { ...amparoBase, id: 2, poliza_id: null },
          ],
        })
      );

      component.polizaId = 99;
      component.contratoId = '5';

      expect(component.amparosDisponibles).toEqual([
        expect.objectContaining({ id: 2 }),
      ]);
      expect(component.amparosFormArray.length).toBe(1);
      expect(component.amparosFormArray.at(0).get('id')?.value).toBe(1);
    });

    it('sin polizaId todos los amparos quedan disponibles y la tabla vacía', () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({
          Data: [
            { ...amparoBase, id: 1, poliza_id: 5 },
            { ...amparoBase, id: 2, poliza_id: null },
          ],
        })
      );

      component.contratoId = '5';

      expect(component.amparosDisponibles.length).toBe(2);
      expect(component.amparosFormArray.length).toBe(0);
    });

    it('ngOnChanges re-separa al cambiar polizaId (no primer cambio) sin recargar HTTP', () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({
          Data: [{ ...amparoBase, id: 1, poliza_id: 42 }],
        })
      );
      component.contratoId = '5';
      expect(component.amparosFormArray.length).toBe(0);
      (polizasService.getAmparosContratoMid as jest.Mock).mockClear();

      component.polizaId = 42;
      component.ngOnChanges({
        polizaId: {
          previousValue: null,
          currentValue: 42,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.amparosFormArray.length).toBe(1);
      expect(polizasService.getAmparosContratoMid).not.toHaveBeenCalled();
    });

    it('agrega/quita amparos entre disponibles y el FormArray', () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({ Data: [{ ...amparoBase, id: 1, poliza_id: null }] })
      );
      component.contratoId = '5';

      component.form.get('amparoSeleccionado')?.setValue(1);
      component.addAmparo();

      expect(component.amparosDisponibles.length).toBe(0);
      expect(component.amparosFormArray.length).toBe(1);

      component.removeAmparo(0);

      expect(component.amparosDisponibles.length).toBe(1);
      expect(component.amparosFormArray.length).toBe(0);
    });

    it('etiqueta tipo_valor_amparo_id 1 como SMLV y 2 como Porcentaje al agregar', () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({
          Data: [
            { ...amparoBase, id: 1, tipo_valor_amparo_id: 1, poliza_id: 1 },
            { ...amparoBase, id: 2, tipo_valor_amparo_id: 2, poliza_id: 1 },
          ],
        })
      );
      component.polizaId = 1;
      component.contratoId = '5';

      expect(component.amparosFormArray.at(0).get('tipo_valor_amparo')?.value).toBe(
        'SMLV'
      );
      expect(component.amparosFormArray.at(1).get('tipo_valor_amparo')?.value).toBe(
        'Porcentaje'
      );
    });

    it('loadAmparos: Data vacío muestra mensaje NO_AMPAROS', () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({ Data: [] })
      );

      component.contratoId = '5';

      expect(snackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('No se encontraron amparos'),
        'Cerrar',
        expect.anything()
      );
    });

    it('loadAmparos: error 404/400 muestra el mismo mensaje de "completa el paso"', () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        throwError(() => ({ status: 404 }))
      );

      component.contratoId = '5';

      expect(snackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('completa ese paso'),
        'Cerrar',
        expect.anything()
      );
    });

    it('loadAmparos: error genérico muestra mensaje distinto', () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        throwError(() => ({ status: 500 }))
      );

      component.contratoId = '5';

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error al cargar los amparos del contrato',
        'Cerrar',
        expect.anything()
      );
    });
  });

  describe('registrarAmparos', () => {
    it('sin polizaId no llama al service y muestra error', async () => {
      component.polizaId = null;

      await component.registrarAmparos();

      expect(polizasService.putAmparo).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Primero guarde los datos básicos de la póliza',
        'Cerrar',
        expect.anything()
      );
    });

    it('formulario inválido marca todo como touched y no llama al service', async () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({ Data: [{ ...amparoBase, id: 1, poliza_id: 1, valor: null }] })
      );
      component.polizaId = 1;
      component.contratoId = '5';
      component.amparosFormArray.at(0).patchValue({ valor: '' });

      await component.registrarAmparos();

      expect(polizasService.putAmparo).not.toHaveBeenCalled();
    });

    it('vincula filas con fecha_fin (no fecha_final) y desvincula las quitadas', async () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({
          Data: [
            { ...amparoBase, id: 1, poliza_id: 1 },
            { ...amparoBase, id: 2, poliza_id: 1 },
          ],
        })
      );
      component.polizaId = 1;
      component.contratoId = '5';

      component.amparosFormArray.at(0).patchValue({
        valor: '100',
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
      });
      component.removeAmparo(1);

      await component.registrarAmparos();

      expect(polizasService.putAmparo).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          poliza_id: 1,
          valor: 100,
          fecha_inicio: expect.any(String),
          fecha_fin: expect.any(String),
        })
      );
      expect(polizasService.putAmparo).toHaveBeenCalledWith(2, { poliza_id: null });
    });

    it('éxito muestra mensaje info y recarga; error muestra mensaje de error', async () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({ Data: [{ ...amparoBase, id: 1, poliza_id: 1 }] })
      );
      component.polizaId = 1;
      component.contratoId = '5';
      component.amparosFormArray.at(0).patchValue({
        valor: '100',
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      });

      await component.registrarAmparos();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Amparos registrados correctamente para la póliza',
        'Cerrar',
        expect.anything()
      );
      expect(component.isRegistrando).toBe(false);
    });

    it('error en putAmparo muestra mensaje de error y limpia isRegistrando', async () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({ Data: [{ ...amparoBase, id: 1, poliza_id: 1 }] })
      );
      component.polizaId = 1;
      component.contratoId = '5';
      component.amparosFormArray.at(0).patchValue({
        valor: '100',
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      });
      (polizasService.putAmparo as jest.Mock).mockReturnValue(
        throwError(() => new Error('boom'))
      );

      await component.registrarAmparos();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Ocurrió un error al registrar los amparos',
        'Cerrar',
        expect.anything()
      );
      expect(component.isRegistrando).toBe(false);
    });

    it('cancelar la confirmación no registra amparos ni genera el acta', async () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({ Data: [{ ...amparoBase, id: 1, poliza_id: 1 }] })
      );
      component.polizaId = 1;
      component.contratoId = '5';
      component.amparosFormArray.at(0).patchValue({
        valor: '100',
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      });
      (alertService.showConfirmAlert as jest.Mock).mockResolvedValue({
        isConfirmed: false,
      });

      await component.registrarAmparos();

      expect(alertService.showConfirmAlert).toHaveBeenCalled();
      expect(polizasService.putAmparo).not.toHaveBeenCalled();
      expect(polizasService.getActaAprobacionPoliza).not.toHaveBeenCalled();
      expect(component.isRegistrando).toBe(false);
    });

    it('genera el acta, la sube al gestor documental y la registra en el contrato', async () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({ Data: [{ ...amparoBase, id: 1, poliza_id: 1 }] })
      );
      component.polizaId = 1;
      component.contratoId = '5';
      component.amparosFormArray.at(0).patchValue({
        valor: '100',
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      });

      await component.registrarAmparos();

      expect(polizasService.getActaAprobacionPoliza).toHaveBeenCalledWith(5);
      expect(polizasService.subirActa).toHaveBeenCalledWith(5, 'QUNUQQ==');
      expect(polizasService.registrarDocumentoActa).toHaveBeenCalledWith(
        5,
        10,
        'enlace-nuxeo'
      );
      expect(snackBar.open).toHaveBeenCalledWith(
        'Póliza registrada y acta de aprobación guardada',
        'Cerrar',
        expect.anything()
      );
    });

    it('si falla la subida al gestor documental avisa que los amparos sí quedaron registrados', async () => {
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({ Data: [{ ...amparoBase, id: 1, poliza_id: 1 }] })
      );
      component.polizaId = 1;
      component.contratoId = '5';
      component.amparosFormArray.at(0).patchValue({
        valor: '100',
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      });
      (polizasService.subirActa as jest.Mock).mockReturnValue(
        of({ Status: '500' })
      );

      await component.registrarAmparos();

      expect(polizasService.registrarDocumentoActa).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Amparos registrados, pero no se pudo guardar el acta en el gestor documental',
        'Cerrar',
        expect.anything()
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('hace unsubscribe de la subscripción interna', () => {
      component.contratoId = '5';
      const sub = (component as any).subscription;
      const spy = jest.spyOn(sub, 'unsubscribe');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
    });
  });
});
