import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
// import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { base64 } from 'src/assets/base64';
import { EstadoContratoCRUD } from 'src/app/types/types';

@Component({
  selector: 'app-revision-jefe',
  templateUrl: './revision-jefe.component.html',
  styleUrls: ['./revision-jefe.component.css'],
})
export class RevisionJefeComponent {
  selectedTab: number = 0;
  documento: string = '';
  usuarioId: any;

  constructor(
    public dialog: MatDialog,
    private alertService: AlertService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    // private userService: UserService
  ) {}

  ngOnInit(): void {
    // Asigna el Base64 a la variable, incluyendo el prefijo del tipo de archivo.
    this.documento = documento();
    this.usuarioId = 1;
    // this.userService.getPersonaId().then((usuarioId:any) => {
    //   this.usuarioId = usuarioId;
    // });
  }

  openModalRechazo(): void {
    this.dialog.open(ModalMotivosRechazoComponent, {
      width: '70vw',
      data: { usuarioId: this.usuarioId },
    });
  }

  openModalEnviar(): void {
    this.alertService
      .showConfirmAlert('¿Está seguro(a) de aprobar y enviar contrato a ordenador?')
      .then((confirmado: any) => {
        if (!confirmado.value) {
          return;
        }
        this.aprobarContrato();
      });
  }

  aprobarContrato() {
    const planEstado: EstadoContratoCRUD = this.construirObjetoEstadoContrato();
    this.contratoGeneralCrudService.postEstadoContrato(planEstado).subscribe((res:any) => {
      this.alertService.showSuccessAlert('El contrato fue enviado al ordenador', 'CONTRATO ENVIADO');
    });
  }

  construirObjetoEstadoContrato() {
    const estado: EstadoContratoCRUD = {
      usuario_id: this.usuarioId,
      estado_parametro_id: environment.ESTADO_CONTRATO.SUSCRITO,
      motivo: 'N/A',
      fecha_ejecucion_estado: new Date(),
      contrato_general_id: 1, //Id del contrato
      fecha_creacion: new Date()
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
