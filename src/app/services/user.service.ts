import { Injectable } from '@angular/core';
import { decrypt } from './../utils/util-encrypt';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}

  // Método para obtener el persona_id desencriptado desde el localStorage
  public getPersonaId(): Promise<number> {
    return new Promise((resolve, reject) => {
      const strcryptedId = localStorage.getItem('persona_id');
      const strId = decrypt(strcryptedId);
      if (strId) {
        resolve(parseInt(strId, 10));
      } else {
        reject(new Error('No id found'));
      }
    });
  }

  // Método para decodificar la información del usuario almacenada
  private decodeUser(): any {
    const strUser = localStorage.getItem("user");
    if (strUser === null || strUser === "") {
      throw new Error("No user information found");
    } else {
      try {
        const strdecoded = atob(strUser);
        const parsed = JSON.parse(strdecoded);
        if (parsed.user && parsed.userService) {
          return parsed;
        } else {
          throw new Error("Incomplete user information");
        }
      } catch (error) {
        throw new Error("Invalid user information: " + error);
      }
    }
  }

  // Método para obtener los roles del usuario
  public getUserRoles(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      try {
        const { user, userService } = this.decodeUser();
        const roleUser = typeof user.role !== 'undefined' ? user.role as string[] : [];
        const roleUserService = typeof userService.role !== 'undefined' ? userService.role as string[] : [];
        const combinedRoles = roleUser.concat(roleUserService).filter((data: string) => !data.includes('/'));
        const roles = Array.from(new Set(combinedRoles));
        resolve(roles);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Método para obtener el email del usuario
  public getUserEmail(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const { user, userService } = this.decodeUser();
        if (user.email) {
          resolve(user.email);
        } else if (userService.email) {
          resolve(userService.email);
        } else {
          reject(new Error("No email found"));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // Método para obtener el documento del usuario, compuesto o no
  public getUserDocument(compuesto: boolean = false): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const { user, userService } = this.decodeUser();
        const documentToSearch = compuesto ? 'documento_compuesto' : 'documento';
        if (user[documentToSearch]) {
          resolve(user[documentToSearch]);
        } else if (userService[documentToSearch]) {
          resolve(userService[documentToSearch]);
        } else {
          reject(new Error("No document found"));
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}
