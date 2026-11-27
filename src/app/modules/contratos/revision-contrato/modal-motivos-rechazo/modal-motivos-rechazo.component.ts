import { Component, ElementRef, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ApiResponse, EstadoContrato, EstadoContratoCrud } from 'src/app/types/types';

@Component({
    selector: 'app-modal-motivos-rechazo',
    templateUrl: './modal-motivos-rechazo.component.html',
    styleUrls: ['./modal-motivos-rechazo.component.css'],
    standalone: false
})
export class ModalMotivosRechazoComponent implements OnInit {
  formObservaciones!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dataModal: any,
    public dialogRef: MatDialogRef<ModalMotivosRechazoComponent>,
    public dialog: MatDialog,
    private alertService: AlertService,
    private fb: FormBuilder,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private elementRef: ElementRef<HTMLElement>
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
    // El CDK muestra el diálogo en la capa superior del navegador (popover), por encima de cualquier
    // z-index: la confirmación se agrega en el mismo host para que quede encima del modal y reciba el clic.
    const capaDelDialogo = this.elementRef.nativeElement.closest<HTMLElement>('.cdk-overlay-popover') ?? undefined;
    this.alertService
      .showConfirmAlert('¿Está seguro(a) de rechazar el contrato?', undefined, capaDelDialogo)
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.rechazarContrato();
      });
  }

  rechazarContrato() {
    const estado: EstadoContrato = {
      contrato_general_id: { id: this.dataModal.contrato_general_id },
      usuario_id: this.dataModal.usuario_id,
      usuario_rol: this.dataModal.rol,
      estado_parametro_id: environment.ESTADOS_GENERALES.POR_SUSCRIBIR,
      estado_interno_parametro_id: environment.ESTADOS_INTERNOS.RECHAZADO,
      motivo: this.formObservaciones.get('observaciones')?.value,
    };
    this.contratoGeneralCrudService
      .postEstadoContrato(estado)
      .subscribe((res: ApiResponse<EstadoContratoCrud>) => {
        if (res?.Data?.id) {
          this.dialogRef.close({ rechazado: true });
        } else {
          this.dialogRef.close({ rechazado: false });
        }
      });
  }
}
