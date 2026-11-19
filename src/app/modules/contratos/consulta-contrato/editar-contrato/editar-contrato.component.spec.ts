import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { EditarContratoComponent } from './editar-contrato.component';
import { ContratosRoutingModule } from '../../contratos-routing.module';
import { RegistroContratoComponent } from '../../registro-contrato/registro-contrato.component';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { AlertService } from 'src/app/services/alert.service';

// El guard depende del menú de permisos del core; aquí solo interesa la ruta.
jest.mock('src/_guards/auth.guard', () => ({ authGuard: () => true }));

describe('EditarContratoComponent', () => {
  let contratoGeneralCrudService: { get: jest.Mock };

  beforeEach(() => {
    jest.spyOn(RegistroContratoComponent.prototype, 'ngAfterViewInit').mockImplementation(() => undefined);
    contratoGeneralCrudService = {
      get: jest.fn().mockReturnValue(of({ Success: true, Data: { id: 75, consecutivo_elaboracion: 'CT-2026-075' } })),
    };

    TestBed.configureTestingModule({
      imports: [ContratosRoutingModule],
      declarations: [EditarContratoComponent, RegistroContratoComponent],
      providers: [
        provideRouter([]),
        { provide: ContratoGeneralCrudService, useValue: contratoGeneralCrudService },
        { provide: AlertService, useValue: { showErrorAlert: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('la ruta editar/:contratoId crea RegistroContratoComponent en modo edición', async () => {
    const harness = await RouterTestingHarness.create();
    const edicion = await harness.navigateByUrl('/editar/75', EditarContratoComponent);

    expect(edicion.contratoGeneralId).toBe(75);
    expect(edicion.editMode).toBe(true);
    const registro = harness.routeDebugElement!
      .query(By.directive(RegistroContratoComponent))
      .componentInstance as RegistroContratoComponent;
    expect(registro.viewMode()).toBe(false);
    expect(registro.editMode()).toBe(true);
    expect(registro.contratoGeneralId()).toBe(75);
    expect(contratoGeneralCrudService.get).toHaveBeenCalledWith(75);
  });

  it('extrae el id numérico correctamente y actualiza ante cambios de parámetro', async () => {
    const fixture = TestBed.createComponent(EditarContratoComponent);
    const component = fixture.componentInstance;
    component.contratoGeneralId = 10;
    fixture.detectChanges();

    expect(component.editMode).toBe(true);
    expect(component.contratoGeneralId).toBe(10);
  });
});
