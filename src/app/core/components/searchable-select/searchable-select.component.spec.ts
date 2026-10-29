import { SimpleChange } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SearchableSelectComponent } from './searchable-select.component';

describe('SearchableSelectComponent', () => {
  const opciones = [
    { Id: 1, Nombre: 'Primera' },
    { Id: 2, Nombre: 'Segunda' },
  ];

  function crear(soloLectura: boolean, control: FormControl) {
    const componente = new SearchableSelectComponent();
    componente.control = control;
    componente.soloLectura = soloLectura;
    return componente;
  }

  function recibirOpciones(componente: SearchableSelectComponent, items: typeof opciones) {
    componente.items = items;
    componente.ngOnChanges({ items: new SimpleChange(undefined, items, false) });
  }

  it('sin soloLectura habilita el control cuando llegan varias opciones', () => {
    const control = new FormControl<number | null>({ value: 2, disabled: true });
    recibirOpciones(crear(false, control), opciones);
    expect(control.enabled).toBe(true);
  });

  it('en soloLectura las opciones que llegan no reactivan el control', () => {
    const control = new FormControl<number | null>({ value: 2, disabled: true });
    recibirOpciones(crear(true, control), opciones);
    expect(control.disabled).toBe(true);
    expect(control.value).toBe(2);
  });

  it('en soloLectura una única opción no reemplaza el valor guardado', () => {
    const control = new FormControl<number | null>({ value: 9, disabled: true });
    recibirOpciones(crear(true, control), [opciones[0]]);
    expect(control.value).toBe(9);
    expect(control.disabled).toBe(true);
  });

  it('al activar soloLectura deshabilita el control', () => {
    const control = new FormControl<number | null>(2);
    const componente = crear(true, control);
    componente.ngOnChanges({ soloLectura: new SimpleChange(false, true, false) });
    expect(control.disabled).toBe(true);
  });
});
