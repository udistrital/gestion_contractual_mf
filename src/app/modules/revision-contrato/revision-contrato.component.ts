import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { base64 } from 'src/assets/base64';
import { EstadoContratoCRUD } from 'src/app/types/types';

@Component({
  selector: 'app-revision-contrato',
  templateUrl: './revision-contrato.component.html',
  styleUrls: ['./revision-contrato.component.css'],
})
export class RevisionContratoComponent {
  selectedTab: number = 0;
  documento: string = '';
  usuarioId: any;
  rol: string = '';

  constructor(
    public dialog: MatDialog,
    private alertService: AlertService,
    private contratoGeneralCrudService: ContratoGeneralCrudService
  ) {}

  ngOnInit(): void {
    // Asigna el Base64 a la variable, incluyendo el prefijo del tipo de archivo.
    this.documento = documento();
    this.usuarioId = 1;
    this.rol = 'ORDENADOR'; // JEFE CONTRATACION Y ORDENADOR
  }

  openModalRechazo(): void {
    this.dialog.open(ModalMotivosRechazoComponent, {
      width: '70vw',
      data: { usuarioId: this.usuarioId },
    });
  }

  getMensajeConfirmacion(): string {
    switch (this.rol) {
      case 'JEFE CONTRATACION':
        return '¿Está seguro(a) de aprobar y enviar contrato a ordenador?';
      case 'ORDENADOR':
        return '¿Está seguro(a) de firmar y enviar contrato a contratista?';
      default:
        return '¿Está seguro(a) de aprobar y enviar contrato?';
    }
  }

  openModalEnviar(): void {
    const mensaje = this.getMensajeConfirmacion();
    this.alertService.showConfirmAlert(mensaje).then((confirmado: any) => {
      if (!confirmado.value) {
        return;
      }
      this.aprobarContrato();
    });
  }

  aprobarContrato() {
    const planEstado: EstadoContratoCRUD = this.construirObjetoEstadoContrato();
    this.contratoGeneralCrudService
      .postEstadoContrato(planEstado)
      .subscribe((res: any) => {
        this.alertService.showSuccessAlert(
          'El contrato fue enviado al ordenador',
          'CONTRATO ENVIADO'
        );
      });
  }

  construirObjetoEstadoContrato() {
    const estado: EstadoContratoCRUD = {
      usuario_id: this.usuarioId,
      estado_parametro_id: environment.ESTADO_CONTRATO.SUSCRITO,
      motivo: ' ',
      fecha_ejecucion_estado: new Date(),
      contrato_general_id: 1,
      fecha_creacion: new Date(),
    };
    return estado;
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }
}

export function documento() {
  return base64;
}
