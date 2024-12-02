import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { EstadoContratoCRUD, DocumentoContrato } from 'src/app/types/types';
import { DocumentosService } from 'src/app/services/documentos.service';

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
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private documentosService: DocumentosService
  ) {}

  ngOnInit(): void {
    this.getDocumentoContrato();
    this.usuarioId = 1;
    this.rol = 'ORDENADOR'; // JEFE CONTRATACION Y ORDENADOR
  }

  private handleError(message: string, error: any, callback?: () => void) {
    console.error(message, error);
    this.alertService.showErrorAlert(message);
    if (callback) callback();
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

  getDocumentoContrato() {
    this.contratoGeneralCrudService.getDocumentoContrato(12).subscribe({
      next: (response: { Success: boolean; Data: DocumentoContrato[] }) => {
        if (response.Success && response.Data.length > 0) {
          this.getDocumentoGestorDocumental(response.Data[0].documento_enlace);
        }
      },
      error: (error) =>
        this.handleError('Error al obtener documento de contrato', error),
    });
  }

  getDocumentoGestorDocumental(documento_enlace: string) {
    this.documentosService.getDocumento(documento_enlace).subscribe({
      next: (response: any) => {
        if (response.file) {
          this.documento = response.file;
        }
      },
      error: (error) => this.handleError('Error al obtener documento', error),
    });
  }
}
