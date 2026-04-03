param(
    [switch]$Quick,
    [switch]$Full,        # Incluye la carpeta vendor + ejecuta migrate/seed
    [switch]$Reset        # Ejecuta 'composer reset' en el servidor
)

$ErrorActionPreference = "Stop"
$DeployStart = Get-Date

# 1. Cargar Configuración
$ConfigPath = "$PSScriptRoot\deploy.config.ps1"
if (-not (Test-Path $ConfigPath)) {
    if (Test-Path "$PSScriptRoot\deploy.config.example.ps1") {
        Copy-Item "$PSScriptRoot\deploy.config.example.ps1" $ConfigPath
        Write-Host "Se ha creado 'deploy.config.ps1'. Por favor edítalo con tus credenciales." -ForegroundColor Yellow
    } else {
        Write-Error "No se encontró 'deploy.config.ps1' ni el ejemplo."
    }
    exit
}

. $ConfigPath

# 2. Rutas Absolutas del Servidor
$RemotePath = "/home/u744125515/domains/cafeteriafe.gplclubsupport.com/public_html"
$RemoteApiPath = "$RemotePath/api"

# 3. Funciones de Ayuda
$SshTarget = "$($Config.SshUser)@$($Config.SshHost)"
$SshPort = $Config.SshPort
$SshPass = $Config.SshPass

$CommonArgs = @("-batch", "-P", "$SshPort", "-pw", "$SshPass")
if ($Config.SshHostKey) {
    $CommonArgs += "-hostkey"
    $CommonArgs += $Config.SshHostKey
}

function Invoke-Ssh {
    param([string]$Command, [string]$WorkDir = $RemotePath)
    # Ejecutamos comando asegurando que estamos en la carpeta correcta
    $FullCommand = "cd $WorkDir && $Command"
    plink @CommonArgs $SshTarget "$FullCommand" 2>&1
}

function Send-SecureFile {
    param($Source, $RemoteFileName)
    $Target = "$($SshTarget):$RemotePath/$RemoteFileName"
    $PscpArgs = @()
    foreach ($arg in $CommonArgs) { $PscpArgs += $arg }
    $PscpArgs += $Source
    $PscpArgs += $Target
    
    pscp @PscpArgs
}

Write-Host "Iniciando despliegue de POS Cafetería..." -ForegroundColor Cyan

# 4. Build Frontend
Write-Host "Preparando Frontend..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\frontend"
try { npm run build } catch { Write-Error "Build frontend falló"; Pop-Location; exit }
Pop-Location

# 5. Preparar Paquetes ZIP
$TempPath = "$PSScriptRoot\temp_deploy"
if (Test-Path $TempPath) { Remove-Item -Recurse -Force $TempPath }
New-Item -ItemType Directory -Path $TempPath | Out-Null

Write-Host "Comprimiendo archivos para subida..." -ForegroundColor Cyan

# Frontend ZIP
$FrontendZip = "$TempPath\frontend.zip"
Compress-Archive -Path "$PSScriptRoot\frontend\dist\*" -DestinationPath $FrontendZip

# API ZIP
$ApiZip = "$TempPath\api.zip"
if ($Quick) {
    Write-Host "Modo Rápido: Solo carpetas de código (app, public, src, database)..." -ForegroundColor Gray
    $ApiTemp = "$TempPath\api_quick"
    New-Item -ItemType Directory -Path "$ApiTemp\api" | Out-Null
    foreach ($folder in @("app", "public", "src", "database")) {
        if (Test-Path "$PSScriptRoot\api\$folder") {
            Copy-Item -Path "$PSScriptRoot\api\$folder" -Destination "$ApiTemp\api\$folder" -Recurse
        }
    }
    Compress-Archive -Path "$ApiTemp\*" -DestinationPath $ApiZip
} elseif ($Full) {
    Write-Host "Modo FULL: Incluyendo carpeta vendor (esto tardará más)..." -ForegroundColor Yellow
    $ApiTemp = "$TempPath\api_full"
    New-Item -ItemType Directory -Path "$ApiTemp\api" | Out-Null
    Copy-Item -Path "$PSScriptRoot\api\*" -Destination "$ApiTemp\api" -Recurse -Exclude ".env", ".git", "logs", "var", "tests"
    Compress-Archive -Path "$ApiTemp\*" -DestinationPath $ApiZip
} else {
    Write-Host "Modo Estándar: Sin carpeta vendor..." -ForegroundColor Gray
    $ApiTemp = "$TempPath\api_std"
    New-Item -ItemType Directory -Path "$ApiTemp\api" | Out-Null
    Copy-Item -Path "$PSScriptRoot\api\*" -Destination "$ApiTemp\api" -Recurse -Exclude "vendor", ".env", ".git", "composer.lock", "logs", "var", "tests"
    Compress-Archive -Path "$ApiTemp\*" -DestinationPath $ApiZip
}

# 6. Backup y Limpieza
Write-Host "Respaldando .env en el servidor..." -ForegroundColor Cyan
Invoke-Ssh "mkdir -p api && [ -f api/.env ] && cp api/.env ../.env_pos.bak || echo 'Sin .env previo'"

if (-not $Quick) {
    Write-Host "Limpiando servidor (excepto api/ y excepciones)..." -ForegroundColor Cyan
    $Excludes = $Config.KeepEntries + "api" + "." + ".."
    $ExcludeString = ""
    foreach ($entry in $Excludes) { $ExcludeString += " ! -name '$entry'" }
    Invoke-Ssh "find . -maxdepth 1 $ExcludeString ! -name '.' -exec rm -rf {} +"
}

# 7. Subir y Descomprimir
Write-Host "Subiendo paquetes ZIP..." -ForegroundColor Cyan
Send-SecureFile $FrontendZip "frontend.zip"
Send-SecureFile $ApiZip "api.zip"

Write-Host "Desplegando en el servidor..." -ForegroundColor Cyan
Invoke-Ssh "unzip -o frontend.zip && unzip -o api.zip && rm frontend.zip api.zip"

# Subir .htaccess
Write-Host "Subiendo .htaccess..." -ForegroundColor Cyan
Send-SecureFile "$PSScriptRoot\htaccess" ".htaccess"

# 8. Restaurar .env
Write-Host "Restaurando .env..." -ForegroundColor Cyan
Invoke-Ssh "[ -f ../.env_pos.bak ] && mv ../.env_pos.bak api/.env || echo 'No hay backup que restaurar'"

# 9. Tareas de Base de Datos (Nuevas banderas)
if ($Reset) {
    Write-Host "Ejecutando COMPOSER RESET en el servidor..." -ForegroundColor Yellow
    Invoke-Ssh "composer reset" -WorkDir $RemoteApiPath
}

if ($Full) {
    Write-Host "Modo Full Detectado: Ejecutando MIGRACIONES y SEEDERS..." -ForegroundColor Cyan
    Invoke-Ssh "composer migrate" -WorkDir $RemoteApiPath
    Invoke-Ssh "composer seed" -WorkDir $RemoteApiPath
}

# 10. Limpieza Local
if (Test-Path $TempPath) { Remove-Item -Recurse -Force $TempPath }

$DeployEnd = Get-Date
$Elapsed = $DeployEnd - $DeployStart
Write-Host "¡Despliegue completado con éxito!" -ForegroundColor Green
Write-Host "Tiempo total: $([math]::Floor($Elapsed.TotalMinutes))m $($Elapsed.Seconds)s" -ForegroundColor Cyan
