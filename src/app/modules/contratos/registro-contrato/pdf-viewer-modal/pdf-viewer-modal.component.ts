import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileService } from 'src/app/services/file.service';
import { AlertService } from 'src/app/services/alert.service';

/** Visor de PDF en la plantilla de modal del MF (solo lectura). */
@Component({
    selector: 'app-pdf-viewer-modal',
    templateUrl: './pdf-viewer-modal.component.html',
    styleUrls: ['./pdf-viewer-modal.component.css'],
    standalone: false
})
export class PdfViewerModalComponent implements OnInit {
  @ViewChild('pdfCanvas', { static: true })
  pdfCanvas!: ElementRef<HTMLCanvasElement>;

  pdfLoading = true;
  pdfSrc?: Uint8Array;
  /** Título del modal; "Documentos" si quien lo abre no envía otro. */
  titulo = 'Documentos';
  /** Texto bajo el título en la plantilla de modal del MF. */
  descripcion = '';

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { file: File; titulo?: string; descripcion?: string },
    private fileService: FileService,
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    this.titulo = this.data.titulo || 'Documentos';
    this.descripcion = this.data.descripcion || '';
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

  private handleError(message: string, error?: any) {
    console.error(message, error);
    this.alertService.showErrorAlert(message);
  }
}
