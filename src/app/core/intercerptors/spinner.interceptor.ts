import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize } from "rxjs";
import { SpinnerService } from "src/app/shared/services/spinner.service";

export const SpinnerIntercerptor: HttpInterceptorFn = (req, next) => {
  const spinnerSvc = inject(SpinnerService);
  spinnerSvc.show();
  return next(req).pipe(finalize(() => spinnerSvc.hide()));
};
