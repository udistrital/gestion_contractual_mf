import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SpinnerService {
  private requestCount = 0;
  private readonly spinner$ = new BehaviorSubject<boolean>(false);

  isLoading = this.spinner$.asObservable();

  show() {
    this.requestCount++;
    this.spinner$.next(true);
  }

  hide() {
    this.requestCount = Math.max(0, this.requestCount - 1);
    if (this.requestCount === 0) {
      this.spinner$.next(false);
    }
  }
}
