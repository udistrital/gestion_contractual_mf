import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GuardarInfoComponent } from '../guardar-info/guardar-info.component';

@Component({
  selector: 'app-paso-objeto',
  standalone: true,
  templateUrl: './paso-objeto.component.html',
  styleUrls: ['./paso-objeto.component.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule
  ],
})
export class PasoObjetoComponent {
  sixthFormGroup = this._formBuilder.group({
    sixthCtrl: ['', Validators.required],
  });

  constructor(
    private _formBuilder: FormBuilder,
    private dialog: MatDialog
  ) { }

  openDialog() {
    this.dialog.open(GuardarInfoComponent, {
      width: '550px',
    });
  }
}