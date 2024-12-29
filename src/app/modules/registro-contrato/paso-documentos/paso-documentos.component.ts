import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PdfViewerModalComponent } from '../pdf-viewer-modal/pdf-viewer-modal.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-paso-documentos',
  templateUrl: './paso-documentos.component.html',
  styleUrls: ['./paso-documentos.component.css'],
})
export class PasoDocumentosComponent implements OnInit {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  form: FormGroup = this.formBuilder.group({
    pdfFileName: ['', Validators.required],
  });
  pdfFile: File | null = null;
  errorMessage: string = '';

  constructor(
    private alertService: AlertService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private gestorDocumentalService: GestorDocumentalService
  ) {}

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
    const fileInput = document.getElementById(
      'file-upload'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  openPdfViewer(): void {
    if (this.pdfFile) {
      this.dialog.open(PdfViewerModalComponent, {
        width: '80%',
        height: '80%',
        data: { file: this.pdfFile },
      });
    }
  }

  onSubmit() {
    if (this.form.valid && this.pdfFile) {
      console.log('Formulario enviado', this.form.value);
      this.uploadDocument();
    } else {
      this.errorMessage =
        'Por favor, seleccione un archivo PDF antes de continuar.';
    }
  }

  uploadDocument() {
    if (!this.pdfFile) {
      this.errorMessage = 'No se ha seleccionado ningún archivo.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result.split(',')[1];

      const payload = [
        {
          IdTipoDocumento: 1,
          nombre: this.pdfFile!.name,
          descripcion: 'Documento del Contratista',
          metadatos: {},
          file: base64String,
        },
      ];

      this.gestorDocumentalService
        .postAny('/document/uploadAnyFormat', payload)
        .subscribe({
          next: (response) => {
            this.alertService.showSuccessAlert('Documento subido exitosamente');
          },
          error: (error) => {
            this.alertService.showErrorAlert(
              'Error al subir el documento',
              'Por favor, intente de nuevo.'
            );
            this.errorMessage =
              'Error al subir el documento. Por favor, intente de nuevo.';
          },
        });
    };
    reader.readAsDataURL(this.pdfFile);
  }
}
