import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { EstadoContrato, DocumentoContrato } from 'src/app/types/types';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { ActivatedRoute } from '@angular/router';
import {
  textosMensaje,
  flujoEstados,
  rolPorEstado,
} from 'src/app/utils/rolesEstados';
import { CargarArchivoComponent } from './cargar-archivo/cargar-archivo.component';
import { forkJoin } from 'rxjs';

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
  usuario_id: number = 0;
  roles: string[] = [];
  estadoInternoActual: number = 0;
  estadoInternoAnterior: number = 0;
  mostrarBotones: boolean = false;
  textos: any;

  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private gestorDocumentalService: GestorDocumentalService,
    private rolService: RolService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.roles = this.rolService.getRol();
    this.getIdContratoUrl();
    this.getIdUsuario();
    this.getMinuta();
    this.getDocumentosPrecontractuales();
    this.cargarDatosIniciales();
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

  getIdUsuario() {
    this.userService.getPersonaId().then((usuario_id) => {
      this.usuario_id = usuario_id;
    });
  }

  getRolPorEstado(): string {
    const rolesEsperados = rolPorEstado[this.estadoInternoActual] || [];
    const rolEncontrado = rolesEsperados.find((rol: any) =>
      this.roles.includes(rol)
    );
    return rolEncontrado || '';
  }

  cargarDatosIniciales() {
    forkJoin({
      unidadEjecutora: this.contratoGeneralCrudService.get(
        this.contrato_general_id
      ),
      estadosContrato: this.contratoGeneralCrudService.getEstados(
        this.contrato_general_id
      ),
    }).subscribe({
      next: ({ unidadEjecutora, estadosContrato }: any) => {
        if (unidadEjecutora.Success && unidadEjecutora.Status === 200) {
          this.unidad_ejecutora_id = unidadEjecutora.Data?.unidad_ejecutora_id;
        }

        if (estadosContrato.length > 0) {
          this.estadoInternoActual =
            estadosContrato[0].estado_interno_parametro_id || 0;
          this.estadoInternoAnterior =
            estadosContrato[1]?.estado_interno_parametro_id || 0;
        }

        this.getTextosMensajes();
      },
      error: (error) => {
        this.handleError('Error al cargar datos iniciales', error);
      },
    });
  }

  private getTextosMensajes() {
    const rol = this.getRolPorEstado();
    this.textos =
      textosMensaje[this.unidad_ejecutora_id]?.[rol]?.[
        this.estadoInternoActual
      ];
    if (this.textos) {
      this.mostrarBotones = true;
    }
  }

  getDocumento(
    tipoDocumento: number,
    callback: (file: any) => void,
    errorMessage: string
  ) {
    this.isLoading = true;
    this.contratoGeneralCrudService
      .getDocumentoActual(this.contrato_general_id, tipoDocumento)
      .subscribe({
        next: (documentos: DocumentoContrato[]) => {
          const documentoActual = documentos[0];
          if (documentoActual) {
            this.gestorDocumentalService
              .getDocumento(documentoActual.documento_enlace)
              .subscribe({
                next: (response: any) => {
                  if (response.file) {
                    callback(response.file);
                  }
                },
                error: (error) => this.handleError(errorMessage, error),
                complete: () => (this.isLoading = false),
              });
          } else {
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.handleError('Error al obtener documentos', error);
          this.isLoading = false;
        },
      });
  }

  getMinuta() {
    this.getDocumento(
      environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA,
      (file) => (this.documentos.minuta = file),
      'Error al obtener minuta'
    );
  }

  getDocumentosPrecontractuales() {
    this.getDocumento(
      environment.TIPO_DOCUMENTO_ID_PARAMETROS.DOCUMENTOS_PRECONTRACTUALES,
      (file) => (this.documentos.documentos_precontractuales = file),
      'Error al obtener documentos precontractuales'
    );
  }

  mostrarBotonRechazo() {
    return !(
      this.estadoInternoAnterior ==
        environment.ESTADOS_INTERNOS.FIRMADO_CONTRATISTA &&
      this.estadoInternoActual ==
        environment.ESTADOS_INTERNOS.EN_FIRMA_ORDENADOR
    );
  }

  abrirModalCargarArchivo(): void {
    const dialog = this.dialog.open(CargarArchivoComponent, {
      width: '800px',
      data: {
        textos: this.textos,
        datos: {
          nombre: `MINUTA ${this.contrato_general_id}`,
          descripcion: `Cargue de minuta, contrato general id ${this.contrato_general_id}`,
          contrato_general_id: this.contrato_general_id,
          usuario_id: this.usuario_id,
          usuario_rol: this.getRolPorEstado(),
        },
      },
    });

    dialog.afterClosed().subscribe((result) => {
      if (result?.confirmado) {
        this.mostrarBotones = false;
        this.aprobarContrato();
      }
    });
  }

  abrirModalRechazo(): void {
    const rol = this.getRolPorEstado();
    const dialogRef = this.dialog.open(ModalMotivosRechazoComponent, {
      width: '70vw',
      data: {
        usuario_id: this.usuario_id,
        rol,
        contrato_general_id: this.contrato_general_id,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result?.rechazado) {
          this.mostrarBotones = false;
          this.alertService.showSuccessAlert(
            'El contrato fue rechazado',
            'CONTRATO RECHAZADO'
          );
        } else {
          this.alertService.showErrorAlert(
            'Error al rechazar contrato',
            'Por favor, intente de nuevo'
          );
        }
      }
    });
  }

  aprobarContrato() {
    let estados: number[] =
      flujoEstados[this.unidad_ejecutora_id]?.[this.estadoInternoActual];
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
      .subscribe({
        next: (response: any) => {
          if (response.id) {
            this.alertService.showSuccessAlert(
              this.textos.enviado,
              'CONTRATO ENVIADO'
            );
          }
        },
        error: (error) =>
          this.handleError('Error al crear estado de contrato', error),
      });
  }
}
