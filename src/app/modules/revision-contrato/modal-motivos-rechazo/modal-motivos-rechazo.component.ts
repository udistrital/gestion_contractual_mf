import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { EstadoContratoCRUD } from 'src/app/types/types';

@Component({
  selector: 'app-modal-motivos-rechazo',
  templateUrl: './modal-motivos-rechazo.component.html',
  styleUrls: ['./modal-motivos-rechazo.component.css'],
})
export class ModalMotivosRechazoComponent implements OnInit {
  formObservaciones!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dataModal: any,
    public dialogRef: MatDialogRef<ModalMotivosRechazoComponent>,
    public dialog: MatDialog,
    private alertService: AlertService,
    private fb: FormBuilder,
    private contratoGeneralCrudService: ContratoGeneralCrudService
  ) {}

  ngOnInit() {
    this.iniciarFormObservaciones();
  }

  iniciarFormObservaciones() {
    this.formObservaciones = this.fb.group({
      observaciones: ['', Validators.required],
    });
  }

  preguntarConfirmacionRechazo() {
    this.alertService
      .showConfirmAlert('¿Está seguro(a) de rechazar el contrato?')
      .then((confirmado: any) => {
        if (!confirmado.value) {
          return;
        }
        this.rechazarContrato();
      });
  }

  rechazarContrato() {
    const contratoEstado: EstadoContratoCRUD = this.construirObjetoEstadoContrato();
    this.contratoGeneralCrudService.postEstadoContrato(contratoEstado).subscribe((res:any) => {
      this.alertService.showSuccessAlert('El contrato fue rechazado', 'CONTRATO RECHAZADO');
      this.dialogRef.close();
    });
  }

  construirObjetoEstadoContrato() {
    const estado: EstadoContratoCRUD = {
      contrato_general_id: 1,
      usuario_id: this.dataModal.usuarioId,
      usuario_rol: "",
      estado_parametro_id: environment.ESTADO_CONTRATO.DECLINADO,
      estado_interno_parametro_id: environment.ESTADOS_INTERNOS.RECHAZADO,
      motivo: this.formObservaciones.get('observaciones')?.value,
      fecha_ejecucion_estado: new Date(),
      fecha_creacion: new Date()
    };
    return estado;
  }
}
