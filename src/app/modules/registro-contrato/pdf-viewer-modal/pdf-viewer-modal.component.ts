import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer-modal',
  templateUrl: './pdf-viewer-modal.component.html',
  styleUrls: ['./pdf-viewer-modal.component.css']
})
export class PdfViewerModalComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { pdfFile: File },
    private sanitizer: DomSanitizer
  ) {
    if (this.data.pdfFile) {
      this.readFile(this.data.pdfFile);
    }
  }

  pdfUrl: SafeResourceUrl | null = null;

  readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const result = e.target.result;
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(result);
      const prueba = this.extractBase64(String(this.pdfUrl));
      this.openPdf(prueba);
    };
    reader.readAsDataURL(file);
  }

  extractBase64(pdfUrl: string): string {
    let arreglodeloquesea = pdfUrl.split("base64,");
    arreglodeloquesea = arreglodeloquesea[1].split("(see");
    let b64 = arreglodeloquesea[0].trim();
    console.log(b64);
    return b64;
  }

  openPdf(base64: string) {
    if (base64) {
      const btchar = atob(base64);
      const btnumb = new Array(btchar.length);
      for (let i = 0; i < btchar.length; i++) {
        btnumb[i] = btchar.charCodeAt(i);
      }
      const btarray = new Uint8Array(btnumb);
      const blob = new Blob([btarray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const safeUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.pdfUrl = safeUrl;
    }
  }
}