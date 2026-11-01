import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RevisionContratoComponent } from './revision-contrato.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';
import { environment } from 'src/environments/environment';
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
        of({ Success: true, Status: '200', Data: { unidad_ejecutora_id: 1 } })
      ),
    getEstados: jest.fn().mockReturnValue(of({ Success: true, Status: '200', Data: [] })),
    postEstadoContrato: jest.fn().mockReturnValue(of({ Success: true, Status: '201', Data: { id: 3 } })),
  };

  const mockGestionCrudService = {
    getDocumentos: jest.fn().mockReturnValue(of({ Success: true, Status: '200', Data: [] })),
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
        { provide: GestionContractualCrudService, useValue: mockGestionCrudService },
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

  describe('CRUD Beego v2 (#390)', () => {
    beforeEach(() => {
      component.contrato_general_id = 42;
      jest.clearAllMocks();
    });

    it('consulta los estados del contrato del más reciente al más antiguo', () => {
      component.cargarDatosIniciales();
      expect(mockCrudService.getEstados).toHaveBeenCalledWith({
        query: 'contrato_general_id.id:42,activo:true',
        sortby: 'fecha_creacion,id',
        order: 'desc',
        limit: 0,
      });
    });

    it('toma la minuta vigente por entidad_tipo, entidad_id y tipo, la más reciente', () => {
      mockGestionCrudService.getDocumentos.mockReturnValueOnce(
        of({ Success: true, Status: '200', Data: [{ id: 9, documento_enlace: 'uid-9' }] })
      );
      component.getMinuta();
      expect(mockGestionCrudService.getDocumentos).toHaveBeenCalledWith({
        query:
          'entidad_tipo:contrato_general,entidad_id:42,' +
          `tipo_documento_id:${environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA},activo:true`,
        sortby: 'fecha_creacion,id',
        order: 'desc',
        limit: 1,
      });
      expect(mockGestorDocumentalService.getDocumento).toHaveBeenCalledWith('uid-9');
    });

    it('el estado registrado se reconoce por Data.id de la respuesta del CRUD', () => {
      const crear = jest.spyOn(component, 'crearEstadoContrato').mockImplementation();
      const estado: any = { contrato_general_id: 42, estado_parametro_id: 6773, estado_interno_parametro_id: 6800 };
      component.crearEstadoAutomaticoContrato(estado, 6801);
      expect(crear).toHaveBeenCalled();
    });
  });
});
