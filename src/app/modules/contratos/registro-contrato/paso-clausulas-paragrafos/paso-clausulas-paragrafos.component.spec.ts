import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PasoClausulasParagrafosComponent } from './paso-clausulas-paragrafos.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { of } from 'rxjs';

describe('PasoClausulasParagrafosComponent', () => {
  let component: PasoClausulasParagrafosComponent;
  let fixture: ComponentFixture<PasoClausulasParagrafosComponent>;

  beforeEach(() => {
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
});
