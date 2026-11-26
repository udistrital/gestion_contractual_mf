import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, ElementRef } from '@angular/core';

@Component({
    selector: 'app-pdf-visualizador',
    templateUrl: './pdf-visualizador.component.html',
    styleUrls: ['./pdf-visualizador.component.css'],
    standalone: false
})
export class PdfVisualizadorComponent implements OnChanges {
  @ViewChild('pdfCanvas', { static: true })
  pdfCanvas!: ElementRef<HTMLCanvasElement>;

  pdfLoaded = false;
  pdfSrc: Uint8Array | undefined;

  @Input() base64Document: string | null = '';

  /** El documento no se pudo decodificar o el visor no pudo abrirlo. */
  @Output() errorDocumento = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['base64Document']) {
      this.loadPdfFromBase64(changes['base64Document'].currentValue);
    }
  }

  /** Carga el PDF; con un valor vacío o null vacía el visor (no conserva el anterior). */
  loadPdfFromBase64(base64: string | null | undefined) {
    if (!base64) {
      this.vaciar();
      return;
    }
    try {
      const arrayBuffer = this.base64ToArrayBuffer(base64);
      this.pdfSrc = new Uint8Array(arrayBuffer);
      this.pdfLoaded = true;
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.vaciar();
      this.errorDocumento.emit();
    }
  }

  /** Error del visor (pdf.js) al abrir el documento. */
  onErrorPdf(error: unknown) {
    console.error('El visor no pudo abrir el PDF:', error);
    this.vaciar();
    this.errorDocumento.emit();
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64); // Decodifica Base64
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer; // Retorna el ArrayBuffer
  }

  private vaciar() {
    this.pdfSrc = undefined;
    this.pdfLoaded = false;
  }
}
