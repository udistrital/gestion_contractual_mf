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
import { textosMensaje, flujoEstados, rolPorEstado } from './roles_estados';
import Swal from 'sweetalert2';

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
    private gestorDocumentalService: GestorDocumentalService,
    private rolService: RolService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.roles = this.rolService.getRol();
    this.mostrarBotones = true;
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
    this.gestorDocumentalService.getDocumento(documento.documento_enlace).subscribe({
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

  async openMensajeConfirmacion(): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: this.mensaje.confirmacion,
      html: `
        <div class="file-upload-container">
          <div class="file-input-wrapper">
            <input
              type="text"
              id="fileName"
              class="file-name-input"
              readonly
              placeholder="Ningún archivo seleccionado"
            />
            <button
              type="button"
              class="mat-raised-button mat-primary file-upload-button"
              onclick="document.getElementById('fileInput').click()"
            >
              <i class="material-icons">upload</i>
              <span>Seleccionar PDF</span>
            </button>
          </div>
          <input
            id="fileInput"
            type="file"
            accept=".pdf"
            style="display: none;"
          />
          <p id="errorMessage" class="error-message" style="display: none;">
            <i class="material-icons">error</i>
            <span></span>
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: this.mensaje.accion,
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'mat-raised-button mat-primary',
        cancelButton: 'mat-stroked-button mat-primary'
      },
      buttonsStyling: false,
      didOpen: () => {
        // Añadir estilos necesarios
        const style = document.createElement('style');
        style.textContent = `
          .file-upload-container {
            margin-bottom: 15px;
          }
          
          .file-input-wrapper {
            display: flex;
            align-items: center;
          }
          
          .file-name-input {
            flex-grow: 1;
            padding: 8px;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 4px 0 0 4px;
            background-color: #f5f5f5;
            color: rgba(0, 0, 0, 0.87);
          }
          
          .file-upload-button {
            border-radius: 0 4px 4px 0 !important;
          }
          
          .error-message {
            display: flex;
            align-items: center;
            margin-top: 8px;
            color: #f44336;
          }
          
          .error-message i {
            margin-right: 8px;
          }
          
          .btn-container {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
          }
          
          .mat-raised-button, .mat-stroked-button {
            padding: 0 16px;
            line-height: 36px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          
          .mat-primary {
            background-color: #8b0000;
            color: white;
          }
          
          .mat-stroked-button.mat-primary {
            background-color: transparent;
            border: 1px solid #8b0000;
            color: #8b0000;
          }
          
          .material-icons {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        `;
        document.head.appendChild(style);

        this.setupFileUploadListeners();
      }
    });

    if (formValues) {
      await this.uploadAndProcessDocument(formValues.file);
    }
  }

  private setupFileUploadListeners(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const fileName = document.getElementById('fileName') as HTMLInputElement;
    const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;
    const previewBtn = document.getElementById('previewBtn') as HTMLButtonElement;

    fileInput.addEventListener('change', (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (file) {
        if (file.type === 'application/pdf') {
          fileName.value = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
          errorMessage.style.display = 'none';
          previewBtn.style.display = 'inline-block';
        } else {
          fileName.value = '';
          errorMessage.style.display = 'block';
          errorMessage.textContent = 'Por favor, seleccione un archivo PDF válido.';
          previewBtn.style.display = 'none';
          fileInput.value = '';
        }
      }
    });
  }

  private async uploadAndProcessDocument(file: File): Promise<void> {
    try {
      const base64String = await this.fileToBase64(file);

      const payload = [{
        IdTipoDocumento: 1,
        nombre: file.name,
        descripcion: 'Documento firmado',
        metadatos: {},
        file: base64String.split(',')[1]
      }];

      const response = await this.documentosService
        .postAny('/document/uploadAnyFormat', payload)
        .toPromise();

      if (response) {
        await this.alertService.showSuccessAlert('Documento subido exitosamente');
        this.aprobarContrato();
      }
    } catch (error) {
      this.alertService.showErrorAlert(
        'Error al subir el documento',
        'Por favor, intente de nuevo.'
      );
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
