import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParametrosService } from 'src/app/services/parametros.service';
import { CdpsService } from 'src/app/services/cdps.service';
import { PasoClausulasParagrafosComponent } from './paso-clausulas-paragrafos.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { of } from 'rxjs';

describe('PasoClausulasParagrafosComponent', () => {
  let component: PasoClausulasParagrafosComponent;
  let fixture: ComponentFixture<PasoClausulasParagrafosComponent>;
  let mockCdpsService: any;

  beforeEach(() => {
    mockCdpsService = {
      getLocalCDP: jest.fn().mockReturnValue([]),
      cdp$: of([]),
    };

    TestBed.configureTestingModule({
      declarations: [PasoClausulasParagrafosComponent],
      providers: [
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
});
