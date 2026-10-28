import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ModalDetallePolizaComponent } from './modal-detalle-poliza.component';
import { PolizasService } from 'src/app/services/polizas.service';
import {
  commonPolizasTestImports,
  commonPolizasTestSchemas,
} from 'src/app/testing/angular-testbed.helpers';

describe('ModalDetallePolizaComponent', () => {
  let component: ModalDetallePolizaComponent;
  let fixture: ComponentFixture<ModalDetallePolizaComponent>;
  let polizasService: jest.Mocked<Partial<PolizasService>>;

  beforeEach(async () => {
    polizasService = {
      getPolizaPorContrato: jest.fn().mockReturnValue(
        of({ Data: [{ id: 1, numero_poliza: 'P-001' }] })
      ),
      getAmparosContratoMid: jest.fn().mockReturnValue(
        of({ Data: [{ id: 1, amparo: 'Cumplimiento' }] })
      ),
    };

    await TestBed.configureTestingModule({
      declarations: [ModalDetallePolizaComponent],
      imports: [...commonPolizasTestImports],
      schemas: [...commonPolizasTestSchemas],
      providers: [
        { provide: PolizasService, useValue: polizasService },
        { provide: MAT_DIALOG_DATA, useValue: { contratoId: '5' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalDetallePolizaComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('carga poliza y amparos vía forkJoin y limpia isLoading', () => {
    fixture.detectChanges();

    expect(polizasService.getPolizaPorContrato).toHaveBeenCalledWith(5);
    expect(polizasService.getAmparosContratoMid).toHaveBeenCalledWith(5);
    expect(component.poliza).toEqual({ id: 1, numero_poliza: 'P-001' });
    expect(component.amparos).toEqual([{ id: 1, amparo: 'Cumplimiento' }]);
    expect(component.isLoading).toBe(false);
  });

  it('poliza queda null si Data está vacío', () => {
    (polizasService.getPolizaPorContrato as jest.Mock).mockReturnValue(of({ Data: [] }));

    fixture.detectChanges();

    expect(component.poliza).toBeNull();
  });

  it('error en getPolizaPorContrato cae a poliza:null sin romper el modal', () => {
    (polizasService.getPolizaPorContrato as jest.Mock).mockReturnValue(
      throwError(() => new Error('crud caído'))
    );

    fixture.detectChanges();

    expect(component.poliza).toBeNull();
    expect(component.amparos).toEqual([{ id: 1, amparo: 'Cumplimiento' }]);
    expect(component.isLoading).toBe(false);
  });

  it('error en getAmparosContratoMid cae a amparos:[] sin romper el modal', () => {
    (polizasService.getAmparosContratoMid as jest.Mock).mockReturnValue(
      throwError(() => new Error('mid caído'))
    );

    fixture.detectChanges();

    expect(component.amparos).toEqual([]);
    expect(component.poliza).toEqual({ id: 1, numero_poliza: 'P-001' });
    expect(component.isLoading).toBe(false);
  });
});
