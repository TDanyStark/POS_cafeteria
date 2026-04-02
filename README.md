# Deploy rapido POS Cafeteria

Este proyecto incluye un script de despliegue automatizado en `deploy.ps1`.

## 1) Configuracion inicial

1. Copia la plantilla de configuracion:

```powershell
Copy-Item .\deploy.config.example.ps1 .\deploy.config.ps1
```

2. Edita `deploy.config.ps1` con tus credenciales FTP/SSH y rutas remotas.

3. Verifica que `plink` este disponible (PuTTY):

```powershell
Get-Command plink.exe
```

## 2) Comandos de deploy

### Deploy completo (frontend + backend + migraciones + seeders)

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -ConfigPath .\deploy.config.ps1
```

### Deploy rapido solo API parcial

Sube solo estas carpetas:
- `api/app`
- `api/database`
- `api/public`
- `api/src`

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -ConfigPath .\deploy.config.ps1 -ApiPartial
```

### Deploy rapido solo Frontend

Sube solo `frontend/dist` y `.htaccess` a la raiz remota.

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -ConfigPath .\deploy.config.ps1 -FrontendOnly
```

## 3) Flags utiles

### Saltar build frontend

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -ConfigPath .\deploy.config.ps1 -SkipBuild
```

### Saltar migraciones y seeders

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -ConfigPath .\deploy.config.ps1 -SkipMigrations
```

Combinaciones comunes:

```powershell
# API parcial sin migraciones
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -ConfigPath .\deploy.config.ps1 -ApiPartial -SkipMigrations

# Frontend only sin build (si ya existe frontend/dist actualizado)
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -ConfigPath .\deploy.config.ps1 -FrontendOnly -SkipBuild
```

## 4) Notas

- No uses `-ApiPartial` y `-FrontendOnly` al mismo tiempo.
- El archivo `deploy.config.ps1` esta ignorado por git para proteger credenciales.
- En deploy completo se comprime `api` para acelerar subida por FTP.
