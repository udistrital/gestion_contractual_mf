import { InjectionToken } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProveedorHuella } from './huella-navegador.models';
import { FingerprintjsProveedor } from './proveedores/fingerprintjs.proveedor';
import { ThumbmarkjsProveedor } from './proveedores/thumbmarkjs.proveedor';

/**
 * Adaptador de la librería de fingerprinting, elegido con
 * environment.HUELLA_NAVEGADOR.LIBRERIA. Cambiar de librería no toca el
 * servicio ni el contrato con el backend.
 */
export const PROVEEDOR_HUELLA = new InjectionToken<ProveedorHuella>(
  'PROVEEDOR_HUELLA',
  {
    providedIn: 'root',
    factory: () =>
      environment.HUELLA_NAVEGADOR.LIBRERIA === 'thumbmarkjs'
        ? new ThumbmarkjsProveedor()
        : new FingerprintjsProveedor(),
  },
);
