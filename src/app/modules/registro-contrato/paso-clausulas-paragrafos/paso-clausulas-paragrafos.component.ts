import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ParagrafoDialogComponent } from '../paragrafo-dialog/paragrafo-dialog.component';

@Component({
  selector: 'app-paso-clausulas-paragrafos',
  templateUrl: './paso-clausulas-paragrafos.component.html',
  styleUrls: ['./paso-clausulas-paragrafos.component.css']
})
export class PasoClausulasParagrafosComponent {
  form: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    private dialog: MatDialog
  ) {
    this.form = this._formBuilder.group({
      clausulas: this._formBuilder.array([this.crearClausula()])
    });
  }

  get clausulas(): FormArray {
    return this.form.get('clausulas') as FormArray;
  }

  crearClausula(): FormGroup {
    return this._formBuilder.group({
      index: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      paragrafos: this._formBuilder.array([])
    });
  }

  getParagrafos(clausula: AbstractControl): FormArray {
    return clausula.get('paragrafos') as FormArray;
  }

  agregarClausula() {
    this.clausulas.push(this.crearClausula());
  }

  eliminarClausula(index: number) {
    if (this.clausulas.length > 1) {
      this.clausulas.removeAt(index);
    }
  }

  abrirDialogoParagrafo(clausulaIndex: number) {
    const dialogRef = this.dialog.open(ParagrafoDialogComponent, {
      width: '500px',
      data: { clausulaIndex: clausulaIndex + 1 }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.agregarParagrafo(clausulaIndex, result);
      }
    });
  }

  agregarParagrafo(clausulaIndex: number, paragrafoData: any) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    paragrafos.push(this._formBuilder.group({
      nombre: [paragrafoData.nombre, Validators.required],
      descripcion: [paragrafoData.descripcion, Validators.required]
    }));
  }

  eliminarParagrafo(clausulaIndex: number, paragrafoIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    paragrafos.removeAt(paragrafoIndex);
  }

  guardarYContinuar() {
    console.log('Datos del FormBuilder:', this.form.value);
  }
}
