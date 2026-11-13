import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const alertService = inject(AlertService);
  const menuInfo = localStorage.getItem('menu');
  const menuPermisos = menuInfo ? JSON.parse(atob(menuInfo)) : null;

  // Preferir la URL destino de la navegación (RouterStateSnapshot), con fallback a window.location
  let path = state?.url ? state.url.split('?')[0].split('#')[0] : '';
  if (!path) {
    try {
      path = new URL(window.location.href).pathname;
    } catch {
      path = '';
    }
  }

  // Obtener parámetros de la ruta
  const params = route.params;

  if (menuPermisos != null) {
    // Pasar tanto la URL como los parámetros a la función de verificación
    if (checkUrlExists(menuPermisos, path, params)) {
      return true;
    }
  }

  alertService.showErrorAlert("No tiene permisos para realizar esta acción", "Acceso prohibido");
  return false;
};

// Recorrer el menú para verificar si la URL y los parámetros existen
function checkUrlExists(menuItems: any, targetUrl: string, params: any): boolean {
  if (!Array.isArray(menuItems)) {
    return false;
  }
  return menuItems.some((item: any) => {
    // Verificar la URL y los parámetros
    if (item?.Url && rutasCoinciden(item.Url, targetUrl, params) && checkParams(item.Params, params)) {
      return true;
    }
    if (item.Opciones && item.Opciones.length > 0) {
      return checkUrlExists(item.Opciones, targetUrl, params);
    }
    return false;
  });
}

function normalizarRuta(urlStr: string): string {
  if (!urlStr) return '';
  let u = urlStr.trim();
  u = u.split('?')[0].split('#')[0];
  if (!u.startsWith('/')) u = '/' + u;
  if (u.length > 1 && u.endsWith('/')) u = u.slice(0, -1);
  return u;
}

function rutasCoinciden(itemUrl: string, targetUrl: string, params: any): boolean {
  const normItem = normalizarRuta(itemUrl);
  const normTarget = normalizarRuta(targetUrl);

  if (normItem === normTarget) {
    return true;
  }

  // Compatibilidad con o sin prefijo /gestion-contractual
  const sinPrefijoItem = normItem.replace(/^\/gestion-contractual/, '');
  const sinPrefijoTarget = normTarget.replace(/^\/gestion-contractual/, '');

  if (sinPrefijoItem === sinPrefijoTarget) {
    return true;
  }

  // Soporte para rutas con parámetros dinámicos (p. ej. /contratos/detalle/:contratoId)
  if (params && Object.keys(params).length > 0) {
    let targetBase = normTarget;
    let targetBaseSinPrefijo = sinPrefijoTarget;
    for (const valor of Object.values(params)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        const strVal = String(valor);
        if (targetBase.endsWith('/' + strVal)) {
          targetBase = targetBase.slice(0, -(strVal.length + 1));
        }
        if (targetBaseSinPrefijo.endsWith('/' + strVal)) {
          targetBaseSinPrefijo = targetBaseSinPrefijo.slice(0, -(strVal.length + 1));
        }
      }
    }
    if (normItem === targetBase || sinPrefijoItem === targetBaseSinPrefijo) {
      return true;
    }
  }

  return false;
}

// Verificar los parámetros de la ruta
function checkParams(expectedParams: any, actualParams: any): boolean {
  if (!expectedParams) {
    return true; // No se requieren parámetros específicos
  }
  for (let key in expectedParams) {
    if (expectedParams[key] !== actualParams[key]) {
      return false; // Un parámetro no coincide
    }
  }
  return true; // Todos los parámetros coinciden
}
