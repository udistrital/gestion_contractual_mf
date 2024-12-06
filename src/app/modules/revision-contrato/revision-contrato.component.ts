import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { EstadoContratoCRUD, DocumentoContrato } from 'src/app/types/types';
import { DocumentosService } from 'src/app/services/documentos.service';
import { RolService } from 'src/app/services/rol.service';

@Component({
  selector: 'app-revision-contrato',
  templateUrl: './revision-contrato.component.html',
  styleUrls: ['./revision-contrato.component.css'],
})
export class RevisionContratoComponent {
  isLoading = false;
  selectedTab: number = 0;
  tabs: string[] = ['Minuta', 'Documentos'];
  documentos = { minuta: '', documentos_precontractuales: '' };
  usuarioId: number = 1;
  roles: string[] = [];

  constructor(
    public dialog: MatDialog,
    private alertService: AlertService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private documentosService: DocumentosService,
    private rolService: RolService
  ) {}

  ngOnInit(): void {
    this.roles = this.rolService.getRol();
    this.getDocumentosContrato();
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

  getAccionBotonEnviar(): string {
    if (this.roles.includes('JEFE_DEPENDENCIA')) {
      return 'Aprobar y Enviar a Ordenador';
    } else if (this.roles.includes('ORDENADOR_DEL_GASTO')) {
      return 'Firmar y Enviar a Contratista';
    } else if (this.roles.includes('CONTRATISTA')) {
      return 'Firmar y Enviar';
    } else {
      return '';
    }
  }

  getMensajeConfirmacion(): string {
    if (this.roles.includes('JEFE_DEPENDENCIA')) {
      return '¿Está seguro(a) de aprobar y enviar contrato a ordenador?';
    } else if (this.roles.includes('ORDENADOR_DEL_GASTO')) {
      return '¿Está seguro(a) de firmar y enviar contrato a contratista?';
    } else if (this.roles.includes('CONTRATISTA')) {
      return '¿Está seguro(a) de firmar y enviar contrato?';
    } else {
      return '¿Está seguro(a) de realizar esta acción?';
    }
  }

  getMensajeEnvado(): string {
    if (this.roles.includes('JEFE_DEPENDENCIA')) {
      return 'El contrato fue enviado al ordenador';
    } else if (this.roles.includes('ORDENADOR_DEL_GASTO')) {
      return 'El contrato fue enviado al contratista';
    } else if (this.roles.includes('CONTRATISTA')) {
      return 'El contrato fue enviado exitosamente';
    } else {
      return 'El contrato fue enviado';
    }
  }

  openMensajeConfirmacion(): void {
    const mensaje = this.getMensajeConfirmacion();
    this.alertService.showConfirmAlert(mensaje).then((confirmado: any) => {
      if (confirmado.value) {
        this.aprobarContrato();
      }
    });
  }

  aprobarContrato() {
    const estadoContrato: EstadoContratoCRUD = {
      usuario_id: this.usuarioId,
      estado_parametro_id: environment.ESTADO_CONTRATO.SUSCRITO,
      estado_interno_parametro_id: environment.ESTADOS_INTERNOS.APROBADO,
      motivo: ' ',
      fecha_ejecucion_estado: new Date(),
      contrato_general_id: 1,
      fecha_creacion: new Date(),
    };

    this.contratoGeneralCrudService
      .postEstadoContrato(estadoContrato)
      .subscribe((res: any) => {
        this.alertService.showSuccessAlert(
          this.getMensajeEnvado(),
          'CONTRATO ENVIADO'
        );
      });
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  getDocumentosContrato() {
    this.isLoading = true;
    this.contratoGeneralCrudService.getDocumentoContrato(12).subscribe({
      next: (response: { Success: boolean; Data: DocumentoContrato[] }) => {
        if (response.Success && response.Data.length > 0) {
          response.Data.map((documento) =>
            this.getDocumentoGestorDocumental(documento)
          );
        }
      },
      error: (error) => this.handleError('Error al obtener documentos', error),
    });
  }

  getDocumentoGestorDocumental(documento: DocumentoContrato) {
    this.documentosService.getDocumento(documento.documento_enlace).subscribe({
      next: (response: any) => {
        if (response.file) {
          const tipoDocumento = documento.tipo_documento_id;
          const tiposDocumentos = environment.TIPO_DOCUMENTO_ID_PARAMETROS;
          if (tipoDocumento == tiposDocumentos.MINUTA) {
            this.documentos.minuta = response.file;
          } else if (
            tipoDocumento == tiposDocumentos.DOCUMENTOS_PRECONTRACTUALES
          ) {
            this.documentos.documentos_precontractuales = response.file;
          }
        }
      },
      error: (error) => this.handleError('Error al obtener documento', error),
      complete: () => (this.isLoading = false),
    });
  }
}
