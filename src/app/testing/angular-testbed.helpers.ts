import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CdkStepper } from '@angular/cdk/stepper';
import { MaterialModule } from '../shared/modules/material.module';

/**
 * Imports/schemas comunes para TestBed de componentes `standalone:false` del
 * módulo de pólizas y amparos. Replica el patrón ya usado en
 * `registro-poliza.component.spec.ts`: declarar el componente (no
 * importarlo, porque no es standalone) e ignorar los hijos custom via
 * CUSTOM_ELEMENTS_SCHEMA en vez de declarar toda la cascada de componentes
 * anidados.
 */
export const commonPolizasTestImports = [
  CommonModule,
  MaterialModule,
  ReactiveFormsModule,
  NoopAnimationsModule,
];

export const commonPolizasTestSchemas = [CUSTOM_ELEMENTS_SCHEMA];

export function mockMatSnackBar() {
  return { open: jest.fn() };
}

export function mockMatDialog() {
  return {
    open: jest.fn().mockReturnValue({
      afterClosed: () => ({ subscribe: (fn: (v: unknown) => void) => fn(null) }),
    }),
  };
}

/**
 * Los pasos del stepper de registro-contrato usan `matStepperPrevious`/
 * `matStepperNext` en su template, directivas de `@angular/cdk/stepper` que
 * requieren un `CdkStepper` ancestro. Al montar el paso de forma aislada (sin
 * `<mat-stepper>` real alrededor) hay que proveerlo explícitamente o el
 * TestBed falla con `NG0201: No provider found for _CdkStepper`.
 */
export function cdkStepperTestProvider() {
  return { provide: CdkStepper, useValue: { next: jest.fn(), previous: jest.fn() } };
}
