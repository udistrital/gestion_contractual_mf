import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cargar-archivo',
  templateUrl: './cargar-archivo.component.html',
  styleUrl: './cargar-archivo.component.css',
})
export class CargarArchivoComponent {
  archivo: File | null = null;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  isLoading = false;
  fileTypeXLSX =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { contrato_general_id: number },
    public dialogRef: MatDialogRef<CargarArchivoComponent>,
    private gestorDocumentalService: GestorDocumentalService,
    private contratoGeneralMidService: ContratoGeneralMidService,
    private alertService: AlertService
  ) {}

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file) {
      if (file.type !== this.fileTypeXLSX) {
        this.alertService.showAlert(
          'Por favor, seleccione un archivo válido en formato .xlsx'
        );
        this.removerArchivo();
        return;
      }
      this.archivo = file;
    }
  }

  onFileInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  removerArchivo(): void {
    this.archivo = null;
    this.fileInput.nativeElement.value = '';
  }

  cargarArchivo(): void {
    if (!this.archivo) {
      return;
    }
    this.isLoading = true;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result.split(',')[1];
      this.realizarCargaMasiva(base64String);
      // this.guardarArchivoGestorDocumental(base64String);
    };
    reader.readAsDataURL(this.archivo);
  }

  // Enviar XLSX al MID
  realizarCargaMasiva(base64String: any) {
    const data = {
      base64data: base64String,
      complement: { contrato_general_id: this.data.contrato_general_id },
    };
    this.contratoGeneralMidService
      .postCargaMasivaEspecificaciones(data)
      .subscribe({
        next: (response: any) => {
          console.log('Archivo enviado exitosamente al MID', response);
          if (response && response.Data) {
            this.mostrarResultados(response.Data);
          }
        },
        error: (error: any) => {
          this.dialogRef.close();
          console.error('Error al enviar el archivo al MID', error);
        },
        complete: () => {
          this.isLoading = false;
          this.dialogRef.close();
        },
      });
  }

  guardarArchivoGestorDocumental(base64String: any) {
    const data = [
      {
        IdTipoDocumento:
          environment.TIPO_DOCUMENTO_ID_GESTOR_DOCUMENTAL.PLANTILLAS_XLSX,
        nombre: this.archivo!.name,
        descripcion: 'Documento xlsx especificaciones técnicas',
        metadatos: {},
        file: base64String,
      },
    ];
    this.gestorDocumentalService
      .postAny('document/uploadAnyFormat', data)
      .subscribe({
        next: (response: any) => {
          console.log('Documento subido exitosamente', response);
        },
        error: (error: any) => {
          console.error('Error al subir el documento', error);
        },
      });
  }

  mostrarResultados(data: any): void {
    let mensaje = '';
    if (data.Erróneos?.length > 0) {
      mensaje += `<strong>Se encontraron los siguientes errores en algunos registros:</strong><ul><br>`;
      data.Erróneos.forEach((error: any) => {
        mensaje += `<li><strong>Fila ${error.Idx}:</strong> ${error.Error}</li>`;
      });
      mensaje += `</ul>`;
    }
    if (data.Correctos?.length > 0) {
      mensaje += `<br><strong>Registros correctos:</strong><ul>`;
      mensaje += data.Correctos.join(', ') + '<br><br>';
    }
    this.alertService.showAlertHTML(mensaje, '');
  }
}
