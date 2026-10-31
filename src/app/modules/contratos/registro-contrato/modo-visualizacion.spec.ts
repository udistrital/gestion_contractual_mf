import { Component, Input, NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AlertService } from 'src/app/services/alert.service';
import { CdpsService } from 'src/app/services/cdps.service';
import { ClausulasParagrafosService } from 'src/app/services/clausulas-paragrafos.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { MinutasMidService } from 'src/app/services/minuta-mid.service';
import { OrdenadoresSupervisoresContratacionMidService } from 'src/app/services/ordenadores-supervisores-contratacion-mid.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PolizasService } from 'src/app/services/polizas.service';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { ContratoGeneral } from 'src/app/types/types';
import { PasoClausulasParagrafosComponent } from './paso-clausulas-paragrafos/paso-clausulas-paragrafos.component';
import { PasoContratistasComponent } from './paso-contratistas/paso-contratistas.component';
import { PasoDocumentosComponent } from './paso-documentos/paso-documentos.component';
import { PasoEspecificacionesComponent } from './paso-especificaciones/paso-especificaciones.component';
import { PasoGarantiasComponent } from './paso-garantias/paso-garantias.component';
import { PasoInfoGeneralComponent } from './paso-info-general/paso-info-general.component';
import { PasoInfoPresupuestalComponent } from './paso-info-presupuestal/paso-info-presupuestal.component';
import { PasoObligacionesComponent } from './paso-obligaciones/paso-obligaciones.component';
import { PasoSupervisoresComponent } from './paso-supervisores/paso-supervisores.component';
import { PdfViewerModalComponent } from './pdf-viewer-modal/pdf-viewer-modal.component';
import { RegistroContratoComponent } from './registro-contrato.component';

/**
 * Pruebas del modo visualización (solo lectura) de los pasos del registro de
 * contrato: el formulario queda deshabilitado después de cada carga de datos,
 * ningún enable() existente lo reactiva y no se muestran acciones de edición.
 */

const ACCIONES_DE_EDICION =
  /guardar|agregar|añadir|eliminar|remover|asociar|cargue|plantilla|seleccionar pdf|nueva actividad|cláusula especial|re-sincronizar|consultar registro|siguiente:/i;

/** Textos de los botones visibles en el template del componente. */
function textosDeBotones(fixture: ComponentFixture<unknown>): string[] {
  const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
  return Array.from(botones).map((boton) => (boton.textContent ?? '').trim());
}

function esperarSinAccionesDeEdicion(fixture: ComponentFixture<unknown>): void {
  const acciones = textosDeBotones(fixture).filter((texto) => ACCIONES_DE_EDICION.test(texto));
  expect(acciones).toEqual([]);
}

/** Emisiones de stepCompleted del paso montado (estado del paso en el stepper). */
let pasoCompleto: boolean[] = [];

/** Pulsa el botón "Siguiente" del modo visualización. */
function pulsarSiguiente(fixture: ComponentFixture<unknown>): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').trim().startsWith('Siguiente')
  );
  expect(boton).toBeTruthy();
  boton!.click();
}

const alertServiceMock = () => ({
  showAlert: jest.fn(),
  showSuccessAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
  showErrorAlert: jest.fn(),
  showConfirmAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
});

const contrato = {
  id: 42,
  unidad_ejecutora_id: environment.UNIDADES_EJECUTORAS.RECTORIA,
  tipo_compromiso_id: environment.ORDEN_ID,
  tipo_contrato_id: environment.CONTRATO_PSPAG_ID,
  perfil_contratista_id: 1,
  aplica_poliza: true,
  modalidad_seleccion_id: 2,
  tipologia_especifica_id: 3,
  regimen_contratacion_id: 4,
  procedimiento_id: 5,
  plazo_ejecucion: 12,
  unidad_ejecucion_id: 6,
  tipo_moneda_id: 999,
  valor_pesos: 1000000,
  justificacion: 'Justificación guardada',
  objeto: 'Objeto guardado',
  actividades: '1. Actividad guardada',
  tipo_control_id: 6611,
} as unknown as ContratoGeneral;

describe('Modo visualización de los pasos del registro de contrato', () => {
  describe('PasoInfoGeneralComponent', () => {
    let fixture: ComponentFixture<PasoInfoGeneralComponent>;
    let component: PasoInfoGeneralComponent;

    async function montar(viewMode: boolean, datos = contrato, parametros: Record<number, unknown[]> = {}) {
      TestBed.configureTestingModule({
        declarations: [PasoInfoGeneralComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          { provide: RolService, useValue: { getRol: () => ['ABOGADO_CONTRATACION_RECTOR'] } },
          {
            provide: ParametrosService,
            useValue: {
              getParametrosPorTipo: jest.fn().mockResolvedValue(parametros),
              getParametroPorPadreIdyTipoId: jest.fn().mockReturnValue([]),
            },
          },
          { provide: ContratoGeneralCrudService, useValue: {} },
          { provide: ContratoGeneralMidService, useValue: {} },
          { provide: UserService, useValue: {} },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoInfoGeneralComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('viewMode', viewMode);
      fixture.componentRef.setInput('contratoGeneral', datos);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('deshabilita el formulario después de cargar el contrato', async () => {
      await montar(true);
      expect(component.formInfoGeneral.disabled).toBe(true);
      expect(component.formInfoGeneral.getRawValue().plazoEjecucion).toBe(12);
      expect(component.unidadesEjecutoras.length).toBeGreaterThan(0);
    });

    it('ningún enable() reactiva el formulario en visualización', async () => {
      await montar(true);
      const form = component.formInfoGeneral;
      form.get('tipoCompromisoId')?.setValue(environment.ORDEN_ID);
      form.get('tipoContratoId')?.setValue(environment.CONTRATO_PSPAG_ID);
      component.showFieldsBasedOnCompromiso(environment.CONVENIO_ID);

      expect(form.get('aplicaPoliza')?.disabled).toBe(true);
      expect(form.get('perfilContratistaId')?.disabled).toBe(true);
      expect(form.get('fechaSuscripcionEstudios')?.disabled).toBe(true);
      expect(form.get('convenio')?.disabled).toBe(true);
      expect(form.disabled).toBe(true);
    });

    it('muestra los campos que aplican aunque estén deshabilitados', async () => {
      await montar(true);
      expect(component.campoAplica('aplicaPoliza')).toBe(true);
      expect(component.campoAplica('perfilContratistaId')).toBe(true);
      expect(component.campoAplica('fechaSuscripcionEstudios')).toBe(true);

      component.formInfoGeneral.get('tipoContratoId')?.setValue(6541, { emitEvent: false });
      expect(component.campoAplica('perfilContratistaId')).toBe(false);
    });

    it('calcula la estimación de término con los datos cargados', async () => {
      const conFecha = {
        ...contrato,
        fecha_suscripcion_estudios: '2026-02-01T12:00:00',
        plazo_ejecucion: 12,
      } as unknown as ContratoGeneral;
      await montar(true, conFecha, { [environment.UNIDAD_EJECUCION_ID]: [{ Id: 6, Nombre: 'MESES' }] });
      expect(component.formInfoGeneral.disabled).toBe(true);
      expect(component.estimacionTermino).toBe('1 Febrero 2027');
    });

    it('sin fecha de estudios previos la estimación queda pendiente también en visualización', async () => {
      await montar(true, contrato, { [environment.UNIDAD_EJECUCION_ID]: [{ Id: 6, Nombre: 'MESES' }] });
      expect(component.estimacionTermino).toBe('Pendiente de cálculo');
    });

    it('oculta el botón de guardar en visualización', async () => {
      await montar(true);
      esperarSinAccionesDeEdicion(fixture);
    });

    it('en edición sigue habilitando los campos dependientes', async () => {
      await montar(false);
      component.formInfoGeneral.get('tipoContratoId')?.setValue(environment.CONTRATO_PSPAG_ID);
      expect(component.formInfoGeneral.get('perfilContratistaId')?.enabled).toBe(true);
      expect(component.formInfoGeneral.enabled).toBe(true);
    });
  });

  describe('PasoInfoPresupuestalComponent', () => {
    let fixture: ComponentFixture<PasoInfoPresupuestalComponent>;
    let component: PasoInfoPresupuestalComponent;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        declarations: [PasoInfoPresupuestalComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          { provide: ParametrosService, useValue: { getParametrosPorTipo: jest.fn().mockResolvedValue({}) } },
          {
            provide: CdpsService,
            useValue: {
              getLocalCDP: jest.fn().mockReturnValue([]),
              updateLocalCDP: jest.fn(),
              get: jest.fn().mockReturnValue(of({ Status: 200, Data: [] })),
            },
          },
          {
            provide: ContratoGeneralCrudService,
            useValue: {
              getOrdenadores: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: [{ id: 5, ordenador_argo_id: 3 }] })),
              getCdps: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: [] })),
            },
          },
          {
            provide: OrdenadoresSupervisoresContratacionMidService,
            useValue: {
              getRolOrdenadores: jest.fn().mockReturnValue(of({ Status: 200, Data: [] })),
              getOrdenadorActuales: jest
                .fn()
                .mockReturnValue(of({ Status: 200, Data: [{ nombre_ordenador: 'Ordenador' }] })),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoInfoPresupuestalComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('viewMode', true);
      fixture.componentRef.setInput('contratoGeneral', contrato);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      // Los datos se cargan cuando ya están el contrato y los parámetros (efecto).
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('deshabilita el formulario después de cargar el contrato y el ordenador', () => {
      expect(component.form.disabled).toBe(true);
      expect(component.form.getRawValue().valorContrato).toBe('1000000');
      expect(component.form.getRawValue().ordenadorGasto).toBe(3);
    });

    it('carga el contrato aunque llegue después de los parámetros', async () => {
      const tardio = TestBed.createComponent(PasoInfoPresupuestalComponent);
      tardio.componentRef.setInput('viewMode', true);
      tardio.detectChanges();
      await tardio.whenStable();
      tardio.componentRef.setInput('contratoGeneral', contrato);
      tardio.detectChanges();
      await tardio.whenStable();
      tardio.detectChanges();
      expect(tardio.componentInstance.form.getRawValue().valorContrato).toBe('1000000');
    });

    it('el cambio de moneda no reactiva los campos de moneda extranjera', () => {
      component.CambioMoneda(999);
      expect(component.form.get('monedaExtranjera')?.disabled).toBe(true);
      expect(component.form.get('tasaCambio')?.disabled).toBe(true);
      expect(component.form.disabled).toBe(true);
    });

    it('en visualización "Siguiente" solo navega al paso siguiente', () => {
      const navegar = jest.fn();
      component.nextStep.subscribe(navegar);
      pulsarSiguiente(fixture);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it('oculta asociar CDP y guardar', () => {
      esperarSinAccionesDeEdicion(fixture);
    });
  });

  describe('PasoSupervisoresComponent', () => {
    let fixture: ComponentFixture<PasoSupervisoresComponent>;
    let component: PasoSupervisoresComponent;

    beforeEach(async () => {
      const supervisor = (n: number) => ({
        id: n,
        documento: `${n}`,
        sede_legado: '',
        dependencia_legado: '',
        cargo_legado: '',
        sede_id: '10',
        dependencia_id: '20',
        digito_verificacion: '1',
      });
      TestBed.configureTestingModule({
        declarations: [PasoSupervisoresComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          {
            provide: ContratoGeneralMidService,
            useValue: {
              getSedes: jest.fn().mockReturnValue(of([])),
              getDependenciasBySede: jest.fn().mockReturnValue(of([])),
            },
          },
          {
            provide: ContratoGeneralCrudService,
            useValue: {
              // El solicitante vive en contrato_general (modelo v2).
              get: jest.fn().mockReturnValue(
                of({ Success: true, Status: 200, Data: { id: 1, sede_solicitante_id: 10, dependencia_solicitante_id: 20 } })
              ),
              getSupervisores: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: [supervisor(1), supervisor(2)] })),
            },
          },
          {
            provide: OrdenadoresSupervisoresContratacionMidService,
            useValue: { getSupervisoresDependencia: jest.fn().mockReturnValue(of({ Data: [] })) },
          },
          {
            provide: ParametrosService,
            useValue: {
              getParametrosPorTipo: jest.fn().mockResolvedValue({
                [environment.TIPO_CONTROL_ID]: [{ Id: 6611, Nombre: 'Técnico, administrativo y financiero' }],
              }),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoSupervisoresComponent);
      component = fixture.componentInstance;
      pasoCompleto = [];
      component.stepCompleted.subscribe((completo) => pasoCompleto.push(completo));
      fixture.componentRef.setInput('viewMode', true);
      fixture.componentRef.setInput('contratoGeneral', contrato);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('carga Tipo y Alcance del Control desde el contrato y sus opciones desde Parámetros', () => {
      expect(component.tiposControl).toEqual([{ Id: 6611, Nombre: 'Técnico, administrativo y financiero' }]);
      expect(component.getSupervisoresFormArray().at(0).get('tipoControl')?.value).toBe(6611);
      expect(component.getSupervisoresFormArray().at(1).get('tipoControl')?.value).toBe(6611);
    });

    it('en visualización marca el paso como completo con los supervisores cargados', () => {
      expect(pasoCompleto).toContain(true);
    });

    it('deshabilita el formulario, incluido el supervisor agregado en la carga', () => {
      expect(component.getSupervisoresFormArray().length).toBe(2);
      expect(component.getSupervisoresFormArray().at(1).disabled).toBe(true);
      expect(component.form.disabled).toBe(true);
    });

    it('oculta guardar, agregar y remover supervisor', () => {
      esperarSinAccionesDeEdicion(fixture);
    });
  });

  describe('PasoContratistasComponent', () => {
    let fixture: ComponentFixture<PasoContratistasComponent>;
    let component: PasoContratistasComponent;
    let proveedoresService: { get: jest.Mock };

    beforeEach(async () => {
      proveedoresService = {
        get: jest.fn().mockReturnValue(
          of({
            Status: 200,
            Data: {
              proveedor: {
                tipo_persona: 'NATURAL',
                numero_documento: '1014285890',
                nombre_completo_proveedor: 'Contratista de prueba',
                tipo_persona_id: 1,
              },
              contratos: [],
            },
          })
        ),
      };
      TestBed.configureTestingModule({
        declarations: [PasoContratistasComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          { provide: ProveedoresService, useValue: proveedoresService },
          {
            provide: ContratoGeneralCrudService,
            useValue: {
              // El contratista vive en contrato_general (modelo v2).
              get: jest
                .fn()
                .mockReturnValue(of({ Success: true, Status: 200, Data: { id: 7, proveedor_numero_documento: '1014285890', tipo_persona_id: 1 } })),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoContratistasComponent);
      component = fixture.componentInstance;
      pasoCompleto = [];
      component.stepCompleted.subscribe((completo) => pasoCompleto.push(completo));
      fixture.componentRef.setInput('viewMode', true);
      fixture.componentRef.setInput('contratoGeneral', contrato);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('en visualización marca el paso como completo con el contratista cargado', () => {
      expect(pasoCompleto).toContain(true);
    });

    it('carga el contratista guardado y deja el formulario deshabilitado', () => {
      expect(proveedoresService.get).toHaveBeenCalledWith('contratistas?id=1014285890');
      expect(component.datosContratista).toBeTruthy();
      expect(component.form.disabled).toBe(true);
    });

    it('en visualización "Siguiente" solo navega al paso siguiente', () => {
      const navegar = jest.fn();
      component.nextStep.subscribe(navegar);
      pulsarSiguiente(fixture);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it('el documento del contratista se ve bloqueado y está deshabilitado', () => {
      const elemento = fixture.nativeElement as HTMLElement;
      expect(elemento.querySelector('.search-input-wrapper')?.classList).toContain('wrapper-locked');
      expect(elemento.querySelector('input.search-input-field')?.classList).toContain('field-locked');
      expect(component.form.get('documentoContratista')?.disabled).toBe(true);
    });

    it('oculta consultar y el guardado', () => {
      esperarSinAccionesDeEdicion(fixture);
    });
  });

  describe('PasoObligacionesComponent', () => {
    let fixture: ComponentFixture<PasoObligacionesComponent>;
    let component: PasoObligacionesComponent;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        declarations: [PasoObligacionesComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          {
            provide: CdpsService,
            useValue: { cdp$: of([]), updateLocalCDP: jest.fn(), getLocalCDP: jest.fn().mockReturnValue([]) },
          },
          { provide: ContratoGeneralCrudService, useValue: {} },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoObligacionesComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('viewMode', true);
      fixture.componentRef.setInput('contratoGeneral', contrato);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('deshabilita el formulario con los datos guardados', () => {
      expect(component.form.getRawValue().objetoContrato).toBe('Objeto guardado');
      expect(component.actividadesList.length).toBeGreaterThan(0);
      expect(component.form.disabled).toBe(true);
    });

    it('en visualización "Siguiente" solo navega al paso siguiente', () => {
      const navegar = jest.fn();
      component.nextStep.subscribe(navegar);
      pulsarSiguiente(fixture);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it('oculta las acciones de actividades y el guardado', () => {
      esperarSinAccionesDeEdicion(fixture);
      expect(fixture.nativeElement.querySelector('.actividad-actions-col')).toBeNull();
    });
  });

  describe('PasoEspecificacionesComponent', () => {
    let fixture: ComponentFixture<PasoEspecificacionesComponent>;
    let component: PasoEspecificacionesComponent;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        declarations: [PasoEspecificacionesComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          { provide: MatDialog, useValue: { open: jest.fn() } },
          { provide: GestorDocumentalService, useValue: {} },
          {
            provide: ContratoGeneralCrudService,
            useValue: {
              getEspecificacionesTecnicas: jest.fn().mockReturnValue(
                of({
                  Success: true,
                  Data: [{ id: 1, descripcion: 'Ítem', cantidad: 1, valor_unitario: 10, valor_total: 10 }],
                })
              ),
            },
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoEspecificacionesComponent);
      component = fixture.componentInstance;
      pasoCompleto = [];
      component.stepCompleted.subscribe((completo) => pasoCompleto.push(completo));
      fixture.componentRef.setInput('viewMode', true);
      fixture.componentRef.setInput('contratoGeneral', contrato);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('en visualización marca el paso como completo con las especificaciones cargadas', () => {
      expect(pasoCompleto).toEqual([true]);
    });

    it('carga las especificaciones y omite la columna de acciones', () => {
      expect(component.especificaciones.length).toBe(1);
      expect(component.columnasVisibles).not.toContain('acciones');
    });

    it('en visualización "Siguiente" solo navega al paso siguiente', () => {
      const navegar = jest.fn();
      component.nextStep.subscribe(navegar);
      pulsarSiguiente(fixture);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it('oculta añadir, cargue masivo, plantilla y guardar', () => {
      esperarSinAccionesDeEdicion(fixture);
    });
  });

  describe('PasoGarantiasComponent', () => {
    let fixture: ComponentFixture<PasoGarantiasComponent>;
    let component: PasoGarantiasComponent;
    let polizasService: { getAmparos: jest.Mock };

    async function montar(amparos: unknown[], viewMode = true) {
      polizasService = { getAmparos: jest.fn().mockReturnValue(of({ Success: true, Data: amparos })) };
      TestBed.configureTestingModule({
        declarations: [PasoGarantiasComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          {
            provide: ParametrosService,
            useValue: { get: jest.fn().mockReturnValue(of({ Status: '200', Data: [] })) },
          },
          { provide: PolizasService, useValue: polizasService },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoGarantiasComponent);
      component = fixture.componentInstance;
      pasoCompleto = [];
      component.stepCompleted.subscribe((completo) => pasoCompleto.push(completo));
      fixture.componentRef.setInput('viewMode', viewMode);
      fixture.componentRef.setInput('contratoGeneral', contrato);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('en visualización marca el paso como completo con los amparos cargados', async () => {
      await montar([
        { amparo_id: environment.AMPARO_CREC_ID, tipo_valor_amparo_id: 1, suficiencia: 5, descripcion: 'Amparo' },
      ]);
      expect(pasoCompleto).toContain(true);
    });

    it('deshabilita los amparos cargados y el cambio de amparo no los reactiva', async () => {
      await montar([
        { amparo_id: environment.AMPARO_CREC_ID, tipo_valor_amparo_id: 1, suficiencia: 5, descripcion: 'Amparo' },
      ]);
      expect(component.filasFormArray.length).toBe(1);
      expect(component.form.disabled).toBe(true);

      const fila = component.filasFormArray.at(0);
      fila.get('amparo')?.setValue(1);
      expect(fila.get('suficienciaPorcentaje')?.disabled).toBe(true);
      fila.get('amparo')?.setValue(environment.AMPARO_CREC_ID);
      expect(fila.get('suficienciaSalarios')?.disabled).toBe(true);
      expect(component.form.disabled).toBe(true);
    });

    it('muestra la suficiencia que corresponde al amparo aunque esté deshabilitada', async () => {
      await montar([
        { amparo_id: environment.AMPARO_CREC_ID, tipo_valor_amparo_id: 1, suficiencia: 5, descripcion: 'Amparo' },
        { amparo_id: 1, tipo_valor_amparo_id: 2, suficiencia: 20, descripcion: 'Cumplimiento' },
      ]);
      const [crec, otro] = component.filasFormArray.controls as FormGroup[];
      expect(component.mostrarSuficiencia(crec, 'suficienciaSalarios')).toBe(true);
      expect(component.mostrarSuficiencia(crec, 'suficienciaPorcentaje')).toBe(false);
      expect(component.mostrarSuficiencia(otro, 'suficienciaPorcentaje')).toBe(true);
      expect(component.mostrarSuficiencia(otro, 'suficienciaSalarios')).toBe(false);
    });

    it('calcula el estado de cobertura con los datos aunque el formulario esté deshabilitado', async () => {
      await montar([
        { amparo_id: environment.AMPARO_CREC_ID, tipo_valor_amparo_id: 1, suficiencia: 5, descripcion: 'Amparo' },
        { amparo_id: 1, tipo_valor_amparo_id: 2, suficiencia: 20, descripcion: 'Cumplimiento' },
      ]);
      expect(component.form.valid).toBe(false);
      expect(component.estadoCobertura).toBe('Completo');
    });

    it('el estado de cobertura es incompleto si falta un dato en visualización', async () => {
      await montar([{ amparo_id: 1, tipo_valor_amparo_id: 2, suficiencia: 20, descripcion: '' }]);
      expect(component.estadoCobertura).toBe('Incompleto');
    });

    it('en edición el estado de cobertura sigue dependiendo de la validez del formulario', async () => {
      await montar([{ amparo_id: 1, tipo_valor_amparo_id: 2, suficiencia: 20, descripcion: 'Cumplimiento' }], false);
      expect(component.form.valid).toBe(true);
      expect(component.estadoCobertura).toBe('Completo');

      component.filasFormArray.at(0).get('descripcion')?.setValue('');
      expect(component.estadoCobertura).toBe('Incompleto');
    });

    it('sin amparos guardados no agrega una fila vacía', async () => {
      await montar([]);
      expect(component.filasFormArray.length).toBe(0);
    });

    it('en visualización "Siguiente" solo navega al paso siguiente', async () => {
      await montar([{ amparo_id: 1, tipo_valor_amparo_id: 2, suficiencia: 20, descripcion: 'Cumplimiento' }]);
      const navegar = jest.fn();
      component.nextStep.subscribe(navegar);
      pulsarSiguiente(fixture);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it('oculta agregar, eliminar y guardar', async () => {
      await montar([
        { amparo_id: environment.AMPARO_CREC_ID, tipo_valor_amparo_id: 1, suficiencia: 5, descripcion: 'Amparo' },
      ]);
      expect(component.columnasVisibles).not.toContain('acciones');
      esperarSinAccionesDeEdicion(fixture);
    });
  });

  describe('PasoClausulasParagrafosComponent', () => {
    let fixture: ComponentFixture<PasoClausulasParagrafosComponent>;
    let component: PasoClausulasParagrafosComponent;
    let clausulasService: { get: jest.Mock; post: jest.Mock };
    let dialog: { open: jest.Mock };

    const clausula = {
      _id: 'c1',
      nombre: 'Objeto',
      descripcion: 'El contratista se compromete...',
      predeterminado: false,
      es_editable: true,
      paragrafos: [{ _id: 'p1', descripcion: 'Parágrafo', predeterminado: false, es_editable: true }],
    };

    async function montar(respuestaContrato: unknown) {
      clausulasService = { get: jest.fn().mockReturnValue(of(respuestaContrato)), post: jest.fn() };
      dialog = { open: jest.fn() };
      TestBed.configureTestingModule({
        declarations: [PasoClausulasParagrafosComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          { provide: MatDialog, useValue: dialog },
          {
            provide: ContratoGeneralCrudService,
            useValue: {
              getEstados: jest.fn().mockReturnValue(of({ Success: true, Status: 200, Data: [] })),
              getEspecificacionesTecnicas: jest.fn().mockReturnValue(of({ Success: true, Data: [] })),
            },
          },
          { provide: RolService, useValue: { getRol: () => [] } },
          { provide: UserService, useValue: { getPersonaId: jest.fn().mockResolvedValue(1) } },
          { provide: ClausulasParagrafosService, useValue: clausulasService },
          { provide: MinutasMidService, useValue: { getMinuta: jest.fn().mockReturnValue(of({ Data: 'JVBERi0xLjQK' })) } },
          {
            provide: ParametrosService,
            useValue: { get: jest.fn().mockReturnValue(of({ Status: '200', Data: [{ Id: '1', Nombre: 'PRIMERA' }] })) },
          },
          { provide: CdpsService, useValue: { getLocalCDP: jest.fn().mockReturnValue([]), cdp$: of([]) } },
          { provide: MatStepper, useValue: { _getStepLabelId: () => '', steps: { toArray: () => [] } } },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoClausulasParagrafosComponent);
      component = fixture.componentInstance;
      pasoCompleto = [];
      component.stepCompleted.subscribe((completo) => pasoCompleto.push(completo));
      fixture.componentRef.setInput('viewMode', true);
      fixture.componentRef.setInput('contratoGeneral', contrato);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('en visualización marca el paso como completo con las cláusulas cargadas', async () => {
      await montar({ Success: true, Data: [clausula] });
      expect(pasoCompleto).toContain(true);
    });

    it('carga las cláusulas en solo lectura aunque sean editables', async () => {
      await montar({ Success: true, Data: [clausula] });
      expect(component.clausulas.length).toBe(1);
      expect(component.form.disabled).toBe(true);
      expect(component.isClausulaEditable(0)).toBe(false);
      expect(component.isParagrafoEditable(0, 0)).toBe(false);
    });

    it('oculta guardar cláusula, cláusula especial y guardar y continuar', async () => {
      await montar({ Success: true, Data: [clausula] });
      esperarSinAccionesDeEdicion(fixture);
    });

    it('no crea el contrato desde la plantilla cuando no existe', async () => {
      await montar({ Success: false, Data: [] });
      expect(clausulasService.get).toHaveBeenCalledTimes(1);
      expect(clausulasService.post).not.toHaveBeenCalled();
    });

    it('la vista previa de la minuta no ofrece guardar el documento', async () => {
      await montar({ Success: true, Data: [clausula] });
      await component.openPdfViewer();
      expect(dialog.open).toHaveBeenCalledWith(
        PdfViewerModalComponent,
        expect.objectContaining({ data: expect.objectContaining({ datos: null }) })
      );
    });
  });

  describe('PasoDocumentosComponent', () => {
    let fixture: ComponentFixture<PasoDocumentosComponent>;
    let component: PasoDocumentosComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        declarations: [PasoDocumentosComponent],
        providers: [
          { provide: AlertService, useValue: alertServiceMock() },
          { provide: MatDialog, useValue: { open: jest.fn() } },
          { provide: GestorDocumentalService, useValue: {} },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      });
      fixture = TestBed.createComponent(PasoDocumentosComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('viewMode', true);
      fixture.detectChanges();
    });

    it('deshabilita el formulario y oculta la carga de archivos y el guardado', () => {
      expect(component.form.disabled).toBe(true);
      esperarSinAccionesDeEdicion(fixture);
    });
  });
});

/** Renderiza el contenido que RegistroContratoComponent entrega a la plantilla. */
@Component({
  selector: 'plantilla-tarjeta-contenedora',
  template: '<span class="titulo">{{ title }}</span><ng-container *ngTemplateOutlet="contenido"></ng-container>',
  standalone: false,
})
class PlantillaTarjetaContenedoraStubComponent {
  @Input() title = '';
  @Input() contenido!: TemplateRef<unknown>;
}

describe('RegistroContratoComponent en modo visualización', () => {
  let fixture: ComponentFixture<RegistroContratoComponent>;

  beforeEach(() => {
    jest.spyOn(RegistroContratoComponent.prototype, 'ngAfterViewInit').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [RegistroContratoComponent, PlantillaTarjetaContenedoraStubComponent],
      providers: [
        { provide: AlertService, useValue: alertServiceMock() },
        {
          provide: ContratoGeneralCrudService,
          useValue: { get: jest.fn().mockReturnValue(of({ Success: true, Data: contrato })) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(RegistroContratoComponent);
    fixture.componentRef.setInput('viewMode', true);
    fixture.componentRef.setInput('contratoGeneralId', 42);
    fixture.detectChanges();
  });

  afterEach(() => jest.restoreAllMocks());

  it('muestra el título de detalle', () => {
    const titulo = fixture.nativeElement.querySelector('.titulo') as HTMLElement;
    expect(titulo.textContent).toBe('Detalle del Contrato');
  });

  it('propaga viewMode y el contrato a cada paso', () => {
    const selectores = [
      'app-paso-info-general',
      'app-paso-info-presupuestal',
      'app-paso-supervisores',
      'app-paso-contratistas',
      'app-paso-obligaciones',
      'app-paso-especificaciones',
      'app-paso-garantias',
      'app-paso-clausulas-paragrafos',
    ];
    for (const selector of selectores) {
      const paso = fixture.nativeElement.querySelector(selector);
      expect({ selector, viewMode: paso?.viewMode }).toEqual({ selector, viewMode: true });
      expect({ selector, id: paso?.contratoGeneral?.id }).toEqual({ selector, id: 42 });
    }
  });
});
