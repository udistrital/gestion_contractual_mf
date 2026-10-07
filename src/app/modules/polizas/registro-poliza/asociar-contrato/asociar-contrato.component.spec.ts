import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AsociarContratoComponent } from './asociar-contrato.component';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import {
  commonPolizasTestImports,
  commonPolizasTestSchemas,
  mockMatSnackBar,
} from 'src/app/testing/angular-testbed.helpers';

describe('AsociarContratoComponent', () => {
  let component: AsociarContratoComponent;
  let fixture: ComponentFixture<AsociarContratoComponent>;
  let contratoGeneralCrudService: jest.Mocked<Partial<ContratoGeneralCrudService>>;
  let snackBar: ReturnType<typeof mockMatSnackBar>;

  beforeEach(async () => {
    contratoGeneralCrudService = {
      getContratosPorVigencia: jest.fn().mockReturnValue(of({ Data: [1, 2, 3] })),
    };
    snackBar = mockMatSnackBar();

    await TestBed.configureTestingModule({
      declarations: [AsociarContratoComponent],
      imports: [...commonPolizasTestImports],
      schemas: [...commonPolizasTestSchemas],
      providers: [
        { provide: ContratoGeneralCrudService, useValue: contratoGeneralCrudService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsociarContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadContratos por vigencia', () => {
    it('puebla consecutivo con los contratos de la vigencia elegida', () => {
      component.form.get('vigencia')?.setValue('2026');

      expect(contratoGeneralCrudService.getContratosPorVigencia).toHaveBeenCalledWith(
        '2026'
      );
      expect(component.consecutivo).toEqual([
        { value: '1', viewValue: '1' },
        { value: '2', viewValue: '2' },
        { value: '3', viewValue: '3' },
      ]);
      expect(component.hasError).toBe(false);
    });

    it('error al cargar contratos marca hasError y muestra snackbar', () => {
      (contratoGeneralCrudService.getContratosPorVigencia as jest.Mock).mockReturnValue(
        throwError(() => ({ message: 'no hay contratos' }))
      );

      component.form.get('vigencia')?.setValue('2025');

      expect(component.hasError).toBe(true);
      expect(component.consecutivo).toEqual([]);
      expect(snackBar.open).toHaveBeenCalledWith(
        'no hay contratos',
        'Cerrar',
        expect.anything()
      );
    });

    it('limpiar la vigencia limpia consecutivo y resetea el control', () => {
      component.form.get('vigencia')?.setValue('2026');
      component.form.get('vigencia')?.setValue('');

      expect(component.consecutivo).toEqual([]);
      expect(component.form.get('consecutivo')?.value).toBe('');
    });
  });

  describe('selección de consecutivo', () => {
    it('setea selectedContratoId y resetea polizaId al elegir un consecutivo', () => {
      component.polizaId = 7;

      component.form.get('consecutivo')?.setValue('123');

      expect(component.selectedContratoId).toBe('123');
      expect(component.polizaId).toBeNull();
      expect(component.hasError).toBe(false);
    });

    it('limpiar el consecutivo deja selectedContratoId en null', () => {
      component.form.get('consecutivo')?.setValue('123');
      component.form.get('consecutivo')?.setValue('');

      expect(component.selectedContratoId).toBeNull();
    });
  });

  it('onPolizaGuardada setea el polizaId recibido', () => {
    component.onPolizaGuardada(55);

    expect(component.polizaId).toBe(55);
  });

  it('ngOnDestroy hace unsubscribe de todas las subscripciones', () => {
    const spies = (component as any).subscriptions.map((sub: { unsubscribe: () => void }) =>
      jest.spyOn(sub, 'unsubscribe')
    );

    component.ngOnDestroy();

    spies.forEach((spy: jest.SpyInstance) => expect(spy).toHaveBeenCalled());
  });
});
