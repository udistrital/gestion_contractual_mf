import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PdfViewerModalComponent } from '../pdf-viewer-modal/pdf-viewer-modal.component';

@Component({
  selector: 'app-paso-documentos',
  templateUrl: './paso-documentos.component.html',
  styleUrls: ['./paso-documentos.component.css']
})
export class PasoDocumentosComponent implements OnInit {
  form: FormGroup = this.formBuilder.group({
    pdfFileName: ['', Validators.required]
  });
  pdfFile: File | null = null;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private dialog: MatDialog
  ) { }

  ngOnInit() {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;

    if (file) {
      if (file.type === 'application/pdf') {
        this.pdfFile = file;
        this.form.patchValue({ pdfFileName: file.name });
        this.errorMessage = '';
      } else {
        this.resetFileInput();
        this.errorMessage = 'Por favor, seleccione un archivo PDF válido.';
      }
    }
  }

  resetFileInput() {
    this.pdfFile = null;
    this.form.patchValue({ pdfFileName: '' });
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
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

  onSubmit() {
    if (this.form.valid && this.pdfFile) {
      console.log('Formulario enviado', this.form.value);
    } else {
      this.errorMessage = 'Por favor, seleccione un archivo PDF antes de continuar.';
    }
  }
}
