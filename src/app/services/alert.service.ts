import { Injectable } from '@angular/core';
// @ts-ignore
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor() {}

  showAlert(text: string, title: string = "") {
    Swal.fire({
      icon: 'info',
      title: title,
      text: text,
      confirmButtonText: 'Aceptar',
      customClass: {
        confirmButton: 'alertaConfirmarBoton',
        cancelButton: 'alertaCancelarBoton',
        icon: 'alertaIconoWarn',
      },
    });
  }

  showSuccessAlert(text: string, title: string = 'Operación exitosa'): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      confirmButtonText: 'Aceptar',
      customClass: {
        confirmButton: 'alertaConfirmarBoton',
        cancelButton: 'alertaCancelarBoton',
        icon: 'alertaIconoSuccess',
      },
    });
  }

  showErrorAlert(text: string, title: string = 'Error') {
    Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonText: 'Aceptar',
      customClass: {
        confirmButton: 'alertaConfirmarBoton',
        cancelButton: 'alertaCancelarBoton',
      },
    });
  }

  /**
   * `target`: elemento donde se agrega la alerta. Desde un MatDialog se pasa el host del overlay, que el CDK
   * muestra en la capa superior del navegador (popover); en el body la alerta quedaría debajo del diálogo.
   * Ese host desactiva pointer-events y la alerta lo heredaría: al abrir, se reactivan en su contenedor.
   */
  showConfirmAlert(text: string, title: string = 'Atención', target?: HTMLElement): Promise<SweetAlertResult> {
    return Swal.fire({
      ...(target ? { target, didOpen: () => Swal.getContainer()?.style.setProperty('pointer-events', 'auto') } : {}),
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar',
      customClass: {
        confirmButton: 'alertaConfirmarBoton',
        cancelButton: 'alertaCancelarBoton',
        icon: 'alertaIconoConfirmacion',
      },
    });
  }

  showAlertHTML(text: string, title: string = 'Atención') {
    Swal.fire({
      title: title,
      html: text,
      icon: 'warning',
      confirmButtonText: 'Aceptar',
      customClass: {
        confirmButton: 'alertaConfirmarBoton',
        cancelButton: 'alertaCancelarBoton',
        icon: 'alertaIconoConfirmacion',
      },
    });
  }
}
