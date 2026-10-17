import { HttpContextToken, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize } from "rxjs";
import { SpinnerService } from "src/app/shared/services/spinner.service";

/**
 * Permite que una petición en segundo plano (p. ej. la huella del navegador)
 * no muestre el spinner global.
 */
export const OMITIR_SPINNER = new HttpContextToken<boolean>(() => false);

export const SpinnerIntercerptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(OMITIR_SPINNER)) {
    return next(req);
  }
  const spinnerSvc = inject(SpinnerService);
  spinnerSvc.show();
  return next(req).pipe(finalize(() => spinnerSvc.hide()));
};
