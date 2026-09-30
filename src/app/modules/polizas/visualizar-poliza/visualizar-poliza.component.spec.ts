import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisualizarPolizaComponent, ContratoPoliza } from './visualizar-poliza.component';
import { PlantillaTarjetaContenedoraComponent } from '../../../shared/templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component';
import { MaterialModule } from '../../../shared/modules/material.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

describe('VisualizarPolizaComponent', () => {
  let component: VisualizarPolizaComponent;
  let fixture: ComponentFixture<VisualizarPolizaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisualizarPolizaComponent, PlantillaTarjetaContenedoraComponent],
      imports: [CommonModule, MaterialModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizarPolizaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar la tabla con contratos y columnas configuradas', () => {
    expect(component.displayedColumns).toEqual(['contratoId', 'tienePoliza', 'amparos', 'detalles']);
    expect(component.dataSource.data.length).toBeGreaterThan(0);
    expect(component.dataSource.data[0].contratoId).toBe('2024-001');
  });

  it('debe permitir invocar el método verDetalles sin errores', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const mockContrato: ContratoPoliza = {
      contratoId: '2024-001',
      tienePoliza: true,
      amparos: ['Fuerza Mayor']
    };

    component.verDetalles(mockContrato);
    expect(consoleSpy).toHaveBeenCalledWith('Ver detalles del contrato:', mockContrato);
    consoleSpy.mockRestore();
  });
});
