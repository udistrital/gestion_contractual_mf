import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { DocumentoContrato } from 'src/app/types/types';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';

@Component({
  selector: 'app-cargar-archivo',
  templateUrl: './cargar-archivo.component.html',
  styleUrl: './cargar-archivo.component.css',
})
export class CargarArchivoComponent {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  archivo: File | null = null;
  isLoading = false;
  textos: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<CargarArchivoComponent>,
    private gestorDocumentalService: GestorDocumentalService,
    private alertService: AlertService,
    private contratoGeneralCrudService: ContratoGeneralCrudService
  ) {
    this.textos = data.textos;
  }

  onFileSelected(event: any): void {
    const file = event.target.files ? event.target.files[0] : null;
    if (file && file.type === 'application/pdf') {
      this.archivo = file;
    } else {
      this.alertService.showAlert(
        'Por favor, seleccione un archivo válido en formato .pdf'
      );
      this.removerArchivo();
    }
  }

  abrirGestorArchivos(): void {
    this.fileInput.nativeElement.click();
  }

  removerArchivo(): void {
    this.archivo = null;
    this.fileInput.nativeElement.value = '';
  }

  cargarArchivo(): void {
    if (!this.archivo) return;

    this.isLoading = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const base64String = e.target.result.split(',')[1];
      this.guardarDocumentoGestorDocumental(base64String);
    };
    reader.readAsDataURL(this.archivo);
  }

  // Guardar el documento del contrato (pdf) en gestor_documental_mid
  guardarDocumentoGestorDocumental(base64: any) {
    this.isLoading = true;

    const { nombre, descripcion } = this.data.datos;
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
            this.dialogRef.close({ confirmado: true });
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
