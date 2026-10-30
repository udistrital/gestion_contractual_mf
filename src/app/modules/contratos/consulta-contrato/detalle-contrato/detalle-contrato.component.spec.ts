import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { DetalleContratoComponent } from './detalle-contrato.component';
import { ContratosRoutingModule } from '../../contratos-routing.module';
import { RegistroContratoComponent } from '../../registro-contrato/registro-contrato.component';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { AlertService } from 'src/app/services/alert.service';

// El guard depende del menú de permisos del core; aquí solo interesa la ruta.
jest.mock('src/_guards/auth.guard', () => ({ authGuard: () => true }));

describe('DetalleContratoComponent', () => {
  let contratoGeneralCrudService: { get: jest.Mock };

  beforeEach(() => {
    jest.spyOn(RegistroContratoComponent.prototype, 'ngAfterViewInit').mockImplementation(() => undefined);
    contratoGeneralCrudService = {
      get: jest.fn().mockReturnValue(of({ Success: true, Data: { id: 42 } })),
    };

    TestBed.configureTestingModule({
      imports: [ContratosRoutingModule],
      declarations: [DetalleContratoComponent, RegistroContratoComponent],
      providers: [
        provideRouter([]),
        { provide: ContratoGeneralCrudService, useValue: contratoGeneralCrudService },
        { provide: AlertService, useValue: { showErrorAlert: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('la ruta detalle/:contratoId crea RegistroContratoComponent en modo visualización', async () => {
    const harness = await RouterTestingHarness.create();
    const detalle = await harness.navigateByUrl('/detalle/42', DetalleContratoComponent);

    expect(detalle.contratoGeneralId).toBe(42);
    const registro = harness.routeDebugElement!
      .query(By.directive(RegistroContratoComponent))
      .componentInstance as RegistroContratoComponent;
    expect(registro.viewMode()).toBe(true);
    expect(registro.contratoGeneralId()).toBe(42);
    expect(contratoGeneralCrudService.get).toHaveBeenCalledWith(42);
  });
});
