import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-guardar-info',
  standalone: true,
  templateUrl: './guardar-info.component.html',
  styleUrls: ['./guardar-info.component.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ]
})
export class GuardarInfoComponent {
  constructor(public dialogRef: MatDialogRef<GuardarInfoComponent>) {}

  onCloseClick(): void {
    this.dialogRef.close();
  }
}