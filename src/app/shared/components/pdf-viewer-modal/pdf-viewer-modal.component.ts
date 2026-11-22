import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileService } from 'src/app/services/file.service';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { AlertService } from 'src/app/services/alert.service';
import { DocumentoContrato } from 'src/app/types/types';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';

/**
 * Datos para guardar el PDF desde el visor (acta de inicio, #359): el tipo de
 * documento del gestor (colección) y el del CRUD, y la entidad dueña.
 */
export interface DatosGuardarPdf {
  base64: string;
  nombre: string;
  descripcion: string;
  id_tipo_documento_gestor: number;
  tipo_documento_id: number;
  entidad_tipo: DocumentoContrato['entidad_tipo'];
  entidad_id: number;
}

/**
 * Visor de PDF en la plantilla de modal del MF. Es de solo lectura salvo que
 * quien lo abre envíe `datos`: solo entonces aparece "Guardar", que sube el PDF
 * al gestor documental y lo registra en documentos-contratos (acta de inicio).
 * La minuta nunca envía `datos` (decisión del 18/11, #405).
 */
@Component({
    selector: 'app-pdf-viewer-modal',
    templateUrl: './pdf-viewer-modal.component.html',
    styleUrls: ['./pdf-viewer-modal.component.css'],
    standalone: false
})
export class PdfViewerModalComponent implements OnInit {
  @ViewChild('pdfCanvas', { static: true })
  pdfCanvas!: ElementRef<HTMLCanvasElement>;

  isLoading: boolean = false;
  pdfLoading = true;
  pdfSrc?: Uint8Array;
  /** true solo si quien abre el visor envía `datos` para guardar. */
  guardarDoc: boolean = false;
  /** Título del modal; "Documentos" si quien lo abre no envía otro. */
  titulo = 'Documentos';
  /** Texto bajo el título en la plantilla de modal del MF. */
  descripcion = '';

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { file: File; titulo?: string; descripcion?: string; datos?: DatosGuardarPdf },
    private fileService: FileService,
    private alertService: AlertService,
    private gestorDocumentalService: GestorDocumentalService,
    private gestionContractualCrudService: GestionContractualCrudService
  ) {}

  async ngOnInit() {
    this.titulo = this.data.titulo || 'Documentos';
    this.descripcion = this.data.descripcion || '';
    this.guardarDoc = !!this.data.datos;
    await this.loadPdf();
  }

  async loadPdf() {
    try {
      const arrayBuffer = await this.fileService.readFileAsArrayBuffer(
        this.data.file
      );
      this.pdfSrc = new Uint8Array(arrayBuffer);
      this.pdfLoading = false;
    } catch (error) {
      this.handleError('Error al cargar el PDF', error);
    }
  }

  // Guardar el documento (pdf) en gestor_documental_mid. El tipo de documento
  // del gestor (colección) y el del CRUD llegan en data.datos
  guardarDocumentoGestorDocumental() {
    if (!this.data.datos) return;
    this.isLoading = true;

    const { base64, nombre, descripcion, id_tipo_documento_gestor } =
      this.data.datos;

    const data = [
      {
        IdTipoDocumento: id_tipo_documento_gestor,
        nombre,
        descripcion,
        metadatos: {},
        file: base64,
      },
    ];

    this.gestorDocumentalService.postAny('document/upload', data).subscribe({
      next: ({ Status, res }: { Status: string; res: any }) => {
        if (Status === '200' && res?.Id) {
          this.registrarDocumento(res);
        } else {
          this.handleError('Error al guardar el PDF');
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.handleError('Error al guardar el PDF', error),
          (this.isLoading = false);
      },
    });
  }

  // Registrar el id y uid de la respuesta del gestor_documental_mid en gestion_contractual_crud
  registrarDocumento(documento: any) {
    if (!this.data.datos) return;
    const { Id: documento_id, Enlace: documento_enlace } = documento;
    const { tipo_documento_id, entidad_tipo, entidad_id } = this.data.datos;

    const documentoContrato: DocumentoContrato = {
      tipo_documento_id,
      entidad_tipo,
      entidad_id,
      documento_id,
      documento_enlace,
    };

    this.gestionContractualCrudService
      .postDocumento(documentoContrato)
      .subscribe({
        next: (response: any) => {
          if (response?.Data?.id) {
            this.alertService.showSuccessAlert(
              'El documento del contrato se ha guardado exitosamente'
            );
          } else {
            this.alertService.showErrorAlert(
              'Error al registrar el documento del contrato'
            );
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError(
            'Error al registrar el documento del contrato',
            error
          ),
            (this.isLoading = false);
        },
      });
  }

  private handleError(message: string, error?: any, callback?: () => void) {
    console.error(message, error);
    this.alertService.showErrorAlert(message);
    if (callback) callback();
  }
}
