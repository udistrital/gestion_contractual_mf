import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-observaciones',
  templateUrl: './modal-observaciones.component.html',
  styleUrls: ['./modal-observaciones.component.css'],
})
export class ModalObservacionesComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    public dialogRef: MatDialogRef<ModalObservacionesComponent>,
    public dialog: MatDialog
  ) {}

  ngOnInit() {}
}
