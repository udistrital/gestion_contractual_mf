import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo/modal-motivos-rechazo.component';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';
import {
  CambioEstadoContrato,
  DocumentoContrato,
} from 'src/app/types/types';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { RolService } from 'src/app/services/rol.service';
import { UserService } from 'src/app/services/user.service';
import { ActivatedRoute } from '@angular/router';
import {
  textosMensaje,
  flujoEstados,
  rolPorEstado,
} from 'src/app/utils/rolesEstados';
import { SubirArchivoComponent } from './cargar-archivo/cargar-archivo.component';
import { forkJoin } from 'rxjs';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import {
  MinutasMidService,
  esErrorMinuta,
  mensajeDeErrorMinuta,
} from 'src/app/services/minuta-mid.service';
import { MENSAJES_MINUTA } from 'src/app/core/constants/mensajes-minuta';

type OrigenMinuta = 'guardada' | 'generada';

/** Estado de la pestaña Minuta. */
export type EstadoMinuta =
  | { tipo: 'cargando' }
  | { tipo: 'documento'; origen: OrigenMinuta; fecha: string | null }
  | { tipo: 'error'; mensaje: string; reintentable: boolean }
  | { tipo: 'sin-documento' };

/**
 * "2026-11-11T10:30:00Z" → "11/11/2026". Toma el día del texto, sin pasarlo
 * por Date: el CRUD guarda la hora de Bogotá y Date podría correr el día.
 */
function fechaDdMmAaaa(valor: unknown): string | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor ?? ''));
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : null;
}

@Component({
    selector: 'app-revision-contrato',
    templateUrl: './revision-contrato.component.html',
    styleUrls: ['./revision-contrato.component.css'],
    standalone: false
})
export class RevisionContratoComponent {
  isLoading = false;
  selectedTab: number = 0;
  tabs: string[] = ['Minuta', 'Documentos'];
  documentos = { minuta: '', documentos_precontractuales: '' };
  estadoMinuta: EstadoMinuta = { tipo: 'cargando' };
  contrato_general_id = 0;
  unidad_ejecutora_id = 0;
  numero_contrato: string = '';
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
    private gestionContractualCrudService: GestionContractualCrudService,
    private contratoGeneralMidService: ContratoGeneralMidService,
    private gestorDocumentalService: GestorDocumentalService,
    private minutasMidService: MinutasMidService,
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
    const id =
      this.route.snapshot.paramMap.get('idContrato') ||
      this.route.snapshot.paramMap.get('contratoId');
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
    if (!this.contrato_general_id) return;
    forkJoin({
      contrato: this.contratoGeneralCrudService.get(this.contrato_general_id),
      // Estados del contrato, del más reciente al más antiguo.
      estadosContrato: this.contratoGeneralCrudService.getEstados({
        query: `contrato_general_id.id:${this.contrato_general_id},activo:true`,
        sortby: 'fecha_creacion,id',
        order: 'desc',
        limit: 0,
      }),
    }).subscribe({
      next: ({ contrato, estadosContrato }: any) => {
        const contratoData = contrato?.Data;
        if (contratoData) {
          this.unidad_ejecutora_id = contratoData.unidad_ejecutora_id || 0;
          this.numero_contrato = contratoData.numero_contrato || '';
        }

        const estados = estadosContrato?.Data || [];

        if (estados.length > 0) {
          this.estadoInternoActual =
            estados[0].estado_interno_parametro_id || 0;
          this.estadoInternoAnterior =
            estados[1]?.estado_interno_parametro_id || 0;
        }

        this.getTextosMensajes();
      },
      error: (error) => {
        console.warn('Error al cargar datos iniciales del contrato:', error);
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
    this.gestionContractualCrudService
      .getDocumentos(this.consultaDocumentoVigente(tipoDocumento))
      .subscribe({
        next: (documentos: any) => {
          const docsList = documentos?.Data || [];
          const documentoActual = docsList[0];
          if (documentoActual?.documento_enlace) {
            this.gestorDocumentalService
              .getDocumento(documentoActual.documento_enlace)
              .subscribe({
                next: (response: any) => {
                  if (response?.file) {
                    callback(response.file);
                  }
                  this.isLoading = false;
                },
                error: (error) => {
                  console.warn(errorMessage, error);
                  this.isLoading = false;
                },
              });
          } else {
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.warn('No se encontraron documentos en gestor documental:', error);
          this.isLoading = false;
        },
      });
  }

  /** Documento vigente del contrato para un tipo: el más reciente activo. */
  private consultaDocumentoVigente(tipoDocumentoId: number) {
    return {
      query:
        `entidad_tipo:contrato_general,entidad_id:${this.contrato_general_id},` +
        `tipo_documento_id:${tipoDocumentoId},activo:true`,
      sortby: 'fecha_creacion,id',
      order: 'desc',
      limit: 1,
    };
  }

  /** Primero la minuta guardada (tipo MINUTA); si no hay o falla su descarga, la generada. */
  getMinuta() {
    this.estadoMinuta = { tipo: 'cargando' };
    this.documentos.minuta = '';
    this.gestionContractualCrudService
      .getDocumentos(
        this.consultaDocumentoVigente(environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA)
      )
      .subscribe({
        next: (documentos: any) => {
          const documentoActual = (documentos?.Data || [])[0];
          if (!documentoActual?.documento_enlace) {
            this.obtenerMinutaRenderizadaMid();
            return;
          }
          this.gestorDocumentalService.getDocumento(documentoActual.documento_enlace).subscribe({
            next: (response: any) => {
              if (response?.file) {
                this.mostrarMinuta(response.file, 'guardada', documentoActual.fecha_creacion);
              } else {
                this.obtenerMinutaRenderizadaMid();
              }
            },
            error: () => this.obtenerMinutaRenderizadaMid(),
          });
        },
        error: () => this.obtenerMinutaRenderizadaMid(),
      });
  }

  obtenerMinutaRenderizadaMid() {
    if (!this.contrato_general_id) {
      this.estadoMinuta = { tipo: 'sin-documento' };
      return;
    }
    this.estadoMinuta = { tipo: 'cargando' };
    this.minutasMidService.getMinutaPdf(this.contrato_general_id).subscribe({
      next: (pdf: string) => this.mostrarMinuta(pdf, 'generada'),
      error: (error: unknown) => {
        this.documentos.minuta = '';
        this.estadoMinuta = {
          tipo: 'error',
          mensaje: mensajeDeErrorMinuta(error),
          reintentable: esErrorMinuta(error) ? error.reintentable : true,
        };
      },
    });
  }

  /** Borra el documento anterior y vuelve a pedir la minuta. */
  reintentarMinuta() {
    this.documentos.minuta = '';
    this.getMinuta();
  }

  /** El visor no pudo mostrar el PDF (base64 o PDF dañado). */
  onErrorVisorMinuta() {
    this.documentos.minuta = '';
    this.estadoMinuta = { tipo: 'error', mensaje: MENSAJES_MINUTA.invalida, reintentable: true };
  }

  private mostrarMinuta(base64: string, origen: OrigenMinuta, fechaCreacion?: unknown) {
    this.documentos.minuta = base64;
    this.estadoMinuta = { tipo: 'documento', origen, fecha: fechaDdMmAaaa(fechaCreacion) };
  }

  /** Texto sobre el visor según de dónde salió la minuta. */
  get etiquetaOrigenMinuta(): string {
    if (this.estadoMinuta.tipo !== 'documento') return '';
    if (this.estadoMinuta.origen === 'generada') {
      return 'Minuta generada con los datos actuales, sin firmar';
    }
    return this.estadoMinuta.fecha ? `Minuta cargada el ${this.estadoMinuta.fecha}` : 'Minuta cargada';
  }

  get mensajeErrorMinuta(): string {
    return this.estadoMinuta.tipo === 'error' ? this.estadoMinuta.mensaje : '';
  }

  get minutaReintentable(): boolean {
    return this.estadoMinuta.tipo === 'error' && this.estadoMinuta.reintentable;
  }

  getDocumentosPrecontractuales() {
    this.gestionContractualCrudService
      .getDocumentos(
        this.consultaDocumentoVigente(
          environment.TIPO_DOCUMENTO_ID_PARAMETROS.DOCUMENTOS_PRECONTRACTUALES
        )
      )
      .subscribe({
        next: (documentos: any) => {
          const docsList = documentos?.Data || [];
          const documentoActual = docsList[0];
          if (documentoActual?.documento_enlace) {
            this.gestorDocumentalService
              .getDocumento(documentoActual.documento_enlace)
              .subscribe({
                next: (response: any) => {
                  if (response?.file) {
                    this.documentos.documentos_precontractuales = response.file;
                  }
                },
                error: (error) =>
                  console.warn('Error al obtener documentos precontractuales:', error),
              });
          }
        },
        error: (error) => {
          console.warn('No se encontraron documentos precontractuales en gestor:', error);
        },
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

  abrirModalCargarArchivo(): void {
    const dialog = this.dialog.open(SubirArchivoComponent, {
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

    if (!rol || !estados?.length) return;

    const [estadoActual, estadoAnterior] = estados;

    let estado_parametro_id = environment.ESTADOS_GENERALES.SUSCRITO;
    if (estadoActual === environment.ESTADOS_INTERNOS.APROBADO_JEFE) {
      estado_parametro_id = environment.ESTADOS_GENERALES.POR_SUSCRIBIR;
    }

    const cambio: CambioEstadoContrato = {
      usuario_id: this.usuario_id,
      usuario_rol: rol,
      estado_parametro_id,
      estado_interno_parametro_id: estadoActual,
    };

    this.crearEstadoAutomaticoContrato(cambio, estadoAnterior);
  }

  // Los dos estados se registran en el MID: al pasar a SUSCRITO asigna el número
  // de contrato y lo devuelve. El MF no lo calcula ni lo envía.
  crearEstadoAutomaticoContrato(cambio: CambioEstadoContrato, estado: number) {
    const numeroAntes = this.numero_contrato;
    this.contratoGeneralMidService
      .postEstadoContrato(this.contrato_general_id, cambio)
      .subscribe({
        next: (response: any) => {
          if (response?.Data?.estado?.id) {
            this.recibirNumero(response);
            this.crearEstadoContrato(
              {
                ...cambio,
                estado_parametro_id: environment.ESTADOS_GENERALES.SUSCRITO,
                estado_interno_parametro_id: estado,
              },
              numeroAntes
            );
          }
        },
        error: (error) =>
          this.handleError(this.mensajeDelMid(error, 'Error al crear estado automático'), error),
      });
  }

  crearEstadoContrato(cambio: CambioEstadoContrato, numeroAntes = this.numero_contrato) {
    this.contratoGeneralMidService
      .postEstadoContrato(this.contrato_general_id, cambio)
      .subscribe({
        next: (response: any) => {
          if (response?.Data?.estado?.id) {
            this.recibirNumero(response);
            const numeroNuevo = this.numero_contrato !== numeroAntes ? this.numero_contrato : '';
            this.alertService.showSuccessAlert(
              numeroNuevo
                ? `${this.textos.enviado}. Número de contrato: ${numeroNuevo}`
                : this.textos.enviado,
              'CONTRATO ENVIADO'
            );
          }
        },
        error: (error) =>
          this.handleError(this.mensajeDelMid(error, 'Error al crear estado de contrato'), error),
      });
  }

  private recibirNumero(response: any) {
    const numero = response?.Data?.numero_contrato;
    if (numero) this.numero_contrato = numero;
  }

  // El MID explica por qué no asigna el número (sin vigencia, unidad sin prefijo).
  private mensajeDelMid(error: any, porDefecto: string): string {
    return error?.status === 400 && error?.error?.Message ? error.error.Message : porDefecto;
  }
}
