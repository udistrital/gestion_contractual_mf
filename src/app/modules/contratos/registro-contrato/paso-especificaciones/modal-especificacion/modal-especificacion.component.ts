import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EspecificacionTecnica } from 'src/app/types/types';

@Component({
  selector: 'app-modal-especificacion',
  templateUrl: './modal-especificacion.component.html',
  styleUrls: ['./modal-especificacion.component.css'],
  standalone: false
})
export class ModalEspecificacionComponent implements OnInit {
  allowedKeys = [
    'Backspace',
    'Tab',
    'End',
    'Home',
    'ArrowLeft',
    'ArrowRight',
    'Delete',
  ];
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

    // Recalcular valor total automáticamente al cambiar cantidad o valor unitario
    this.formEspecificacion.get('cantidad')?.valueChanges.subscribe(() => {
      this.recalcularValorTotal();
    });
    this.formEspecificacion.get('valor_unitario')?.valueChanges.subscribe(() => {
      this.recalcularValorTotal();
    });
  }

  get isEdicion(): boolean {
    return !!(this.data && this.data.especificacion);
  }

  get cantidadActual(): number {
    return parseFloat(this.formEspecificacion?.get('cantidad')?.value) || 0;
  }

  get valorUnitarioActual(): number {
    return parseFloat(this.formEspecificacion?.get('valor_unitario')?.value) || 0;
  }

  get valorTotalActual(): number {
    return parseFloat(this.formEspecificacion?.get('valor_total')?.value) || 0;
  }

  iniciarFormEspecificacion() {
    this.formEspecificacion = this.fb.group({
      id: [null],
      descripcion: ['', [Validators.required, Validators.minLength(3)]],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      valor_unitario: ['', [Validators.required, Validators.min(0.01)]],
      valor_total: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  recalcularValorTotal() {
    const cant = parseFloat(this.formEspecificacion.get('cantidad')?.value);
    const unit = parseFloat(this.formEspecificacion.get('valor_unitario')?.value);
    if (!isNaN(cant) && !isNaN(unit) && cant > 0 && unit > 0) {
      const total = Math.round(cant * unit * 100) / 100;
      this.formEspecificacion.get('valor_total')?.setValue(total, { emitEvent: false });
    }
  }

  validarNumero(event: KeyboardEvent) {
    const pattern = /^[0-9]$/;
    if (!this.allowedKeys.includes(event.key) && !pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  validarNumeroConDecimales(event: KeyboardEvent, inputValue: string) {
    const key = event.key;

    if (this.allowedKeys.includes(key)) {
      return;
    }

    const pattern = /^[0-9.]$/;
    if (!pattern.test(key)) {
      event.preventDefault();
      return;
    }

    if (key === '.' && inputValue.includes('.')) {
      event.preventDefault();
      return;
    }

    const [integerPart, decimalPart] = inputValue.split('.');
    if (decimalPart && decimalPart.length >= 2 && key !== 'Backspace') {
      event.preventDefault();
      return;
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
      this.dialogRef.close(especificacionGuardada);
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
