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
    pdfFile: [null as File | null, Validators.required]
  });

  constructor(
    private _formBuilder: FormBuilder,
    private dialog: MatDialog
  ) { }

  fileName: string = '';
  
  onFileSelected(event: any) {
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files ? element.files[0] : null;

    if (file && file.type === 'application/pdf') {
      this.form.patchValue({
        pdfFile: file
      });
      this.fileName = file.name;
    } else {
      this.form.patchValue({
        pdfFile: null
      });
      this.fileName = '';
    }
  }

  openPdfViewer(): void {
    const pdfFile = this.form.get('pdfFile')?.value;
    if (pdfFile) {
      this.dialog.open(PdfViewerModalComponent, {
        width: '80%',
        height: '80%',
        data: { pdfFile }
      });
    }
  }
}