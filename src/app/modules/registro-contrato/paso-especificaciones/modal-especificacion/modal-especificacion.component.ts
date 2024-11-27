import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-modal-especificacion',
  templateUrl: './modal-especificacion.component.html',
  styleUrls: ['./modal-especificacion.component.css'],
})
export class ModalEspecificacionComponent implements OnInit {
  formEspecificacion!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ModalEspecificacionComponent>,
    public dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.iniciarFormEspecificacion();
    if (this.data && this.data.especificacion) {
      this.formEspecificacion.patchValue(this.data.especificacion);
    }
  }

  iniciarFormEspecificacion() {
    this.formEspecificacion = this.fb.group({
      id: [null],
      descripcion: ['', Validators.required],
      cantidad: [0, Validators.required],
      valorUnitario: [0, Validators.required],
      valorTotal: [0, Validators.required],
    });
  }

  guardarEspecificacion() {
    if (this.formEspecificacion.valid) {
      const especificacionGuardada = this.formEspecificacion.value;
      this.dialogRef.close(especificacionGuardada); // Enviar los datos al componente principal
    }
  }
}
