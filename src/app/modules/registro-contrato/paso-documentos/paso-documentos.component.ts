import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PdfViewerModalComponent } from '../pdf-viewer-modal/pdf-viewer-modal.component';


@Component({
  selector: 'app-paso-documentos',
  templateUrl: './paso-documentos.component.html',
  styleUrls: ['./paso-documentos.component.css']
})
export class PasoDocumentosComponent {
  form = this._formBuilder.group({
    pdfFileName: ['', Validators.required]
  });

  constructor(
    private _formBuilder: FormBuilder,
    private dialog: MatDialog
  ) { }

  pdfFile: File | null = null;

  onFileSelected(event: any) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files ? input.files[0] : null;

    if (file && file.type === 'application/pdf') {
      this.pdfFile = file;
      this.form.patchValue({
        pdfFileName: this.pdfFile.name
      });
    } else {
      this.form.patchValue({
        pdfFileName: null
      });
    }
  }

  openPdfViewer(): void {
    if (this.pdfFile) {
      this.dialog.open(PdfViewerModalComponent, {
        width: '80%',
        height: '80%',
        data: { file: this.pdfFile }
      });
    }
  }
}
