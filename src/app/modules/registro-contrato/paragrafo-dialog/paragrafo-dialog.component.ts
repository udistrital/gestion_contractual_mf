import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-paragrafo-dialog',
  template: `
    <h2 mat-dialog-title>Agregar Parágrafo a Cláusula {{data.clausulaIndex}}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field>
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre">
        </mat-form-field>
        <mat-form-field>
          <mat-label>Descripción</mat-label>
          <input matInput formControlName="descripcion">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-button color="primary" [disabled]="!form.valid" (click)="onSubmit()">Agregar</button>
    </mat-dialog-actions>
  `
})
export class ParagrafoDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ParagrafoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clausulaIndex: number }
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}