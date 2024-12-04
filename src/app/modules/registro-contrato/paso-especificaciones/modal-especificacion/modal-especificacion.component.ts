import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EspecificacionTecnica } from 'src/app/types/types';

@Component({
  selector: 'app-modal-especificacion',
  templateUrl: './modal-especificacion.component.html',
  styleUrls: ['./modal-especificacion.component.css'],
})
export class ModalEspecificacionComponent implements OnInit {
  formEspecificacion!: FormGroup;
  especificacionOriginal!: EspecificacionTecnica;
  guardarHabilitado: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ModalEspecificacionComponent>,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.iniciarFormEspecificacion();
    if (this.data && this.data.especificacion) {
      this.especificacionOriginal = { ...this.data.especificacion };
      this.formEspecificacion.patchValue(this.data.especificacion);
      this.escucharCambiosFormulario();
    } else {
      this.guardarHabilitado = true;
    }
  }

  iniciarFormEspecificacion() {
    this.formEspecificacion = this.fb.group({
      id: [null],
      descripcion: ['', Validators.required],
      cantidad: ['', Validators.required],
      valorUnitario: ['', Validators.required],
      valorTotal: ['', Validators.required],
    });
  }

  validarInput(event: Event, controlName: string) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    let validValue: string | null = null;

    if (controlName === 'cantidad') {
      validValue = value.match(/^\d+/)?.[0] || ''; // Captura solo los dígitos iniciales
    } else {
      validValue = value.match(/^\d+(\.\d{0,2})?/)?.[0] || ''; // Captura hasta dos decimales
    }

    // Si el valor válido es diferente al valor original, actualizar el valor en el input
    if (validValue !== value) {
      inputElement.value = validValue;
      this.formEspecificacion.get(controlName)?.setValue(validValue);
    }
  }

  escucharCambiosFormulario() {
    this.formEspecificacion.valueChanges.subscribe((valoresActuales) => {
      this.guardarHabilitado = !this.objetosIguales(
        this.especificacionOriginal,
        valoresActuales
      );
    });
  }

  guardarEspecificacion() {
    if (this.formEspecificacion.valid) {
      const especificacionGuardada = this.formEspecificacion.value;
      this.dialogRef.close(especificacionGuardada); // Enviar los datos al componente principal
    }
  }

  private normalizarValores(obj: any): any {
    const objNormalizado: any = { ...obj };
    if (objNormalizado.cantidad !== undefined) {
      objNormalizado.cantidad = parseFloat(objNormalizado.cantidad);
    }
    if (objNormalizado.valorUnitario !== undefined) {
      objNormalizado.valorUnitario = parseFloat(objNormalizado.valorUnitario);
    }
    if (objNormalizado.valorTotal !== undefined) {
      objNormalizado.valorTotal = parseFloat(objNormalizado.valorTotal);
    }
    return objNormalizado;
  }

  private objetosIguales(obj1: any, obj2: any): boolean {
    const obj1Normalizado = this.normalizarValores(obj1);
    const obj2Normalizado = this.normalizarValores(obj2);
    return JSON.stringify(obj1Normalizado) === JSON.stringify(obj2Normalizado);
  }
}
