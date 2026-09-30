# gestion_contractual_mf

Cliente para la gestión, registro, actualización y consulta de contratos, parte del sistema de gestion de contratación y compras (ARGO). Este proyecto está desarrollado con Angular.

## Especificaciones Técnicas

### Tecnologías Implementadas y Versiones

- [Angular](https://angular.io/docs) 21.2
  - Incluye Animations, Common, Compiler, Core, Forms, Platform-Browser, Router
- [Angular Material](https://material.angular.io/) 21.2
- [Node](https://nodejs.org/en) 24
- [RxJS](https://rxjs.dev/guide/overview) ~7.8.0
- [Single-spa](https://single-spa.js.org/) >=9.0.0
  - Incluye single-spa-angular
- [SweetAlert2](https://sweetalert2.github.io/) 11.26.25
- [tslib](https://github.com/Microsoft/tslib) 2.8.1
- [Zone.js](https://github.com/angular/angular/tree/master/packages/zone.js) ~0.15.1
- [Jest](https://jestjs.io/) 30.0

### Módulos y Rutas del Sistema

- **Gestión de Contratos:**
  - `/contratos/registrar`: Registro paso a paso de contratos mediante stepper.
  - `/contratos/consultar`: Consulta y filtrado avanzado de contratos institucionales.
  - `/contratos/:idContrato/documentos`: Revisión y gestión documental asociada a un contrato.
- **Gestión de Actas de Inicio (Migrado desde `acta_inicio_mf`):**
  - `/contratos/actas/registrar`: Registro de actas de inicio vinculadas a la contratación institucional.
- **Gestión de Pólizas (Migrado desde `poliza_mf`):**
  - `/contratos/polizas/registrar`: Registro de pólizas, asociación a contratos y configuración de amparos.
  - `/contratos/polizas/consultar`: Consulta y visualización del estado de pólizas por contrato.
  - `/contratos/polizas/listado`: Listado tabular de pólizas y amparos registrados.
  - Paso **Garantías** del registro de contrato (`/contratos/registrar`): creación, edición y eliminación de los amparos del contrato.

### Endpoints de Pólizas y Amparos

Las pólizas y los amparos se consumen únicamente de `gestion_contractual_crud` y `gestion_contractual_mid` mediante `src/app/services/polizas.service.ts`. Ya no se usan `poliza_crud` ni `poliza_mid`.

| Servicio | Método y endpoint | Uso |
|---|---|---|
| CRUD | `GET amparos-polizas?query={"contrato_general_id":id,"activo":true}&limit=0` | Listar los amparos de un contrato |
| CRUD | `POST amparos-polizas` (arreglo) | Crear amparos en lote |
| CRUD | `PUT amparos-polizas/:id` | Editar un amparo o vincularlo (`poliza_id`) a una póliza |
| CRUD | `DELETE amparos-polizas/:id` | Borrado lógico de un amparo |
| CRUD | `GET polizas?query={"contrato_general_id":id,"activo":true}&limit=1` | Consultar la póliza de un contrato |
| CRUD | `POST polizas` / `PUT polizas/:id` | Crear o actualizar la póliza |
| MID | `GET amparos-contratos/:id` | Amparos de un contrato con el nombre del parámetro |

Documentación detallada de la migración y de las pruebas: [`docs/integracion-polizas-352.md`](docs/integracion-polizas-352.md).

### Variables de Entorno y Microservicios Relacionados

| Variable | Descripción / Endpoint Predeterminado |
|---|---|
| `PARAMETROS_SERVICE` | API de parámetros institucionales OAS |
| `GESTION_CONTRACTUAL_CRUD_SERVICE` | Microservicio CRUD de contratos (`localhost:8080`) |
| `GESTION_CONTRACTUAL_MID_SERVICE` | Microservicio MID de contratación (`localhost:8081`). Pólizas y amparos se consumen aquí (`amparos-contratos/:id`) y en `GESTION_CONTRACTUAL_CRUD_SERVICE` (`polizas`, `amparos-polizas`) |
| `TERCEROS_CRUD` | Microservicio CRUD de terceros e identificación (`/apioas/terceros_crud/v1/`) |
| `GESTOR_DOCUMENTAL_SERVICE` | API del Gestor Documental MID v1 |

## Ejecución del Proyecto

Este proyecto es parte de una infraestructura de microfrontend implementada con la librería Single-SPA. Para ejecutarlo correctamente, es necesario levantar dos aplicaciones independientes: el **Root** y el **Core**.

### Root

El Root contiene la lógica de Argo

### Pasos para la Ejecución del Root

1. Clonar el repositorio del Root:

   ```bash
   git clone https://github.com/udistrital/gestion_contractual_compras_root_mf
   ```

2. Acceder al directorio del repositorio clonado:

   ```bash
   cd gestion_contractual_compras_root_mf
   ```

3. Instalar las dependencias:

   ```bash
   npm install
   ```

4. Iniciar el Root:
   ```bash
   npm run start
   ```

### Core

El Core contiene componentes generales que construyen el layout y administran aspectos como la autenticación.

### Pasos para la Ejecución del Core

1. Clonar el repositorio del Core:

   ```bash
   git clone https://github.com/udistrital/core_mf_cliente
   ```

2. Acceder al directorio del repositorio clonado:

   ```bash
   cd core_mf_cliente
   ```

3. Instalar las dependencias:

   ```bash
   npm install
   ```

4. Iniciar el Core:

   ```bash
   npm start
   ```

### gestion_contractual_mf

Microcliente de gestion de contratos

### Pasos para la Ejecución de gestion_contractual_mf

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/udistrital/gestion_contractual_mf
   ```

2. Acceder al directorio del repositorio clonado:

   ```bash
   cd gestion_contractual_mf
   ```

3. Instalar las dependencias:

   ```bash
   pnpm install
   ```

4. Iniciar usuario_mf:

   ```bash
   pnpm run start
   ```

Con estos pasos, se tendrán las partes mínimas necesarias para ejecutar el proyecto en un entorno local.

## Ejecución Dockerfile

```bash
# Does not apply
```

## Ejecución docker-compose

```bash
# Does not apply
```

## Ejecución Pruebas

### Unitarias (Jest)

```bash
pnpm run test
```

### Requisitos previos para integración y E2E

Las pruebas de integración y E2E usan servicios reales, no mocks. Antes de correrlas verifica:

1. **VPN institucional activa.** `gestion_contractual_mid` consume `ENDP_PARAMETROS_CRUD` (red institucional). Sin VPN, `GET amparos-contratos/:id` responde `500 Error al consultar amparos del contrato` y falla la prueba de integración `amparos-contratos`.
2. **Servicios levantados en local:**

   | Servicio | Puerto | Necesario para |
   |---|---|---|
   | `gestion_contractual_crud` | `:8080` | Integración y E2E |
   | `gestion_contractual_mid` | `:8081` | Integración y E2E |
   | `gestion_contractual_mf` (`pnpm run start`) | `:4201` | Solo E2E |
   | Root single-spa (`gestion_contractual_compras_root_mf`) | `:4200` | Solo E2E |

   Si el MF (`:4201`) no está arriba, el root no monta la vista y las pruebas E2E fallan con `getByText('Asociar Contratos')` no encontrado.
3. **Google Chrome instalado** (solo E2E; la config usa `channel: 'chrome'`).
4. **Contrato de pruebas disponible** (ver variables `E2E_*` más abajo).

Comprobación rápida de los servicios:

```bash
curl -s -o /dev/null -w "%{http_code}\n" localhost:4200   # root
curl -s -o /dev/null -w "%{http_code}\n" localhost:4201   # MF
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080   # CRUD
curl -s -o /dev/null -w "%{http_code}\n" localhost:8081   # MID
```

### Integración (Playwright, sin navegador)

Verifican el contrato HTTP entre el MF y los servicios reales de pólizas y amparos. Requieren `gestion_contractual_crud` en `:8080` y `gestion_contractual_mid` en `:8081`.

```bash
pnpm run test:integracion
```

### E2E de UI (Playwright + Google Chrome)

Recorren el flujo de pólizas y amparos en el navegador. El MF es single-spa y no monta solo, por lo que se prueba a través del root. Requieren, además de CRUD y MID, el MF en `:4201` y el root en `:4200`.

```bash
pnpm run test:e2e
pnpm run test:e2e -- --headed   # para ver el navegador
```

Las pruebas de integración y E2E escriben en la base de datos de desarrollo sobre un contrato de pruebas y eliminan lógicamente lo que crean (registros con el prefijo `E2E-`).

| Variable | Por defecto | Descripción |
|---|---|---|
| `E2E_CONTRATO_ID` | `13` | Contrato de pruebas. Debe existir y no tener póliza ni amparos propios |
| `E2E_VIGENCIA` | `2026` | Vigencia del contrato de pruebas |
| `CRUD_URL` | `http://localhost:8080` | URL de `gestion_contractual_crud` |
| `MID_URL` | `http://localhost:8081` | URL de `gestion_contractual_mid` |
| `ROOT_URL` | `http://localhost:4200` | URL del root (solo E2E) |

## Estado CI

| Develop | Release | Master |
| -- | -- | -- |
| [![Build Status](https://hubci.portaloas.udistrital.edu.co/api/badges/udistrital/gestion_contractual_mf/status.svg)](https://hubci.portaloas.udistrital.edu.co/udistrital/gestion_contractual_mf) | [![Build Status](https://hubci.portaloas.udistrital.edu.co/api/badges/udistrital/gestion_contractual_mf/status.svg?ref=refs/heads/release/0.0.1)](https://hubci.portaloas.udistrital.edu.co/udistrital/gestion_contractual_mf) | [![Build Status](https://hubci.portaloas.udistrital.edu.co/api/badges/udistrital/gestion_contractual_mf/status.svg?ref=refs/heads/develop)](https://hubci.portaloas.udistrital.edu.co/udistrital/gestion_contractual_mf) |

## Licencia

[This file is part of auditoria_plan_mejoramiento_usuario_mf](LICENSE)

auditoria_plan_mejoramiento_usuario_mf is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (atSara Sampaio your option) any later version.

auditoria_plan_mejoramiento_usuario_mf is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with auditoria_plan_mejoramiento_usuario_mf. If not, see https://www.gnu.org/licenses/.

