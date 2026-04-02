param(
    [switch]$Quick
)

$ErrorActionPreference = "Stop"

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

# 2. Funciones de Ayuda
$SshTarget = "$($Config.SshUser)@$($Config.SshHost)"
$SshPort = $Config.SshPort
$SshPass = $Config.SshPass

# Argumentos base para plink/pscp
# -batch evita que pida "Press Return to begin session"
$CommonArgs = @("-batch", "-P", "$SshPort", "-pw", "$SshPass")
if ($Config.SshHostKey) {
    $CommonArgs += "-hostkey"
    $CommonArgs += $Config.SshHostKey
}

function Invoke-Ssh {
    param([string]$Command)
    # Ejecutamos comando remoto
    plink @CommonArgs $SshTarget "$Command"
}

function Send-SecureFile {
    param($Source, $RemotePath, $IsRecursive=$false)
    # pscp espera: pscp [options] [user@]host:source target OR pscp [options] source [user@]host:target
    # Para subir: pscp source [user@]host:target
    $PscpArgs = @()
    if ($IsRecursive) { $PscpArgs += "-r" }
    foreach ($arg in $CommonArgs) { $PscpArgs += $arg }
    
    # IMPORTANTE: pscp en Windows a veces falla con asteriscos si no se manejan bien
    $PscpArgs += $Source
    # Hostinger SSH suele rootear en /home/uXXXX/
    # Usamos la ruta absoluta si es posible o relativa sin ":" inicial extra
    $PscpArgs += "$($SshTarget):public_html/$RemotePath"
    
    pscp @PscpArgs
}

Write-Host "Iniciando despliegue de POS Cafetería..." -ForegroundColor Cyan

# 3. Build Frontend
Write-Host "Preparando Frontend..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\frontend"
try {
    npm run build
} catch {
    Write-Error "Error al compilar el frontend."
    Pop-Location
    exit
}
Pop-Location

# 4. Preparar API
$TempPath = "$PSScriptRoot\temp_deploy"
if (Test-Path $TempPath) { Remove-Item -Recurse -Force $TempPath }
New-Item -ItemType Directory -Path $TempPath | Out-Null

$ZipPath = "$PSScriptRoot\api.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath }

if (-not $Quick) {
    Write-Host "Comprimiendo API completa..." -ForegroundColor Cyan
    $ApiTemp = "$TempPath\api"
    New-Item -ItemType Directory -Path $ApiTemp | Out-Null
    Copy-Item -Path "$PSScriptRoot\api\*" -Destination $ApiTemp -Recurse -Exclude "vendor", ".env", ".git", "composer.lock", "logs", "var", "tests"
    # Comprimimos el CONTENIDO de la carpeta temp_deploy/api
    Compress-Archive -Path "$ApiTemp\*" -DestinationPath $ZipPath
} else {
    Write-Host "Modo Rápido: Preparando solo archivos cambiados..." -ForegroundColor Cyan
}

# 5. Operaciones SSH (Backup y Limpieza)
Write-Host "Conectando via SSH para respaldar .env..." -ForegroundColor Cyan
# Verificamos dónde estamos parados en el servidor
$RemoteHome = Invoke-Ssh "pwd"
Write-Host "Home remota: $RemoteHome" -ForegroundColor Gray

Invoke-Ssh "mkdir -p public_html/api && if [ -f public_html/api/.env ]; then cp public_html/api/.env .env.bak; fi"

if (-not $Quick) {
    Write-Host "Limpiando archivos antiguos del frontend en el servidor..." -ForegroundColor Cyan
    $Excludes = $Config.KeepEntries + "api" + "." + ".."
    $ExcludeString = ""
    foreach ($entry in $Excludes) {
        $ExcludeString += " ! -name '$entry'"
    }
    Invoke-Ssh "find public_html -maxdepth 1 $ExcludeString ! -name 'public_html' -exec rm -rf {} +"
}

# 6. Subida de archivos
Write-Host "Subiendo archivos al servidor..." -ForegroundColor Cyan

# Subir Frontend
Write-Host "Subiendo Frontend (dist)..." -ForegroundColor Gray
# pscp no siempre expande asteriscos locales igual que la shell, enviamos la carpeta
Send-SecureFile "$PSScriptRoot\frontend\dist\" "" $true

# Subir API
if ($Quick) {
    Write-Host "Subiendo carpetas críticas de la API..." -ForegroundColor Gray
    foreach ($folder in @("app", "public", "src", "database")) {
        Send-SecureFile "$PSScriptRoot\api\$folder" "api/" $true
    }
} else {
    Write-Host "Subiendo api.zip..." -ForegroundColor Gray
    Send-SecureFile $ZipPath "api.zip"
    Write-Host "Descomprimiendo en el servidor..." -ForegroundColor Gray
    # Descomprimir en public_html/api/
    Invoke-Ssh "mkdir -p public_html/api && unzip -o public_html/api.zip -d public_html/api/ && rm public_html/api.zip"
}

# Subir .htaccess
Write-Host "Subiendo .htaccess..." -ForegroundColor Gray
Send-SecureFile "$PSScriptRoot\htaccess" ".htaccess"

# 7. Restaurar .env y Finalizar
Write-Host "Restaurando .env y finalizando..." -ForegroundColor Cyan
Invoke-Ssh "if [ -f .env.bak ]; then mv .env.bak public_html/api/.env; fi"

# Limpiar local
if (Test-Path $ZipPath) { Remove-Item $ZipPath }
if (Test-Path $TempPath) { Remove-Item -Recurse -Force $TempPath }

Write-Host "¡Despliegue completado con éxito!" -ForegroundColor Green
