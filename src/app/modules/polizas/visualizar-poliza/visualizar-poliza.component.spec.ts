import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { VisualizarPolizaComponent } from './visualizar-poliza.component';
import { ModalDetallePolizaComponent } from './modal-detalle-poliza/modal-detalle-poliza.component';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { PolizasService } from 'src/app/services/polizas.service';
import {
  commonPolizasTestImports,
  commonPolizasTestSchemas,
  mockMatSnackBar,
  mockMatDialog,
} from 'src/app/testing/angular-testbed.helpers';

describe('VisualizarPolizaComponent', () => {
  let component: VisualizarPolizaComponent;
  let fixture: ComponentFixture<VisualizarPolizaComponent>;
  let contratoGeneralCrudService: jest.Mocked<Partial<ContratoGeneralCrudService>>;
  let polizasService: jest.Mocked<Partial<PolizasService>>;
  let snackBar: ReturnType<typeof mockMatSnackBar>;
  let dialog: ReturnType<typeof mockMatDialog>;

  beforeEach(async () => {
    contratoGeneralCrudService = {
      getContratosPorVigencia: jest.fn().mockReturnValue(of({ Data: [] })),
    };
    polizasService = {
      getAmparosContratoMid: jest.fn().mockReturnValue(of({ Data: [] })),
    };
    snackBar = mockMatSnackBar();
    dialog = mockMatDialog();

    await TestBed.configureTestingModule({
      declarations: [VisualizarPolizaComponent],
      imports: [...commonPolizasTestImports],
      schemas: [...commonPolizasTestSchemas],
      providers: [
        { provide: ContratoGeneralCrudService, useValue: contratoGeneralCrudService },
        { provide: PolizasService, useValue: polizasService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizarPolizaComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('cargarContratos (ngOnInit)', () => {
    it('agrega los ids de las 3 vigencias y consulta amparos por cada contrato', () => {
      (contratoGeneralCrudService.getContratosPorVigencia as jest.Mock)
        .mockReturnValueOnce(of({ Data: [1] }))
        .mockReturnValueOnce(of({ Data: [2] }))
        .mockReturnValueOnce(of({ Data: [] }));
      (polizasService.getAmparosContratoMid as jest.Mock).mockImplementation((id: number) =>
        of({ Data: [{ poliza_id: id === 1 ? 10 : null, amparo: 'Cumplimiento' }] })
      );

      fixture.detectChanges();

      expect(contratoGeneralCrudService.getContratosPorVigencia).toHaveBeenCalledTimes(3);
      expect(component.dataSource.data).toEqual([
        { contratoId: '1', tienePoliza: true, amparos: ['Cumplimiento'] },
        { contratoId: '2', tienePoliza: false, amparos: ['Cumplimiento'] },
      ]);
      expect(component.isLoading).toBe(false);
    });

    it('sin contratos en ninguna vigencia no llama a getAmparosContratoMid', () => {
      (contratoGeneralCrudService.getContratosPorVigencia as jest.Mock).mockReturnValue(
        of({ Data: [] })
      );

      fixture.detectChanges();

      expect(polizasService.getAmparosContratoMid).not.toHaveBeenCalled();
      expect(component.dataSource.data).toEqual([]);
    });

    it('error en una vigencia aporta [] para esa vigencia sin romper el resto', () => {
      (contratoGeneralCrudService.getContratosPorVigencia as jest.Mock)
        .mockReturnValueOnce(throwError(() => new Error('falla 2024')))
        .mockReturnValueOnce(of({ Data: [2] }))
        .mockReturnValueOnce(of({ Data: [] }));
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        of({ Data: [] })
      );

      fixture.detectChanges();

      expect(component.dataSource.data).toEqual([
        { contratoId: '2', tienePoliza: false, amparos: [] },
      ]);
    });

    it('error puntual de getAmparosContratoMid para un contrato cae a tienePoliza:false sin amparos', () => {
      (contratoGeneralCrudService.getContratosPorVigencia as jest.Mock)
        .mockReturnValueOnce(of({ Data: [1] }))
        .mockReturnValueOnce(of({ Data: [] }))
        .mockReturnValueOnce(of({ Data: [] }));
      (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
        throwError(() => new Error('mid caído'))
      );

      fixture.detectChanges();

      expect(component.dataSource.data).toEqual([
        { contratoId: '1', tienePoliza: false, amparos: [] },
      ]);
    });
  });

  it('verDetalles abre el ModalDetallePolizaComponent con el contratoId', () => {
    fixture.detectChanges();

    component.verDetalles({ contratoId: '2024-001', tienePoliza: true, amparos: [] });

    expect(dialog.open).toHaveBeenCalledWith(
      ModalDetallePolizaComponent,
      expect.objectContaining({ data: { contratoId: '2024-001' } })
    );
  });
});
