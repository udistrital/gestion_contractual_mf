import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { throwError, Observable } from 'rxjs';
import Swal from 'sweetalert2';

export interface ErrorResponse {
  status: number;
  message: string;
  details?: any;
}

@Injectable({
  providedIn: 'root',
})
export class HttpErrorManager {
  constructor(private ngZone: NgZone) {}

  public handleError(error: HttpErrorResponse): Observable<ErrorResponse> {
    let errorResponse: ErrorResponse;

    if (error.error instanceof ErrorEvent) {
      errorResponse = {
        status: error.status,
        message: 'Error de red o del cliente',
        details: error.error.message
      };
      console.error('Error del cliente:', error.error.message);
    } else {
      errorResponse = {
        status: error.status,
        message: this.getErrorMessage(error),
        details: error.error
      };
      console.error(`Error del backend ${error.status}:`, error.error);
    }

    this.showErrorMessage(errorResponse);

    return throwError(errorResponse);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 400:
        return 'Solicitud incorrecta. Por favor, revise los datos enviados.';
      case 401:
        return 'No autorizado. Por favor, inicie sesión nuevamente.';
      case 403:
        return 'Acceso prohibido. No tiene permisos para realizar esta acción.';
      case 404:
        return 'Recurso no encontrado. Por favor, verifique la URL.';
      case 500:
        return 'Error interno del servidor. Por favor, intente más tarde.';
      default:
        return error.error.message || 'Ha ocurrido un error inesperado.';
    }
  }

  private showErrorMessage(error: ErrorResponse): void {
    const message = `${error.message}`;

    this.ngZone.run(() => {
      Swal.fire({
        icon: 'error',
        title: `Error ${error.status}`,
        text: message,
        confirmButtonText: 'Cerrar',
        customClass: {
          container: `status-${error.status}`
        }
      });
    });
  }
}
