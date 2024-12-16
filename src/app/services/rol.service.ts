import { Injectable } from '@angular/core';
import { ImplicitAutenticationService } from './implicit_autentication.service';

@Injectable({
  providedIn: 'root',
})
export class RolService {
  private roles: string[] = [];

  constructor(private autenticationService: ImplicitAutenticationService) {}

  async cargarRol() {
    const rolesValidos = [
      'CONTRATISTA',
      'JEFE_DEPENDENCIA',
      'ABOGADO',
      'ORDENADOR_DEL_GASTO',
    ];
    const rolesObtenidos: any = await this.autenticationService.getRole();
    this.roles = rolesValidos.filter((rol) => rolesObtenidos.includes(rol));
  }

  getRol(): string[] {
    return this.roles;
  }
}
