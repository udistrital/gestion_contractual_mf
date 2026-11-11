import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParametrosService } from 'src/app/services/parametros.service';
import { CdpsService } from 'src/app/services/cdps.service';
import { ClausulasParagrafosService } from 'src/app/services/clausulas-paragrafos.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { AlertService } from 'src/app/services/alert.service';
import { MinutasMidService } from 'src/app/services/minuta-mid.service';
import { MatDialog } from '@angular/material/dialog';
import { PasoClausulasParagrafosComponent } from './paso-clausulas-paragrafos.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { Subject, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PdfViewerModalComponent } from '../pdf-viewer-modal/pdf-viewer-modal.component';
import { ErrorMinuta } from 'src/app/types/types';

const PDF = btoa('%PDF-1.4\n%%EOF\n');
const GUARDADO_FALLIDO =
  'No se pudieron guardar las cláusulas. La minuta no se generó para no mostrar datos desactualizados.';

describe('PasoClausulasParagrafosComponent', () => {
  let component: PasoClausulasParagrafosComponent;
  let fixture: ComponentFixture<PasoClausulasParagrafosComponent>;
  let mockCdpsService: any;
  let mockAlertService: any;
  let mockMinutasMidService: any;
  let mockDialog: any;

  beforeEach(() => {
    mockCdpsService = {
      getLocalCDP: jest.fn().mockReturnValue([]),
      cdp$: of([]),
    };

    mockAlertService = {
      showAlert: jest.fn(),
      showSuccessAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
      showErrorAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
      showConfirmAlert: jest.fn().mockResolvedValue({ isConfirmed: true }),
    };

    mockMinutasMidService = {
      getMinutaPdf: jest.fn().mockReturnValue(of(PDF)),
    };

    mockDialog = {
      open: jest.fn(),
    };

    TestBed.configureTestingModule({
      declarations: [PasoClausulasParagrafosComponent],
      providers: [
        {
          provide: AlertService,
          useValue: mockAlertService,
        },
        {
          provide: MinutasMidService,
          useValue: mockMinutasMidService,
        },
        {
          provide: MatDialog,
          useValue: mockDialog,
        },
        {
          provide: ParametrosService,
          useValue: {
            get: () => of({ Status: '200', Data: [] }),
            post: () => of({ Status: '200' }),
          },
        },
        {
          provide: CdpsService,
          useValue: mockCdpsService,
        },
        {
          provide: MatStepper,
          useValue: { _getStepLabelId: () => '', steps: { toArray: () => [] } },
        },
        {
          provide: ClausulasParagrafosService,
          useValue: {
            get: jest.fn().mockReturnValue(of({ Success: true, Data: [] })),
            post: jest.fn().mockReturnValue(of({ Success: true, Data: {} })),
            put: jest.fn().mockReturnValue(of({ Success: true, Data: {} })),
            delete: jest.fn().mockReturnValue(of({ Success: true, Data: {} })),
          },
        },
        {
          provide: ContratoGeneralCrudService,
          useValue: {
            getEstados: jest.fn().mockReturnValue(
              of({ Success: true, Status: '200', Data: [{ id: 1, estado_interno_parametro_id: 1 }] })
            ),
            getEspecificacionesTecnicas: jest.fn().mockReturnValue(of({ Success: true, Data: [] })),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PasoClausulasParagrafosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe filtrar cláusulas según texto ingresado y permitir limpiar el filtro', () => {
    component.indices = [
      { Id: '1', Nombre: 'PRIMERA' },
      { Id: '2', Nombre: 'SEGUNDA' },
    ];
    component.clausulas.push(
      (component as any).crearClausulaFormGroup(
        {
          nombre: 'Objeto Contractual',
          descripcion: 'El contratista se compromete...',
          predeterminado: true,
          es_editable: false,
          paragrafos: [],
        },
        '1'
      )
    );
    component.clausulas.push(
      (component as any).crearClausulaFormGroup(
        {
          nombre: 'Plazo y Vigencia',
          descripcion: 'El plazo de ejecución...',
          predeterminado: false,
          es_editable: true,
          paragrafos: [],
        },
        '2'
      )
    );

    component.filtroClausulas = 'vigencia';
    expect(component.clausulasFiltradas.length).toBe(1);
    expect(component.clausulasFiltradas[0].control.get('nombre')?.value).toBe(
      'Plazo y Vigencia'
    );

    component.limpiarFiltro();
    expect(component.filtroClausulas).toBe('');
    expect(component.clausulasFiltradas.length).toBe(2);
  });

  it('debe seleccionar cláusula directamente si la actual no tiene modificaciones', () => {
    component.clausulaSeleccionadaIndex = 0;
    component.seleccionarClausula(1);
    expect(component.clausulaSeleccionadaIndex).toBe(1);
  });

  it('debe obtener el título compuesto de una cláusula', () => {
    component.indices = [{ Id: 'idx-1', Nombre: 'PRIMERA' }];
    component.clausulas.push(
      (component as any).crearClausulaFormGroup(
        {
          nombre: 'Objeto Contractual',
          descripcion: 'Texto descriptivo',
          predeterminado: true,
          es_editable: false,
          paragrafos: [],
        },
        'idx-1'
      )
    );

    const titulo = component.getTituloClausula(0);
    expect(titulo).toBe('PRIMERA: Objeto Contractual');
  });

  it('debe retornar clausulaActual según clausulaSeleccionadaIndex', () => {
    component.clausulas.push(
      (component as any).crearClausulaFormGroup(
        {
          nombre: 'Objeto Contractual',
          descripcion: 'Texto descriptivo',
          predeterminado: true,
          es_editable: false,
          paragrafos: [],
        },
        'idx-1'
      )
    );

    component.clausulaSeleccionadaIndex = 0;
    expect(component.clausulaActual).toBeTruthy();
    expect(component.clausulaActual?.get('nombre')?.value).toBe(
      'Objeto Contractual'
    );

    component.clausulaSeleccionadaIndex = 999;
    expect(component.clausulaActual).toBeNull();
  });

  describe('getIndicesDisponibles', () => {
    beforeEach(() => {
      component.indices = [
        { Id: '1', Nombre: 'CLÁUSULA PRIMERA' },
        { Id: '2', Nombre: 'CLÁUSULA SEGUNDA' },
        { Id: '3', Nombre: 'CLÁUSULA TERCERA' },
        { Id: '4', Nombre: 'CLÁUSULA CUARTA' },
        { Id: '5', Nombre: 'CLÁUSULA QUINTA' },
      ];
      component.clausulas.clear();
      // Cláusula 0: asignada a '1'
      component.clausulas.push(
        (component as any).crearClausulaFormGroup(
          { nombre: 'C1', descripcion: 'D1', predeterminado: true, es_editable: true, paragrafos: [] },
          '1'
        )
      );
      // Cláusula 1: asignada a '2'
      component.clausulas.push(
        (component as any).crearClausulaFormGroup(
          { nombre: 'C2', descripcion: 'D2', predeterminado: true, es_editable: true, paragrafos: [] },
          '2'
        )
      );
      // Cláusula 2: asignada a '4'
      component.clausulas.push(
        (component as any).crearClausulaFormGroup(
          { nombre: 'C3', descripcion: 'D3', predeterminado: true, es_editable: true, paragrafos: [] },
          '4'
        )
      );
    });

    it('debe excluir de la lista desplegable los índices ya seleccionados por otras cláusulas', () => {
      // Para la Cláusula 2 (que tiene el índice '4'):
      // Las otras cláusulas tienen '1' y '2'. Por tanto, '1' y '2' no deben aparecer.
      // Deben aparecer '3' (libre), '4' (su propio índice) y '5' (libre).
      const disponibles = component.getIndicesDisponibles(2);
      const idsDisponibles = disponibles.map((i) => i.Id);

      expect(idsDisponibles).toContain('4');
      expect(idsDisponibles).toContain('3');
      expect(idsDisponibles).toContain('5');
      expect(idsDisponibles).not.toContain('1');
      expect(idsDisponibles).not.toContain('2');
    });

    it('debe permitir ver todos los índices libres si la cláusula aún no tiene índice asignado', () => {
      // Nueva cláusula 3 sin índice
      component.clausulas.push(
        (component as any).crearClausulaFormGroup(
          { nombre: 'C4', descripcion: 'D4', predeterminado: false, es_editable: true, paragrafos: [] },
          ''
        )
      );

      const disponibles = component.getIndicesDisponibles(3);
      const idsDisponibles = disponibles.map((i) => i.Id);

      // '1', '2' y '4' están ocupados por las cláusulas 0, 1 y 2
      expect(idsDisponibles).not.toContain('1');
      expect(idsDisponibles).not.toContain('2');
      expect(idsDisponibles).not.toContain('4');
      // '3' y '5' están libres
      expect(idsDisponibles).toContain('3');
      expect(idsDisponibles).toContain('5');
    });

    it('debe retornar lista vacía si no hay catálogo de índices', () => {
      component.indices = [];
      expect(component.getIndicesDisponibles(0)).toEqual([]);
    });
  });

  describe('renderizarDescripcionClausula', () => {
    it('debe interpolar el objeto y las actividades del contrato', () => {
      fixture.componentRef.setInput('contratoGeneral', {
        objeto: 'Prestar servicios de soporte técnico a la OATI.',
        actividades: '01. Mantenimiento correctivo.\n\n02. Mantenimiento preventivo.',
        unidad_ejecutora_id: 1,
      });

      const raw = 'CLÁUSULA: Objeto: {{objeto}}. Actividades: {{actividades}}';
      const renderedSafe: any = component.renderizarDescripcionClausula(raw);
      // Extraer string sanitizado
      const renderedStr = renderedSafe.changingThisBreaksApplicationSecurity || renderedSafe.toString();

      expect(renderedStr).toContain('Prestar servicios de soporte técnico a la OATI.');
      expect(renderedStr).toContain('01. Mantenimiento correctivo.');
      expect(renderedStr).toContain('02. Mantenimiento preventivo.');
      expect(renderedStr).not.toContain('{{objeto}}');
      expect(renderedStr).not.toContain('{{actividades}}');
    });

    it('debe renderizar tabla de especificaciones técnicas si existen y omitir bloque jinja si no existen', () => {
      const plantillaRaw =
        '{{objeto}}{% if especificaciones %}{% for especificacion in especificaciones %}{% endfor %}\nITEM DESCRIPCIÓN\n{% endif %}';

      // 1. Caso sin especificaciones
      component.especificacionesList = [];
      const resSinEsp: any = component.renderizarDescripcionClausula(plantillaRaw);
      const strSinEsp = resSinEsp.changingThisBreaksApplicationSecurity || resSinEsp.toString();
      expect(strSinEsp).not.toContain('{% if especificaciones %}');
      expect(strSinEsp).not.toContain('ITEM DESCRIPCIÓN');

      // 2. Caso con especificaciones
      component.especificacionesList = [
        {
          id: 1,
          descripcion: 'Licencia de software',
          cantidad: 2,
          valor_unitario: 5000000,
          valor_total: 10000000,
        },
      ];
      const resConEsp: any = component.renderizarDescripcionClausula(plantillaRaw);
      const strConEsp = resConEsp.changingThisBreaksApplicationSecurity || resConEsp.toString();
      expect(strConEsp).toContain('table-minuta-render');
      expect(strConEsp).toContain('Licencia de software');
      expect(strConEsp).toContain('TOTAL ESPECIFICACIONES:');
    });

    it('debe renderizar cláusula presupuestal en singular cuando hay un solo CDP', () => {
      mockCdpsService.getLocalCDP.mockReturnValue([
        {
          vigencia: '2024',
          numero_disponibilidad: '845',
          descripcion: 'SERVICIOS PERSONALES',
          valor_contratacion: 150000000,
          valor_a_tomar: 150000000,
        },
      ]);
      fixture.componentRef.setInput('contratoGeneral', {
        valor_pesos: 150000000,
        unidad_ejecutora_id: 1,
      });

      const plantillaRaw =
        'El valor corresponde a {{valorTexto}} ($ {{valorPesos}}). LA UNIVERSIDAD pagará con cargo al certificado de Disponibilidad Presupuestal No. {{numero_cdp_id}} del año {{vigencia_cdp}}. Rubro: {{rubro_cdp}}. El presente Contrato está sujeto a registro presupuestal.';

      const res: any = component.renderizarDescripcionClausula(plantillaRaw);
      const str = res.changingThisBreaksApplicationSecurity || res.toString();

      expect(str).toContain('845');
      expect(str).toContain('2024');
      expect(str).toContain('SERVICIOS PERSONALES');
      expect(str).toContain('150.000.000');
      expect(str).not.toContain('{{numero_cdp_id}}');
      expect(str).not.toContain('{{vigencia_cdp}}');
      expect(str).not.toContain('{{rubro_cdp}}');
    });

    it('debe estructurar cláusula presupuestal en plural con tabla detallada cuando hay múltiples CDPs', () => {
      const multiplesCdps = [
        {
          vigencia: '2024',
          numero_disponibilidad: '101',
          descripcion: 'RUBRO INFRAESTRUCTURA',
          valor_contratacion: 60000000,
          valor_a_tomar: 60000000,
        },
        {
          vigencia: '2024',
          numero_disponibilidad: '102',
          descripcion: 'RUBRO TECNOLOGÍA',
          valor_contratacion: 40000000,
          valor_a_tomar: 40000000,
        },
      ];

      mockCdpsService.getLocalCDP.mockReturnValue(multiplesCdps);
      fixture.componentRef.setInput('contratoGeneral', {
        valor_pesos: 100000000,
        unidad_ejecutora_id: 1,
      });

      const plantillaRaw =
        'El valor corresponde a {{valorTexto}} ($ {{valorPesos}}). LA UNIVERSIDAD pagará a EL CONTRATISTA el valor del presente Contrato con cargo al certificado de Disponibilidad Presupuestal No. {{numero_cdp_id}} del año {{vigencia_cdp}}. Rubro: {{rubro_cdp}}. El presente Contrato está sujeto a registro presupuestal y el pago de su valor a las apropiaciones presupuestales.';

      const res: any = component.renderizarDescripcionClausula(plantillaRaw);
      const str = res.changingThisBreaksApplicationSecurity || res.toString();

      // Debe adaptar la redacción a plural
      expect(str).toContain('con cargo a los siguientes Certificados de Disponibilidad Presupuestal:');
      // Debe incluir la tabla institucional de CDPs
      expect(str).toContain('table-cdps');
      expect(str).toContain('101');
      expect(str).toContain('102');
      expect(str).toContain('RUBRO INFRAESTRUCTURA');
      expect(str).toContain('RUBRO TECNOLOGÍA');
      expect(str).toContain('TOTAL PRESUPUESTADO:');
      expect(str).toContain('100.000.000');
    });
  });

  describe('Precarga de Cláusulas Guardadas en Editar Contrato', () => {
    it('debe solicitar contratos/:id y poblar clausulas cuando contratoGeneral se proporciona con ID', () => {
      const clausulasMock = [
        {
          _id: 'c-1',
          nombre: 'OBJETO CONTRACTUAL',
          descripcion: 'El contratista se obliga...',
          predeterminado: true,
          es_editable: false,
          paragrafos: [
            {
              _id: 'p-1',
              nombre: 'PARÁGRAFO 1',
              descripcion: 'Detalle del objeto',
              predeterminado: false,
              es_editable: true,
            },
          ],
        },
        {
          _id: 'c-2',
          nombre: 'VALOR DEL CONTRATO',
          descripcion: 'El valor asciende a...',
          predeterminado: true,
          es_editable: true,
          paragrafos: [],
        },
      ];

      const clausulasService = TestBed.inject(ClausulasParagrafosService);
      (clausulasService.get as jest.Mock).mockImplementation((url: string) => {
        if (url === 'contratos/2') {
          return of({ Success: true, Data: clausulasMock });
        }
        return of({ Success: true, Data: [] });
      });

      fixture.componentRef.setInput('contratoGeneral', {
        id: 2,
        tipo_contrato_id: 1,
        unidad_ejecutora_id: 6818,
      });
      fixture.detectChanges();

      expect(component.contratoId).toBe(2);
      expect(component.clausulas.length).toBe(2);
      expect(component.clausulas.at(0).get('nombre')?.value).toBe('OBJETO CONTRACTUAL');
      expect(component.clausulas.at(1).get('nombre')?.value).toBe('VALOR DEL CONTRATO');
      expect(component.clausulaSeleccionadaIndex).toBe(0);
    });

    it('debe manejar respuestas directas de tipo arreglo sin propiedad Success en contratos/:id', () => {
      const clausulasMock = [
        {
          _id: 'c-100',
          nombre: 'CLÁUSULA ESPECIAL AUDITORÍA',
          descripcion: 'Condiciones de auditoría',
          predeterminado: false,
          es_editable: true,
          paragrafos: [],
        },
      ];

      const clausulasService = TestBed.inject(ClausulasParagrafosService);
      (clausulasService.get as jest.Mock).mockImplementation((url: string) => {
        if (url === 'contratos/15') {
          return of(clausulasMock); // Retorno directo como array
        }
        return of([]);
      });

      fixture.componentRef.setInput('contratoGeneral', {
        id: 15,
        tipo_contrato_id: 2,
        unidad_ejecutora_id: 6818,
      });
      fixture.detectChanges();

      expect(component.contratoId).toBe(15);
      expect(component.clausulas.length).toBe(1);
      expect(component.clausulas.at(0).get('nombre')?.value).toBe('CLÁUSULA ESPECIAL AUDITORÍA');
    });

    it('debe cargar cláusulas predeterminadas oficiales cuando el contrato no tiene cláusulas ni plantilla en backend', () => {
      const clausulasService = TestBed.inject(ClausulasParagrafosService);
      (clausulasService.get as jest.Mock).mockReturnValue(of({ Success: true, Data: [] }));

      fixture.componentRef.setInput('contratoGeneral', {
        id: 99,
        tipo_contrato_id: 1,
        unidad_ejecutora_id: 6818,
      });
      fixture.detectChanges();

      expect(component.contratoId).toBe(99);
      expect(component.clausulas.length).toBe(11);
      expect(component.clausulas.at(0).get('nombre')?.value).toBe('OBJETO CONTRACTUAL');
      expect(component.clausulas.at(3).get('nombre')?.value).toContain('VALOR DEL CONTRATO');
      expect(component.clausulaSeleccionadaIndex).toBe(0);

      // Verificar que se guardaron en caché local para persistencia
      const cached = localStorage.getItem('clausulas_contrato_99');
      expect(cached).toBeTruthy();
      const parsed = JSON.parse(cached!);
      expect(parsed.length).toBe(11);
    });

    it('debe permitir guardar una cláusula y persistir los cambios', () => {
      component.contratoId = 50;
      component.clausulas.push(
        (component as any).crearClausulaFormGroup(
          {
            _id: 'c-test-50',
            nombre: 'CLÁUSULA DE PRUEBA',
            descripcion: 'Descripción inicial',
            predeterminado: false,
            es_editable: true,
            paragrafos: [],
          },
          '1'
        )
      );

      const clausula0 = component.clausulas.at(0) as any;
      clausula0.get('descripcion')?.setValue('Descripción modificada por el usuario');
      clausula0.get('descripcion')?.markAsDirty();

      component.ejecutarGuardarClausula(0);

      expect(clausula0.get('descripcion')?.dirty).toBe(false);
      const cached = localStorage.getItem('clausulas_contrato_50');
      expect(cached).toBeTruthy();
      expect(cached).toContain('Descripción modificada por el usuario');
    });

    it('debe alertar si se intenta abrir el visor PDF sin contratoGeneral id válido', async () => {
      component.contratoId = 0;
      fixture.componentRef.setInput('contratoGeneral', undefined);
      await component.openPdfViewer();
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(
        expect.stringContaining('No se ha guardado el contrato general')
      );
    });

    it('debe solicitar la minuta con el id del contrato y abrir el diálogo modal', async () => {
      fixture.componentRef.setInput('contratoGeneral', { id: 2 } as any);
      const minutasMidService = TestBed.inject(MinutasMidService);
      const dialog = TestBed.inject(MatDialog);

      await component.openPdfViewer();

      expect(minutasMidService.getMinutaPdf).toHaveBeenCalledWith(2);
      expect(dialog.open).toHaveBeenCalled();
    });
  });

  describe('Vista previa de la minuta (#405)', () => {
    let clausulasService: Record<string, jest.Mock>;
    let dialog: { open: jest.Mock };

    const error422: ErrorMinuta = {
      status: 422,
      tipo: 'faltan-datos',
      mensaje: 'Faltan datos para generar la minuta: ordenador del gasto.',
      reintentable: true,
      faltantes: ['ordenador'],
    };

    const botonesVistaPrevia = (): HTMLButtonElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll('button.preview-btn, button.dock-btn-preview'));

    beforeEach(() => {
      clausulasService = TestBed.inject(ClausulasParagrafosService) as unknown as Record<string, jest.Mock>;
      dialog = TestBed.inject(MatDialog) as unknown as { open: jest.Mock };
      fixture.componentRef.setInput('contratoGeneral', { id: 2 } as any);
      component.contratoId = 2;
      mockAlertService.showErrorAlert.mockClear();
      dialog.open.mockClear();
    });

    it('abre el modal "Minuta preliminar" solo con el PDF de getMinutaPdf', async () => {
      await component.openPdfViewer();

      expect(mockMinutasMidService.getMinutaPdf).toHaveBeenCalledWith(2);
      expect(dialog.open).toHaveBeenCalledTimes(1);
      const [modal, config] = dialog.open.mock.calls[0];
      expect(modal).toBe(PdfViewerModalComponent);
      expect(config.data.titulo).toBe('Minuta preliminar');
      expect(config.data.file).toBeInstanceOf(Blob);
      expect(config.data.datos).toEqual(expect.objectContaining({ base64: PDF, contrato_general_id: 2 }));
      expect(mockAlertService.showErrorAlert).not.toHaveBeenCalled();
      expect(component.generandoMinuta).toBe(false);
    });

    it('guarda las cláusulas antes de generar, sin la alerta genérica de error HTTP', async () => {
      await component.openPdfViewer();

      expect(clausulasService['put']).toHaveBeenCalledWith('contratos/2', expect.any(Object), 'todos');
      expect(clausulasService['put'].mock.invocationCallOrder[0]).toBeLessThan(
        mockMinutasMidService.getMinutaPdf.mock.invocationCallOrder[0]
      );
    });

    it('ante un ErrorMinuta muestra su mensaje, no abre el modal y libera los botones', async () => {
      mockMinutasMidService.getMinutaPdf.mockReturnValueOnce(throwError(() => error422));

      await component.openPdfViewer();

      expect(mockAlertService.showErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(error422.mensaje);
      expect(dialog.open).not.toHaveBeenCalled();
      expect(component.generandoMinuta).toBe(false);
    });

    it('ante un error que no es de la minuta muestra un texto genérico, nunca el técnico', async () => {
      mockMinutasMidService.getMinutaPdf.mockReturnValueOnce(
        throwError(() => new Error("Failed to execute 'atob' on 'Window'"))
      );

      await component.openPdfViewer();

      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith('No se pudo generar la minuta. Intente de nuevo.');
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('deshabilita los dos botones con "Generando minuta…" mientras dura la petición', async () => {
      const respuesta = new Subject<string>();
      mockMinutasMidService.getMinutaPdf.mockReturnValueOnce(respuesta);

      const pendiente = component.openPdfViewer();
      await Promise.resolve();
      await Promise.resolve();
      fixture.detectChanges();

      expect(component.generandoMinuta).toBe(true);
      expect(botonesVistaPrevia().length).toBe(2);
      for (const boton of botonesVistaPrevia()) {
        expect(boton.disabled).toBe(true);
        expect(boton.textContent).toContain('Generando minuta…');
      }

      respuesta.next(PDF);
      respuesta.complete();
      await pendiente;
      fixture.detectChanges();

      expect(component.generandoMinuta).toBe(false);
      for (const boton of botonesVistaPrevia()) {
        expect(boton.disabled).toBe(false);
        expect(boton.textContent).not.toContain('Generando minuta…');
      }
    });

    it('no pide otra minuta mientras hay una en curso', async () => {
      const respuesta = new Subject<string>();
      mockMinutasMidService.getMinutaPdf.mockReturnValueOnce(respuesta);

      const primera = component.openPdfViewer();
      await Promise.resolve();
      await Promise.resolve();
      await component.openPdfViewer();
      respuesta.next(PDF);
      respuesta.complete();
      await primera;

      expect(mockMinutasMidService.getMinutaPdf).toHaveBeenCalledTimes(1);
      expect(dialog.open).toHaveBeenCalledTimes(1);
    });

    it('si falla el guardado previo no genera la minuta y deja una sola alerta', async () => {
      clausulasService['put'].mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 400, error: { Success: false, Status: 400 } }))
      );
      clausulasService['post'].mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 409, error: { Success: false, Status: 409 } }))
      );

      await component.openPdfViewer();

      expect(clausulasService['post']).toHaveBeenCalledWith('contratos/2', expect.any(Object), 'todos');
      expect(mockMinutasMidService.getMinutaPdf).not.toHaveBeenCalled();
      expect(dialog.open).not.toHaveBeenCalled();
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(GUARDADO_FALLIDO);
      expect(component.generandoMinuta).toBe(false);
    });

    it('si el POST de respaldo responde sin éxito tampoco genera la minuta', async () => {
      clausulasService['put'].mockReturnValueOnce(of({ Success: false }));
      clausulasService['post'].mockReturnValueOnce(of({ Success: false }));

      await component.openPdfViewer();

      expect(mockMinutasMidService.getMinutaPdf).not.toHaveBeenCalled();
      expect(mockAlertService.showErrorAlert).toHaveBeenCalledWith(GUARDADO_FALLIDO);
      expect(component.generandoMinuta).toBe(false);
    });

    it('si el PUT falla pero el POST guarda, genera la minuta', async () => {
      clausulasService['put'].mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 400, error: { Success: false, Status: 400 } }))
      );

      await component.openPdfViewer();

      expect(mockMinutasMidService.getMinutaPdf).toHaveBeenCalledWith(2);
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(mockAlertService.showErrorAlert).not.toHaveBeenCalled();
    });
  });
});
