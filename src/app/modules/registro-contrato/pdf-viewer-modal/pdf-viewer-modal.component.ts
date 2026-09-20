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
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';

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
  guardarDoc: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { file: File; datos: any },
    private fileService: FileService,
    private alertService: AlertService,
    private gestorDocumentalService: GestorDocumentalService,
    private contratoGeneralCrudService: ContratoGeneralCrudService
  ) {}

  async ngOnInit() {
    this.guardarDoc = this.data.datos || false;
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

  // Guardar el documento del contrato (pdf) en gestor_documental_mid
  guardarDocumentoGestorDocumental() {
    this.isLoading = true;

    const { base64, nombre, descripcion } = this.data.datos;
    const idTipoDoc = environment.TIPO_DOCUMENTO_ID_GESTOR_DOCUMENTAL.MINUTAS;

    const data = [
      {
        IdTipoDocumento: idTipoDoc,
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
    const { Id: documento_id, Enlace: documento_enlace } = documento;
    const { contrato_general_id, usuario_id, usuario_rol } = this.data.datos;

    const documentoContrato: DocumentoContrato = {
      tipo_documento_id: environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA,
      contrato_general_id,
      usuario_id,
      usuario_rol,
      documento_id,
      documento_enlace,
    };

    this.contratoGeneralCrudService
      .postDocumentoContrato(documentoContrato)
      .subscribe({
        next: (response: any) => {
          if (response.id) {
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
