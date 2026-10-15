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
    try {
      localStorage.setItem('paso-info-presupuestal-cdps', JSON.stringify(cdpData));
    } catch (e) {
      console.error('Error guardando CDPs locales:', e);
    }
  }

  getLocalCDP(): any[] {
    const mem = this.cdpSubject.getValue();
    if (mem && mem.length > 0) {
      return mem;
    }
    try {
      const saved = localStorage.getItem('paso-info-presupuestal-cdps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cdpSubject.next(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error recuperando CDPs locales:', e);
    }
    return [];
  }
}
