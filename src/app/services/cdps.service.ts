import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class CdpsService {

  private cdpSubject = new BehaviorSubject<any[]>([]);
  cdp$ = this.cdpSubject.asObservable();

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('CDPS_SERVICE');
  }
  get(endpoint: string) {
    this.requestManager.setPath('CDPS_SERVICE');
    return this.requestManager.get(endpoint);
  }

  updateLocalCDP(cdpData: any[]) {
    localStorage.setItem('cdp', JSON.stringify(cdpData));
    this.cdpSubject.next(cdpData);
  }

  getLocalCDP(): any[] {
    const cdpString = localStorage.getItem('cdp');
    return cdpString ? JSON.parse(cdpString) : [];
  }
}
