import { Injectable } from '@angular/core';
import {RequestManager} from "../managers/requestManager";

@Injectable({
  providedIn: 'root'
})
export class CdpsService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('CDPS_SERVICE');
  }
  get(endpoint: string) {
    this.requestManager.setPath('CDPS_SERVICE');
    return this.requestManager.get(endpoint);
  }

}
