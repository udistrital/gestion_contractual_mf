import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { EstadoContratoCRUD, DocumentoContrato } from 'src/app/types/types';
import { DocumentosService } from 'src/app/services/documentos.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { ActivatedRoute } from '@angular/router';

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
  contrato_general_id = 0;
  usuario_id: number = 0;
  roles: string[] = [];
  estadoInterno: number = 6802;
  mostrarBotones: boolean = false;
  mensaje: any;

  // Configuración de mensajes por rol y estado
  private readonly textos: any = {
    JEFE_DEPENDENCIA: {
      [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: {
        accion: 'Aprobar y Enviar a Ordenador',
        confirmacion:
          '¿Está seguro(a) de aprobar y enviar contrato a ordenador?',
        enviado: 'El contrato fue enviado al ordenador',
      },
    },
    ORDENADOR_DEL_GASTO: {
      [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: {
        accion: 'Firmar y Enviar a Contratista',
        confirmacion:
          '¿Está seguro(a) de firmar y enviar contrato a contratista?',
        enviado: 'El contrato fue enviado al contratista',
      },
    },
    CONTRATISTA: {
      [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: {
        accion: 'Firmar y Enviar',
        confirmacion: '¿Está seguro(a) de firmar y enviar contrato?',
        enviado: 'El contrato fue enviado exitosamente',
      },
    },
  };

  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private documentosService: DocumentosService,
    private rolService: RolService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.roles = this.rolService.getRol();
    this.userService.getPersonaId().then((usuario_id) => {
      this.usuario_id = usuario_id;
    });
    const id = this.route.snapshot.paramMap.get('idContrato');
    this.contrato_general_id = id ? Number(id) : 0;
    this.getMensajes();
    this.getDocumentosContrato();
  }

  private handleError(message: string, error: any, callback?: () => void) {
    console.error(message, error);
    this.alertService.showErrorAlert(message);
    if (callback) callback();
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  private getMensajes() {
    for (const role of this.roles) {
      if (this.textos[role]?.[this.estadoInterno]) {
        this.mensaje = this.textos[role][this.estadoInterno];
        this.mostrarBotones = true;
      }
    }
  }

  openMensajeConfirmacion(): void {
    this.alertService
      .showConfirmAlert(this.mensaje.confirmacion)
      .then((confirmado: any) => {
        if (confirmado.value) {
          this.aprobarContrato();
        }
      });
  }

  getRolPorEstado(): string {
    const rolesPorEstado = {
      [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: 'JEFE_DEPENDENCIA',
      [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: 'ORDENADOR_DEL_GASTO',
      [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: 'CONTRATISTA',
    };
    const rolEsperado = rolesPorEstado[this.estadoInterno];
    return this.roles.includes(rolEsperado) ? rolEsperado : '';
  }

  openModalRechazo(): void {
    const rol = this.getRolPorEstado();
    this.dialog.open(ModalMotivosRechazoComponent, {
      width: '70vw',
      data: {
        usuario_id: this.usuario_id,
        rol,
        contrato_general_id: this.contrato_general_id,
      },
    });
  }

  getEstadosAutomaticosPorEstado(): number[] {
    const rolesPorEstado = {
      [environment.ESTADOS_INTERNOS.EN_REVISION_JEFE]: [
        environment.ESTADOS_INTERNOS.APROBADO_JEFE, //Estado automático
        environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR,
      ],
      [environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR]: [
        environment.ESTADOS_INTERNOS.FIRMADO_ORDENADOR, //Estado automático
        environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA,
      ],
      [environment.ESTADOS_INTERNOS.EN_FIRMA_CONTRATISTA]: [
        environment.ESTADOS_INTERNOS.FIRMADO_CONTRATISTA, //Estado automático
      ],
    };
    return rolesPorEstado[this.estadoInterno];
  }

  aprobarContrato() {
    let estados: any[] = this.getEstadosAutomaticosPorEstado();
    const rol = this.getRolPorEstado();
    if (rol != '' && estados.length > 0) {
      const estado = estados[0];
      const estado_parametro_id = environment.ESTADOS_GENERALES.SUSCRITO;
      let estadoContrato: EstadoContratoCRUD = {
        contrato_general_id: this.contrato_general_id,
        usuario_id: this.usuario_id,
        usuario_rol: rol,
        estado_parametro_id,
        estado_interno_parametro_id: estado,
        motivo: ' ',
      };
      if (estado == environment.ESTADOS_INTERNOS.APROBADO_JEFE) {
        estadoContrato.estado_parametro_id =
          environment.ESTADOS_GENERALES.POR_SUSCRIBIR;
      }

      if (estados.length > 1) {
        this.crearEstadoAdicionalContrato(estadoContrato, estados[1]);
      } else {
        this.crearEstadoContrato(estadoContrato);
      }
    }
  }

  crearEstadoAdicionalContrato(
    estadoContrato: EstadoContratoCRUD,
    estado: number
  ) {
    this.contratoGeneralCrudService
      .postEstadoContrato(estadoContrato)
      .subscribe({
        next: (response: any) => {
          if (response.id) {
            estadoContrato.estado_parametro_id =
              environment.ESTADOS_GENERALES.SUSCRITO;
            estadoContrato.estado_interno_parametro_id = estado;
            this.crearEstadoContrato(estadoContrato);
          }
        },
        error: (error) =>
          this.handleError('Error al crear estado automático', error),
      });
  }

  crearEstadoContrato(estadoContrato: EstadoContratoCRUD) {
    this.contratoGeneralCrudService
      .postEstadoContrato(estadoContrato)
      .subscribe((res: any) => {
        this.alertService.showSuccessAlert(
          this.mensaje.enviado,
          'CONTRATO ENVIADO'
        );
      });
  }

  getDocumentosContrato() {
    this.isLoading = true;
    this.contratoGeneralCrudService
      .getDocumentoContrato(this.contrato_general_id)
      .subscribe({
        next: (response: { Success: boolean; Data: DocumentoContrato[] }) => {
          if (response.Success && response.Data.length > 0) {
            response.Data.map((documento) =>
              this.getDocumentoGestorDocumental(documento)
            );
          } else {
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.handleError('Error al obtener documentos', error),
            (this.isLoading = false);
        },
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
