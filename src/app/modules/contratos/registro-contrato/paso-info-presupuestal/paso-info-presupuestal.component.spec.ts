import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal.component';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';

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

  it('debe permitir asociar los CDPs enviando solo los campos del modelo del CRUD (sin valor_a_tomar) y antes de diligenciar el valor del contrato', async () => {
    fixture.componentRef.setInput('contratoGeneral', { id: 31 } as any);
    component.selectedCDP = [
      {
        numero_disponibilidad: '28',
        vigencia: '2024',
        valor_contratacion: '2500000',
        valor_a_tomar: 2500000,
      } as any,
    ];
    const postCdpSpy = jest
      .spyOn((component as any).contratoGeneralCrudService, 'postCdp')
      .mockReturnValue({
        subscribe: (obs: any) => {
          obs.next?.({ Data: { id: 10, numero_cdp_id: 28, vigencia_cdp_id: 2024, contrato_general_id: { id: 31 } } });
          obs.complete?.();
        },
      } as any);

    await component.guardarListaCDP();

    expect(postCdpSpy).toHaveBeenCalledTimes(1);
    const payload = postCdpSpy.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        numero_cdp_id: 28,
        vigencia_cdp_id: 2024,
        contrato_general_id: { id: 31 },
      })
    );
    expect(payload).not.toHaveProperty('valor_a_tomar');
  });
});
