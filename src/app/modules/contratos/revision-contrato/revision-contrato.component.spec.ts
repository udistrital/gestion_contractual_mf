import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RevisionContratoComponent } from './revision-contrato.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { MinutasMidService } from 'src/app/services/minuta-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { of } from 'rxjs';

describe('RevisionContratoComponent', () => {
  let component: RevisionContratoComponent;
  let fixture: ComponentFixture<RevisionContratoComponent>;

  const mockCrudService = {
    get: jest
      .fn()
      .mockReturnValue(
        of({ Success: true, Status: 200, Data: { unidad_ejecutora_id: 1 } })
      ),
    getEstados: jest.fn().mockReturnValue(of([])),
    getDocumentoActual: jest.fn().mockReturnValue(of([])),
  };

  const mockMinutasMidService = {
    getMinuta: jest
      .fn()
      .mockReturnValue(of({ Success: true, Data: 'JVBERi0xLjQK...' })),
  };

  const mockGestorDocumentalService = {
    getDocumento: jest.fn().mockReturnValue(of({ file: 'JVBERi0xLjQK...' })),
  };

  const mockRolService = {
    getRol: jest.fn().mockReturnValue(['JEFE_CONTRATACION_RECTOR']),
  };

  const mockUserService = {
    getPersonaId: jest.fn().mockResolvedValue(1),
  };

  const mockAlertService = {
    showErrorAlert: jest.fn(),
    showSuccessAlert: jest.fn(),
    showConfirmAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [RevisionContratoComponent],
      providers: [
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: AlertService, useValue: mockAlertService },
        { provide: ContratoGeneralCrudService, useValue: mockCrudService },
        { provide: ContratoGeneralMidService, useValue: {} },
        { provide: GestorDocumentalService, useValue: mockGestorDocumentalService },
        { provide: MinutasMidService, useValue: mockMinutasMidService },
        { provide: RolService, useValue: mockRolService },
        { provide: UserService, useValue: mockUserService },
      ],
    });
    fixture = TestBed.createComponent(RevisionContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
