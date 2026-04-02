# POS Cafetería

Sistema POS (Point of Sale) para mini cafetería. Digitaliza la operación diaria con control de inventario, caja, ventas, clientes y reportes en tiempo real.

## Stack Tecnológico

- **Backend:** PHP Slim 4 + PHP-DI + MySQL
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **UI:** Shadcn UI + Lucide Icons
- **Estado:** TanStack Query + Zustand
- **Despliegue:** PowerShell Automation (SSH/SFTP vía PuTTY)

---

## Despliegue (Hostinger)

El proyecto incluye un script de automatización (`deploy.ps1`) para desplegar tanto el Frontend como el Backend directamente a Hostinger.

### Requisitos previos

1.  **PuTTY:** Tener instalados `plink.exe` y `pscp.exe` en el PATH de Windows.
2.  **Configuración:** Crea el archivo `deploy.config.ps1` a partir del ejemplo:
    ```powershell
    Copy-Item deploy.config.example.ps1 deploy.config.ps1
    ```
    Edita `deploy.config.ps1` con tus credenciales de SSH/SFTP.

### Comandos de Despliegue

Ejecuta estos comandos desde una terminal de PowerShell en la raíz del proyecto:

| Comando | Descripción |
| :--- | :--- |
| **`.\deploy.ps1`** | **Despliegue Estándar:** Compila frontend, sube código API (sin vendor) y limpia archivos antiguos en el servidor. |
| **`.\deploy.ps1 -Full`** | **Despliegue Total:** Incluye la carpeta `vendor/`, corre migraciones (`migrate`) y pobladores (`seed`) en el servidor. Úsalo para el primer despliegue o cambios en dependencias. |
| **`.\deploy.ps1 -Quick`** | **Despliegue Rápido:** Solo sube carpetas de código (`src`, `app`, `public`, `database`) y frontend. No borra archivos antiguos. Ideal para cambios visuales o lógica simple. |
| **`.\deploy.ps1 -Reset`** | **Reset de DB:** Ejecuta `composer reset` en el servidor remoto para limpiar y reiniciar la base de datos. |

#### Combinaciones útiles:

- **Instalación limpia total (Borra todo y sube todo):**
  ```powershell
  .\deploy.ps1 -Full -Reset
  ```

---

## Desarrollo Local

### Backend (API)
1. Entra en `/api`.
2. Instala dependencias: `composer install`.
3. Configura el `.env`.
4. Corre migraciones: `composer migrate`.
5. Inicia el servidor: `php -S localhost:8080 -t public`.

### Frontend
1. Entra en `/frontend`.
2. Instala dependencias: `npm install`.
3. Inicia el servidor de desarrollo: `npm run dev`.

---

## Estructura del Proyecto

- `/api`: Backend Slim PHP.
- `/frontend`: SPA React con TypeScript.
- `/htaccess`: Configuración de servidor para Hostinger (Apache).
- `deploy.ps1`: Script de automatización de despliegue.
