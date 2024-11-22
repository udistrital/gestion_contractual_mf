import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-pdf-visualizador',
  templateUrl: './pdf-visualizador.component.html',
  styleUrls: ['./pdf-visualizador.component.css'],
})
export class PdfVisualizadorComponent implements OnInit {
  @ViewChild('pdfCanvas', { static: true })
  pdfCanvas!: ElementRef<HTMLCanvasElement>;

  pdfLoaded = false;
  pdfSrc: Uint8Array | undefined;

  @Input() base64Document: string = '';
  ngOnInit() {
    this.loadPdfFromBase64(this.base64Document);
  }

  loadPdfFromBase64(base64: string) {
    try {
      const arrayBuffer = this.base64ToArrayBuffer(base64);
      this.pdfSrc = new Uint8Array(arrayBuffer);
      this.pdfLoaded = true;
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
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
}
