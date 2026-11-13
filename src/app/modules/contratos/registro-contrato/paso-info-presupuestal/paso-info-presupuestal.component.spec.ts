import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal.component';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';
import { CDP, CDPContratoCRUD, ContratoGeneral } from 'src/app/types/types';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { CdpsService } from 'src/app/services/cdps.service';

describe('PasoInfoPresupuestalComponent', () => {
  let component: PasoInfoPresupuestalComponent;
  let fixture: ComponentFixture<PasoInfoPresupuestalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoInfoPresupuestalComponent],
      providers: [
        {
          provide: ParametrosService,
          useValue: {
            getParametrosPorTipo: jest.fn().mockResolvedValue({}),
            getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: AlertService,
          useValue: {
            showErrorAlert: jest.fn().mockResolvedValue(true),
            showSuccessAlert: jest.fn().mockResolvedValue(true),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PasoInfoPresupuestalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('valor_a_tomar de cada CDP en el CRUD', () => {
    const esperarPromesas = () => new Promise((resolve) => setTimeout(resolve, 0));

    const cdpFinanciera = (numero: string, total: string, valorATomar?: number): CDP => ({
      vigencia: '2026',
      num_sol_adq: '1',
      numero_disponibilidad: numero,
      valor_contratacion: total,
      nombre_dependencia: 'Dependencia de prueba',
      descripcion: 'CDP de prueba',
      estado: 'EXPEDIDO',
      ...(valorATomar !== undefined ? { valor_a_tomar: valorATomar } : {}),
    });

    const guardadoCrud = (id: number, numero: number, valorATomar: number | null): CDPContratoCRUD => ({
      id,
      numero_cdp_id: numero,
      vigencia_cdp_id: 2026,
      fecha_registro: '2026-11-11',
      contrato_general_id: { id: 31 },
      valor_a_tomar: valorATomar,
    });

    // Servicios de raíz: son las mismas instancias que usa el componente.
    const crud = () => TestBed.inject(ContratoGeneralCrudService);
    const cdps = () => TestBed.inject(CdpsService);

    beforeEach(() => {
      fixture.componentRef.setInput('contratoGeneral', { id: 31 } as ContratoGeneral);
      cdps().updateLocalCDP([]);
    });

    it('el POST envía el valor a tomar de cada CDP (el diligenciado o, si no hay, el total)', async () => {
      component.selectedCDP = [cdpFinanciera('28', '2500000', 1200000.5), cdpFinanciera('29', '800000')];
      const postCdp = jest
        .spyOn(crud(), 'postCdp')
        .mockImplementation((cdp: CDPContratoCRUD) => of({ Data: { ...cdp, id: cdp.numero_cdp_id + 100 } }));
      const putCdp = jest.spyOn(crud(), 'putCdp');

      await component.guardarListaCDP();

      expect(postCdp).toHaveBeenCalledTimes(2);
      expect(postCdp.mock.calls[0][0]).toEqual({
        numero_cdp_id: 28,
        fecha_registro: expect.any(String),
        vigencia_cdp_id: 2026,
        contrato_general_id: { id: 31 },
        valor_a_tomar: 1200000.5,
      });
      expect((postCdp.mock.calls[1][0] as CDPContratoCRUD).valor_a_tomar).toBe(800000);
      expect(putCdp).not.toHaveBeenCalled();
    });

    it('al cargar un contrato guardado usa el valor a tomar del CRUD y lo pasa al servicio local de la minuta', async () => {
      jest.spyOn(crud(), 'getCdps').mockReturnValue(of({ Data: [guardadoCrud(10, 28, 1200000.5)] }));
      jest.spyOn(cdps(), 'get').mockReturnValue(of({ Status: 200, Data: [cdpFinanciera('28', '2500000')] }));

      component['cargarCDPsContrato'](31);
      await esperarPromesas();

      expect(component.selectedCDP[0].valor_a_tomar).toBe(1200000.5);
      expect(cdps().getLocalCDP()[0].valor_a_tomar).toBe(1200000.5);
      expect(component.form.get('valorAcumulado')?.value).toBe(1200000.5);
    });

    it('al cargar un CDP con valor a tomar null conserva el total del CDP', async () => {
      jest.spyOn(crud(), 'getCdps').mockReturnValue(of({ Data: [guardadoCrud(10, 28, null)] }));
      jest.spyOn(cdps(), 'get').mockReturnValue(of({ Status: 200, Data: [cdpFinanciera('28', '2500000')] }));

      component['cargarCDPsContrato'](31);
      await esperarPromesas();

      expect(component.selectedCDP[0].valor_a_tomar).toBe(2500000);
      expect(cdps().getLocalCDP()[0].valor_a_tomar).toBe(2500000);
    });

    it('al guardar el paso hace PUT solo de los CDP guardados cuyo valor cambió, enviando solo valor_a_tomar', async () => {
      component.cdpsContrato = [guardadoCrud(10, 28, 2500000), guardadoCrud(11, 29, 1000000)];
      component.selectedCDP = [cdpFinanciera('28', '2500000', 2500000), cdpFinanciera('29', '1000000', 800000)];
      Object.defineProperty(component.form, 'valid', { get: () => true });
      jest.spyOn(crud(), 'getOrdenadores').mockReturnValue(of({ Data: [{ id: 5 }] }));
      jest.spyOn(crud(), 'putOrdenadorContrato').mockReturnValue(of({ Data: { id: 5 } }));
      jest.spyOn(crud(), 'put').mockReturnValue(of({ Data: { id: 31 } }));
      const putCdp = jest
        .spyOn(crud(), 'putCdp')
        .mockReturnValue(of({ Success: true, Status: 200, Message: '', Data: guardadoCrud(11, 29, 800000) }));

      await component.guardarYContinuar();

      expect(putCdp).toHaveBeenCalledTimes(1);
      expect(putCdp).toHaveBeenCalledWith(11, { valor_a_tomar: 800000 });
      expect(component.cdpsContrato[1].valor_a_tomar).toBe(800000);

      putCdp.mockClear();
      await component.guardarYContinuar();
      expect(putCdp).not.toHaveBeenCalled();
    });

    it('hace PUT del valor vigente cuando el CRUD lo tiene en null (contratos guardados antes de la columna)', async () => {
      component.cdpsContrato = [guardadoCrud(10, 28, null)];
      component.selectedCDP = [cdpFinanciera('28', '2500000', 2500000)];
      const putCdp = jest
        .spyOn(crud(), 'putCdp')
        .mockReturnValue(of({ Success: true, Status: 200, Message: '', Data: guardadoCrud(10, 28, 2500000) }));

      await component.guardarListaCDP();

      expect(putCdp).toHaveBeenCalledWith(10, { valor_a_tomar: 2500000 });
    });

    it('al borrar un CDP guardado y volver a agregarlo, lo registra con POST y no con PUT', async () => {
      component.cdpsContrato = [guardadoCrud(10, 28, 2500000)];
      const cdp = cdpFinanciera('28', '2500000', 2500000);
      component.selectedCDP = [cdp];
      const deleteCdp = jest.spyOn(crud(), 'deleteCdp').mockReturnValue(of({ Data: { id: 10 } }));
      const postCdp = jest
        .spyOn(crud(), 'postCdp')
        .mockImplementation((nuevo: CDPContratoCRUD) => of({ Data: { ...nuevo, id: 20 } }));
      const putCdp = jest.spyOn(crud(), 'putCdp');

      await component.eliminarCDP(cdp);

      expect(deleteCdp).toHaveBeenCalledWith(10);
      expect(component.cdpsContrato).toEqual([]);

      component.selectedCDP = [cdpFinanciera('28', '2500000', 1800000)];
      await component.guardarListaCDP();

      expect(postCdp).toHaveBeenCalledTimes(1);
      expect((postCdp.mock.calls[0][0] as CDPContratoCRUD).valor_a_tomar).toBe(1800000);
      expect(putCdp).not.toHaveBeenCalled();
      expect(component.cdpsContrato.map((c) => c.id)).toEqual([20]);
    });

    it('si el borrado en el CRUD falla, el CDP sigue contando como guardado', async () => {
      component.cdpsContrato = [guardadoCrud(10, 28, 2500000)];
      const cdp = cdpFinanciera('28', '2500000', 2500000);
      component.selectedCDP = [cdp];
      jest.spyOn(crud(), 'deleteCdp').mockReturnValue(throwError(() => ({ status: 500, message: 'Error' })));

      await component.eliminarCDP(cdp);

      expect(component.cdpsContrato.map((c) => c.id)).toEqual([10]);
      expect(component.selectedCDP).toHaveLength(1);
    });
  });
});
