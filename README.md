# gestion_contractual_compras_contrato_mf

Cliente para la gestión, registro, actualización y consulta de contratos, parte del sistema de gestion de contratación y compras (ARGO). Este proyecto está desarrollado con Angular.

## Especificaciones Técnicas

### Tecnologías Implementadas y Versiones

- [Angular](https://angular.io/docs) 17.3
  - Incluye Animations, Common, Compiler, Core, Forms, Platform-Browser, Platform-Browser-Dynamic, Router
- [Angular Material](https://material.angular.io/) 17.3
- [Node](https://nodejs.org/en) 18.20.0
- [RxJS](https://rxjs.dev/guide/overview) ~7.8.0
- [Single-spa](https://single-spa.js.org/) >=9.0.0
  - Incluye single-spa-angular
- [SweetAlert2](https://sweetalert2.github.io/) 11.12.0
- [ts-md5](https://github.com/cotag/ts-md5) 1.3.1
- [tslib](https://github.com/Microsoft/tslib) 2.3.0
- [Zone.js](https://github.com/angular/angular/tree/master/packages/zone.js) ~0.14.0

### Variables de Entorno
```bash
# Does not apply
```

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
   npm start
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

### gestion_contractual_compras_contrato_mf

Microcliente de gestion de contratos

### Pasos para la Ejecución de gestion_contractual_compras_contrato_mf

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/udistrital/gestion_contractual_compras_contrato_mf
   ```

2. Acceder al directorio del repositorio clonado:

   ```bash
   cd gestion_contractual_compras_contrato_mf
   ```

3. Instalar las dependencias:

   ```bash
   npm install
   ```

4. Iniciar usuario_mf:

   ```bash
   npm start
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

```bash
# Developing
```

## Estado CI

```bash
# Developing
```
|
## Licencia

[This file is part of auditoria_plan_mejoramiento_usuario_mf](LICENSE)

auditoria_plan_mejoramiento_usuario_mf is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (atSara Sampaio your option) any later version.

auditoria_plan_mejoramiento_usuario_mf is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with auditoria_plan_mejoramiento_usuario_mf. If not, see https://www.gnu.org/licenses/.
