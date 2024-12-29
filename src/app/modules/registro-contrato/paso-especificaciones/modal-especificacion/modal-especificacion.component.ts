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
  }

  iniciarFormEspecificacion() {
    this.formEspecificacion = this.fb.group({
      id: [null],
      descripcion: ['', Validators.required],
      cantidad: ['', Validators.required],
      valor_unitario: ['', Validators.required],
      valor_total: ['', Validators.required],
    });
  }

  validarNumero(event: KeyboardEvent) {
    const pattern = /^[0-9]$/;
    if (!this.allowedKeys.includes(event.key) && !pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  validarNumeroConDecimales(event: KeyboardEvent, inputValue: string) {
    const key = event.key;

    // Permitir teclas funcionales (no numéricas)
    if (this.allowedKeys.includes(key)) {
      return; // Permite estas teclas
    }

    // Permitir números y el punto decimal
    const pattern = /^[0-9.]$/;
    if (!pattern.test(key)) {
      event.preventDefault();
      return;
    }

    // Evitar más de un punto decimal
    if (key === '.' && inputValue.includes('.')) {
      event.preventDefault();
      return;
    }
    
    // Validar que después del punto decimal solo haya hasta dos dígitos
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
