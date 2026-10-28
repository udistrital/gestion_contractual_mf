import { Injectable } from '@angular/core';
import { ImplicitAutenticationService } from './implicit_autentication.service';

@Injectable({
  providedIn: 'root',
})
export class RolService {
  private roles: string[] = [];
  private resolverCarga!: () => void;
  private readonly carga = new Promise<void>((resolve) => {
    this.resolverCarga = resolve;
  });

  constructor(private autenticationService: ImplicitAutenticationService) {}

  async cargarRol() {
    const rolesValidos = [
      'JEFE_CONTRATACION_RECTOR',
      'JEFE_CONTRATACION_IDEXUD',
      'ABOGADO_CONTRATACION_RECTOR',
      'ABOGADO_CONTRATACION_IDEXUD',
      'ORDENADOR_DEL_GASTO',
      'PROVEEDOR',
      'ADMIN_ARGO',
    ];
    try {
      const rolesObtenidos: any = await this.autenticationService.getRole();
      this.roles = rolesValidos.filter((rol) => rolesObtenidos.includes(rol));
    } finally {
      this.resolverCarga();
    }
  }

  /** Se resuelve al terminar la primera carga de roles, con o sin éxito. */
  rolCargado(): Promise<void> {
    return this.carga;
  }

  getRol(): string[] {
    return this.roles;
  }
}
