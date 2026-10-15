import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";
import {BehaviorSubject, Observable} from "rxjs";
import { CDP } from '../types/types';

@Injectable({
  providedIn: 'root'
})
export class CdpsService {

  private cdpSubject = new BehaviorSubject<any[]>([]);
  cdp$ = this.cdpSubject.asObservable();

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('CDPS_SERVICE');
  }
  get(endpoint: string): Observable<any> {
    this.requestManager.setPath('CDPS_SERVICE');
    return this.requestManager.get(endpoint);
  }

  updateLocalCDP(cdpData: CDP[]) {
    this.cdpSubject.next(cdpData);
  }

  getLocalCDP(): any[] {
    return this.cdpSubject.getValue();
  }
}
