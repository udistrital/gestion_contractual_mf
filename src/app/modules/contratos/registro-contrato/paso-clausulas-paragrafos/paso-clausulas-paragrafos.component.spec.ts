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
});
