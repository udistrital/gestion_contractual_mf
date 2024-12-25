import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {FileService} from "src/app/services/file.service";
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { DocumentoContrato } from 'src/app/types/types';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pdf-viewer-modal',
  templateUrl: './pdf-viewer-modal.component.html',
  styleUrls: ['./pdf-viewer-modal.component.css'],
})
export class PdfViewerModalComponent implements OnInit {
  @ViewChild('pdfCanvas', { static: true })
  pdfCanvas!: ElementRef<HTMLCanvasElement>;

  pdfLoaded = false;
  pdfSrc: Uint8Array | undefined;
  guardarDoc: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { file: File; documento: any },
    private fileService: FileService,
    private alertService: AlertService,
    private gestorDocumentalService: GestorDocumentalService,
    private contratoGeneralCrudService: ContratoGeneralCrudService
  ) {}

  async ngOnInit() {
    this.guardarDoc = this.data.documento;
    this.loadPdf();
  }

  async loadPdf() {
    try {
      const arrayBuffer = await this.fileService.readFileAsArrayBuffer(
        this.data.file
      );
      this.pdfSrc = new Uint8Array(arrayBuffer);
      this.pdfLoaded = true;
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  // Guardar el documento del contrato (pdf) en gestor_documental_mid
  guardarDocumentoGestorDocumental() {
    const { base64, nombre, descripcion } = this.data.documento;
    const data = [
      {
        IdTipoDocumento: environment.TIPO_DOCUMENTO_ID_GESTOR_DOCUMENTAL.MINUTAS,
        nombre,
        descripcion,
        metadatos: {},
        file: base64,
      },
    ];

    this.gestorDocumentalService.postAny('document/upload', data).subscribe({
      next: ({ Status, res }: { Status: string; res: any }) => {
        if (Status == '200' && res?.Id) {
          this.registrarDocumento(res);
        } else {
          this.alertService.showErrorAlert('Error al guardar pdf');
        }
      },
      error: (error) =>
        this.handleError('Error al guardar pdf en gestor documental', error),
    });
  }

  // Registrar el id y uid de la respuesta del gestor_documental_mid en gestion_contractual_crud
  registrarDocumento(documento: any) {
    const { Id: documento_id, Enlace: documento_enlace } = documento;
    const { contrato_general_id } = this.data.documento;
    const documentoContrato: DocumentoContrato = {
      tipo_documento_id: environment.TIPO_DOCUMENTO_ID_PARAMETROS.MINUTA,
      documento_id,
      documento_enlace,
      contrato_general_id,
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
            this.alertService.showErrorAlert('Error al registrar documento');
          }
        },
        error: (error) =>
          this.handleError(
            'Error al registrar el documento del contrato',
            error
          ),
      });
  }

  private handleError(message: string, error: any, callback?: () => void) {
    console.error(message, error);
    this.alertService.showErrorAlert(message);
    if (callback) callback();
  }
}
