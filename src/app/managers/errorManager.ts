import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { throwError, Observable } from 'rxjs';

export interface ErrorResponse {
  status: number;
  message: string;
  details?: any;
}

@Injectable({
  providedIn: 'root',
})
export class HttpErrorManager {
  private defaultSnackBarConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
    panelClass: ['error-snackbar']
  };

  constructor(
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {}

  public handleError(error: HttpErrorResponse): Observable<ErrorResponse> {
    let errorResponse: ErrorResponse;

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorResponse = {
        status: error.status,
        message: 'Error de red o del cliente',
        details: error.error.message
      };
      console.error('Error del cliente:', error.error.message);
    } else {
      // Backend error
      errorResponse = {
        status: error.status,
        message: this.getErrorMessage(error),
        details: error.error
      };
      console.error(`Error del backend ${error.status}:`, error.error);
    }

    // Show error message to user
    this.showErrorMessage(errorResponse);

    // Return an observable with a user-facing error message
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
    const message = `Error ${error.status}: ${error.message}`;

    this.ngZone.run(() => {
      this.snackBar.open(message, 'Cerrar', {
        ...this.defaultSnackBarConfig,
        panelClass: [...(this.defaultSnackBarConfig.panelClass || []), `status-${error.status}`]
      });
    });
  }

  public showCustomMessage(message: string, action: string = 'Cerrar', config?: MatSnackBarConfig): void {
    this.ngZone.run(() => {
      this.snackBar.open(message, action, {
        ...this.defaultSnackBarConfig,
        ...config
      });
    });
  }

  public isOk(error: any): boolean {
    return error instanceof HttpErrorResponse && error.status === 200;
  }
}
