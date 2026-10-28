import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SpinnerService {
  private requestCount = 0;
  private readonly spinner$ = new BehaviorSubject<boolean>(false);
  private timeoutId: any = null;

  isLoading = this.spinner$.asObservable();

  show() {
    this.requestCount++;
    this.spinner$.next(true);

    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        if (this.requestCount > 0) {
          console.warn('SpinnerService: Tiempo límite excedido. Ocultando spinner por seguridad.');
          this.reset();
        }
      }, 7000);
    }
  }

  hide() {
    this.requestCount = Math.max(0, this.requestCount - 1);
    if (this.requestCount === 0) {
      this.spinner$.next(false);
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }

  reset() {
    this.requestCount = 0;
    this.spinner$.next(false);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
