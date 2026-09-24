import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroPolizaComponent } from './registro-poliza.component';
import { PlantillaTarjetaContenedoraComponent } from '../../../shared/templates/plantilla-tarjeta-contenedora/plantilla-tarjeta-contenedora.component';
import { MaterialModule } from '../../../shared/modules/material.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('RegistroPolizaComponent', () => {
  let component: RegistroPolizaComponent;
  let fixture: ComponentFixture<RegistroPolizaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistroPolizaComponent, PlantillaTarjetaContenedoraComponent],
      imports: [CommonModule, MaterialModule, ReactiveFormsModule, NoopAnimationsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroPolizaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente el componente de registro', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar los 8 grupos de formulario del stepper', () => {
    expect(component.firstFormGroup).toBeDefined();
    expect(component.secondFormGroup).toBeDefined();
    expect(component.thirdFormGroup).toBeDefined();
    expect(component.fourthFormGroup).toBeDefined();
    expect(component.fifthFormGroup).toBeDefined();
    expect(component.sixthFormGroup).toBeDefined();
    expect(component.seventhFormGroup).toBeDefined();
    expect(component.eighthFormGroup).toBeDefined();
  });
});
