import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasoInfoGeneralComponent } from './paso-info-general.component';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { VigenciaService } from 'src/app/services/vigencia.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { of, throwError } from 'rxjs';

describe('PasoInfoGeneralComponent', () => {
  let component: PasoInfoGeneralComponent;
  let fixture: ComponentFixture<PasoInfoGeneralComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoInfoGeneralComponent],
      providers: [
        {
          provide: ParametrosService,
          useValue: {
            get: jest.fn().mockReturnValue(of({ Status: '200', Data: { Id: 1, Data: [] } })),
            getParametrosPorTipo: jest.fn().mockResolvedValue({}),
            getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: AlertService,
          useValue: {
            showErrorAlert: jest.fn(),
            showSuccessAlert: jest.fn(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PasoInfoGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('PasoInfoGeneralComponent: guardado', () => {
  let fixture: ComponentFixture<PasoInfoGeneralComponent>;
  let component: PasoInfoGeneralComponent;
  let crud: Record<string, jest.Mock>;
  let mid: Record<string, jest.Mock>;
  let vigencias: Record<string, jest.Mock>;

  const respuesta = (Status: number) => of({ Success: true, Status, Data: { id: 42 } });

  const existente = { id: 42, unidad_ejecutora_id: 1 };

  async function montar(datos?: any) {
    mid = { postConsecutivo: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: '27' })) };
    vigencias = { vigenciaActualId: jest.fn().mockReturnValue(of(9001)) };
    crud = {
      post: jest.fn().mockReturnValue(respuesta(201)),
      put: jest.fn().mockReturnValue(respuesta(200)),
      postEstadoContrato: jest.fn().mockReturnValue(respuesta(201)),
    };
    TestBed.configureTestingModule({
      declarations: [PasoInfoGeneralComponent],
      providers: [
        { provide: AlertService, useValue: { showErrorAlert: jest.fn(), showSuccessAlert: jest.fn() } },
        { provide: RolService, useValue: { getRol: () => ['ABOGADO_CONTRATACION_RECTOR'] } },
        {
          provide: ParametrosService,
          useValue: {
            getParametrosPorTipo: jest.fn().mockResolvedValue({}),
            getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
          },
        },
        { provide: ContratoGeneralCrudService, useValue: crud },
        { provide: ContratoGeneralMidService, useValue: mid },
        { provide: UserService, useValue: { getPersonaId: jest.fn().mockResolvedValue(1) } },
        { provide: VigenciaService, useValue: vigencias },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PasoInfoGeneralComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('contratoGeneral', datos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    jest.spyOn(component.formInfoGeneral, 'invalid', 'get').mockReturnValue(false);
  }

  async function guardar() {
    component.guardarYContinuar();
    await new Promise((resuelto) => setTimeout(resuelto));
  }

  it('en un contrato nuevo pide consecutivo, hace POST y registra el estado inicial', async () => {
    await montar();
    await guardar();
    expect(mid['postConsecutivo']).toHaveBeenCalledTimes(1);
    expect(crud['post']).toHaveBeenCalledWith(expect.objectContaining({ consecutivo_elaboracion: '27' }));
    expect(crud['put']).not.toHaveBeenCalled();
    expect(crud['postEstadoContrato']).toHaveBeenCalledTimes(1);
  });

  it('en un contrato existente hace PUT al mismo id, sin consecutivo, sin POST y sin otro estado', async () => {
    await montar(existente);
    const guardado = jest.fn();
    component.contratoGuardado.subscribe(guardado);
    await guardar();
    expect(crud['put']).toHaveBeenCalledTimes(1);
    expect(crud['put'].mock.calls[0][0]).toBe(42);
    expect(crud['put'].mock.calls[0][1]).not.toHaveProperty('consecutivo_elaboracion');
    expect(crud['post']).not.toHaveBeenCalled();
    expect(mid['postConsecutivo']).not.toHaveBeenCalled();
    expect(crud['postEstadoContrato']).not.toHaveBeenCalled();
    expect(guardado).toHaveBeenCalledWith(42);
  });

  it('un perfil de contratista que deja de aplicar se envía como null', async () => {
    await montar({ ...existente, perfil_contratista_id: 7 });
    component.formInfoGeneral.get('perfilContratistaId')?.disable();
    await guardar();
    expect(crud['put'].mock.calls[0][1]).toEqual(expect.objectContaining({ perfil_contratista_id: null }));
  });

  it.each([
    ['0', false],
    ['1', true],
  ])('aplica póliza %s se envía como el booleano %s', async (valor, esperado) => {
    await montar();
    component.formInfoGeneral.patchValue({ aplicaPoliza: valor });
    await guardar();
    expect(crud['post'].mock.calls[0][0].aplica_poliza).toBe(esperado);
  });

  it('no guarda de nuevo hasta que llega el contrato recargado', async () => {
    await montar();
    await guardar();
    expect(component.guardando()).toBe(true);

    await guardar();
    expect(mid['postConsecutivo']).toHaveBeenCalledTimes(1);
    expect(crud['post']).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('contratoGeneral', existente);
    fixture.detectChanges();
    expect(component.guardando()).toBe(false);

    await guardar();
    expect(crud['post']).toHaveBeenCalledTimes(1);
    expect(crud['put']).toHaveBeenCalledTimes(1);
  });

  it('permite reintentar si falla el guardado', async () => {
    await montar();
    crud['post'].mockReturnValue(throwError(() => new Error('falló')));
    await guardar();
    expect(component.guardando()).toBe(false);
  });

  it('guarda vigencia_id y la envía al consecutivo como entero', async () => {
    await montar();
    const unidad = component.formInfoGeneral.value.unidadEjecutoraId || component.unidadesEjecutoras[0]?.Id;
    await guardar();
    expect(mid['postConsecutivo']).toHaveBeenCalledWith({ unidad_ejecutora_id: Number(unidad), vigencia_id: 9001 });
    expect(crud['post']).toHaveBeenCalledWith(expect.objectContaining({ vigencia_id: 9001 }));
  });

  it.each([
    ['no trae la vigencia', () => of(null)],
    ['falla', () => throwError(() => new Error('falló'))],
  ])('si Parámetros %s no guarda el contrato y avisa', async (_caso, respuestaVigencia) => {
    await montar();
    vigencias['vigenciaActualId'].mockReturnValue(respuestaVigencia());
    await guardar();
    expect(TestBed.inject(AlertService).showErrorAlert).toHaveBeenCalledWith(
      'No se encontró la vigencia del año actual en Parámetros. El contrato no se guardó.',
      'Error al consultar la vigencia'
    );
    expect(mid['postConsecutivo']).not.toHaveBeenCalled();
    expect(crud['post']).not.toHaveBeenCalled();
    expect(component.guardando()).toBe(false);
  });

  it('editar no consulta la vigencia', async () => {
    await montar(existente);
    await guardar();
    expect(vigencias['vigenciaActualId']).not.toHaveBeenCalled();
    expect(crud['put'].mock.calls[0][1]).not.toHaveProperty('vigencia_id');
  });

  it('permite reintentar si falla el consecutivo', async () => {
    await montar();
    mid['postConsecutivo'].mockReturnValue(throwError(() => new Error('falló')));
    await guardar();
    expect(component.guardando()).toBe(false);
    expect(crud['post']).not.toHaveBeenCalled();
  });

  it('aplica póliza sin valor se envía como null', async () => {
    await montar();
    component.formInfoGeneral.get('aplicaPoliza')?.reset();
    await guardar();
    expect(crud['post'].mock.calls[0][0].aplica_poliza).toBeNull();
  });
});
