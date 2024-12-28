import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { EstadoContrato, DocumentoContrato } from 'src/app/types/types';
import { DocumentosService } from 'src/app/services/documentos.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { textosMensaje, flujoEstados, rolPorEstado } from './roles_estados';

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
  unidad_ejecutora_id = 0;
  unidad_ejecutora = '';
  usuario_id: number = 0;
  roles: string[] = [];
  estadoInternoActual: number = 0;
  estadoInternoAnterior: number = 0;
  mostrarBotones: boolean = false;
  mensaje: any;

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
    this.getIdContratoUrl();
    this.getUnidadEjecutora();
    this.getEstadosContrato();
    this.getEstadoActual();
    this.getIdUsuario();
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

  getIdContratoUrl() {
    const id = this.route.snapshot.paramMap.get('idContrato');
    this.contrato_general_id = id ? Number(id) : 0;
  }

  setUnidadEjecutora() {
    const unidades: { [key: string]: string } = {
      [environment.UNIDADES_EJECUTORAS.RECTORIA]: 'RECTORIA',
      [environment.UNIDADES_EJECUTORAS.IDEXUD]: 'IDEXUD',
    };
    this.unidad_ejecutora = unidades[this.unidad_ejecutora_id] || '';
  }

  getUnidadEjecutora() {
    this.contratoGeneralCrudService.get(this.contrato_general_id).subscribe({
      next: (res: any) => {
        if (res.Success && res.Status == 200) {
          this.unidad_ejecutora_id = res.Data?.unidad_ejecutora_id;
          this.setUnidadEjecutora();
        }
      },
      error: (error) =>
        this.handleError(
          'Error al obtener estado general para asignación de unidad ejecutora',
          error
        ),
    });
  }

  getEstadosContrato() {
    this.contratoGeneralCrudService
      .getEstados(this.contrato_general_id)
      .subscribe({
        next: (res: any) => {
          if (res.length > 0) {
            this.estadoInternoAnterior =
              res[1].estado_interno_parametro_id || 0;
          }
        },
        error: (error) =>
          this.handleError('Error al obtener estados del contrato', error),
      });
  }

  private getTextosMensajes() {
    for (const role of this.roles) {
      this.mensaje =
        textosMensaje[this.unidad_ejecutora]?.[role]?.[
          this.estadoInternoActual
        ];
      if (this.mensaje) {
        this.mostrarBotones = true;
      }
    }
  }

  getEstadoActual() {
    this.contratoGeneralCrudService
      .getEstadoActual(this.contrato_general_id)
      .subscribe({
        next: (res: EstadoContrato) => {
          if (res.estado_interno_parametro_id) {
            this.estadoInternoActual = res.estado_interno_parametro_id;
            this.getTextosMensajes();
          }
        },
        error: (error) =>
          this.handleError(
            'Error al obtener el estado actual del contrato',
            error
          ),
      });
  }

  getIdUsuario() {
    this.userService.getPersonaId().then((usuario_id) => {
      this.usuario_id = usuario_id;
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

  mostrarBotonRechazo() {
    return !(
      this.estadoInternoAnterior ==
        environment.ESTADOS_INTERNOS.FIRMADO_CONTRATISTA &&
      this.estadoInternoActual ==
        environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR
    );
  }

  getRolPorEstado(): string {
    const rolesEsperados = rolPorEstado[this.estadoInternoActual] || [];
    const rolEncontrado = rolesEsperados.find((rol: any) =>
      this.roles.includes(rol)
    );
    return rolEncontrado || '';
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

  aprobarContrato() {
    let estados: number[] =
      flujoEstados[this.unidad_ejecutora]?.[this.estadoInternoActual];
    const rol = this.getRolPorEstado();
    if (rol != '' && estados?.length > 0) {
      const estado = estados[0];
      const estado_parametro_id = environment.ESTADOS_GENERALES.SUSCRITO;
      let estadoContrato: EstadoContrato = {
        contrato_general_id: this.contrato_general_id,
        usuario_id: this.usuario_id,
        usuario_rol: rol,
        estado_parametro_id,
        estado_interno_parametro_id: estado,
      };
      if (estado == environment.ESTADOS_INTERNOS.APROBADO_JEFE) {
        estadoContrato.estado_parametro_id =
          environment.ESTADOS_GENERALES.POR_SUSCRIBIR;
      }
      if (estados.length > 1) {
        this.crearEstadoAutomaticoContrato(estadoContrato, estados[1]);
      } else {
        this.crearEstadoContrato(estadoContrato);
      }
    }
  }

  crearEstadoAutomaticoContrato(
    estadoContrato: EstadoContrato,
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

  crearEstadoContrato(estadoContrato: EstadoContrato) {
    this.contratoGeneralCrudService
      .postEstadoContrato(estadoContrato)
      .subscribe((res: any) => {
        this.alertService.showSuccessAlert(
          this.mensaje.enviado,
          'CONTRATO ENVIADO'
        );
        this.mostrarBotones = false;
      });
  }
}
