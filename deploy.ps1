param(
    [string]$ConfigPath = "./deploy.config.ps1",
    [switch]$SkipBuild,
    [switch]$SkipMigrations,
    [switch]$ApiPartial,
    [switch]$FrontendOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "No se encontro el comando requerido: $Name"
    }
}

function Get-ProjectRoot {
    if ($PSScriptRoot) {
        return $PSScriptRoot
    }
    return (Get-Location).Path
}

function New-FtpRequest {
    param(
        [string]$Uri,
        [string]$Method,
        [System.Net.NetworkCredential]$Credential
    )

    $request = [System.Net.FtpWebRequest]::Create($Uri)
    $request.Credentials = $Credential
    $request.Method = $Method
    $request.UseBinary = $true
    $request.KeepAlive = $false
    $request.EnableSsl = $false
    return $request
}

function Ensure-FtpDirectory {
    param(
        [string]$DirectoryUri,
        [System.Net.NetworkCredential]$Credential,
        [hashtable]$CreatedDirectories
    )

    if ($CreatedDirectories.ContainsKey($DirectoryUri)) {
        return
    }

    try {
        $req = New-FtpRequest -Uri $DirectoryUri -Method ([System.Net.WebRequestMethods+Ftp]::MakeDirectory) -Credential $Credential
        $resp = $req.GetResponse()
        $resp.Close()
    } catch {
        $msg = $_.Exception.Message
        if ($msg -notmatch "exists|550") {
            throw
        }
    }

    $CreatedDirectories[$DirectoryUri] = $true
}

function Upload-FtpFile {
    param(
        [string]$LocalFile,
        [string]$RemoteUri,
        [System.Net.NetworkCredential]$Credential
    )

    $bytes = [System.IO.File]::ReadAllBytes($LocalFile)
    $req = New-FtpRequest -Uri $RemoteUri -Method ([System.Net.WebRequestMethods+Ftp]::UploadFile) -Credential $Credential
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $resp = $req.GetResponse()
    $resp.Close()
}

function Upload-FtpTree {
    param(
        [string]$LocalRoot,
        [string]$RemoteRootUri,
        [System.Net.NetworkCredential]$Credential
    )

    $createdDirs = @{}
    $createdDirs[$RemoteRootUri.TrimEnd('/')] = $true

    $dirs = Get-ChildItem -Path $LocalRoot -Directory -Recurse | Sort-Object FullName
    foreach ($dir in $dirs) {
        $relative = $dir.FullName.Substring($LocalRoot.Length).TrimStart('\\').Replace('\\', '/')
        $remoteDirUri = "$($RemoteRootUri.TrimEnd('/'))/$relative"
        Ensure-FtpDirectory -DirectoryUri $remoteDirUri -Credential $Credential -CreatedDirectories $createdDirs
    }

    $files = Get-ChildItem -Path $LocalRoot -File -Recurse | Sort-Object FullName
    $count = 0
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($LocalRoot.Length).TrimStart('\\').Replace('\\', '/')
        $remoteFileUri = "$($RemoteRootUri.TrimEnd('/'))/$relative"
        Upload-FtpFile -LocalFile $file.FullName -RemoteUri $remoteFileUri -Credential $Credential
        $count++
        if ($count % 25 -eq 0) {
            Write-Host "   Archivos subidos: $count"
        }
    }

    Write-Host "   Total archivos subidos: $count"
}

function Invoke-Plink {
    param(
        [string]$PlinkPath,
        [hashtable]$Config,
        [string]$Script
    )

    $target = "{0}@{1}" -f $Config.SshUser, $Config.SshHost
    & $PlinkPath -batch -ssh -P $Config.SshPort -pw $Config.SshPass $target $Script
    if (-not $?) {
        throw "Fallo la ejecucion remota por SSH."
    }
}

if (-not (Test-Path $ConfigPath)) {
    throw "No existe el archivo de configuracion: $ConfigPath"
}

. $ConfigPath

if (-not $Config) {
    throw "El archivo de configuracion debe definir la variable `$Config."
}

if ($ApiPartial -and $FrontendOnly) {
    throw "No puedes usar -ApiPartial y -FrontendOnly al mismo tiempo. Elige solo un modo."
}

foreach ($key in @('FtpHost','FtpPort','FtpUser','FtpPass','FtpBasePath','SshHost','SshPort','SshUser','SshPass','RemotePublicPath')) {
    if (-not $Config.ContainsKey($key) -or [string]::IsNullOrWhiteSpace([string]$Config[$key])) {
        throw "Falta la configuracion obligatoria: $key"
    }
}

$projectRoot = if ([string]::IsNullOrWhiteSpace([string]$Config.ProjectRoot)) { Get-ProjectRoot } else { $Config.ProjectRoot }
$projectRoot = (Resolve-Path $projectRoot).Path

$frontendPath = Join-Path $projectRoot "frontend"
$apiPath = Join-Path $projectRoot "api"
$htaccessPath = Join-Path $projectRoot "htaccess"

if (-not (Test-Path $frontendPath)) { throw "No se encontro la carpeta frontend en: $frontendPath" }
if (-not (Test-Path $apiPath)) { throw "No se encontro la carpeta api en: $apiPath" }
if (-not (Test-Path $htaccessPath)) { throw "No se encontro el archivo htaccess en: $htaccessPath" }

$tmpRoot = Join-Path $projectRoot ".deploy_tmp"
$frontendStage = Join-Path $tmpRoot "frontend_root"
$apiZip = Join-Path $tmpRoot "api.zip"

if (Test-Path $tmpRoot) {
    Remove-Item -Path $tmpRoot -Recurse -Force
}
New-Item -Path $frontendStage -ItemType Directory -Force | Out-Null

try {
    if ($ApiPartial) {
        Write-Step "Modo rapido API parcial habilitado"
        Write-Host "   Se subiran solo: api/app, api/database, api/public, api/src"
        Write-Host "   No se comprimira api completa ni se tocara frontend"
    }
    elseif ($FrontendOnly) {
        Write-Step "Modo rapido Frontend-only habilitado"
        Write-Host "   Se subira solo frontend/dist y .htaccess en la raiz"
        Write-Host "   No se tocara /api"
    }

    if ((-not $SkipBuild) -and (-not $ApiPartial)) {
        Write-Step "Build del frontend"
        Assert-Command -Name npm
        & npm run build --prefix $frontendPath
        if (-not $?) {
            throw "Fallo el build del frontend."
        }
    }

    $frontendDist = Join-Path $frontendPath "dist"
    if ((-not $ApiPartial) -and (-not (Test-Path $frontendDist))) {
        throw "No existe frontend/dist. Ejecuta el build primero."
    }

    if ((-not $ApiPartial) -and $FrontendOnly) {
        Write-Step "Preparar artefactos frontend"
        Copy-Item -Path (Join-Path $frontendDist "*") -Destination $frontendStage -Recurse -Force
        Copy-Item -Path $htaccessPath -Destination (Join-Path $frontendStage ".htaccess") -Force
    }
    elseif (-not $ApiPartial) {
        Write-Step "Preparar artefactos"
        Copy-Item -Path (Join-Path $frontendDist "*") -Destination $frontendStage -Recurse -Force
        Copy-Item -Path $htaccessPath -Destination (Join-Path $frontendStage ".htaccess") -Force
        Compress-Archive -Path $apiPath -DestinationPath $apiZip -CompressionLevel Optimal -Force
    }

    $plink = (Get-Command plink.exe -ErrorAction SilentlyContinue)
    if (-not $plink) {
        throw "No se encontro plink.exe (PuTTY). Instala PuTTY y agrega plink al PATH para ejecutar comandos SSH con password."
    }

    $remotePath = $Config.RemotePublicPath
    $credential = New-Object System.Net.NetworkCredential($Config.FtpUser, $Config.FtpPass)
    $ftpRootUri = "ftp://{0}:{1}{2}" -f $Config.FtpHost, $Config.FtpPort, $Config.FtpBasePath.TrimEnd('/')

    if ($ApiPartial) {
        Write-Step "Limpiar solo carpetas API parciales en servidor"
        $partialCleanupScript = "cd '$remotePath'; mkdir -p api; rm -rf api/app api/database api/public api/src; mkdir -p api/app api/database api/public api/src"
        Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $partialCleanupScript

        Write-Step "Subir solo carpetas API parciales por FTP"
        $apiRootUri = "$ftpRootUri/api"
        $cache = @{}
        $cache[$ftpRootUri] = $true
        $cache[$apiRootUri] = $true
        Ensure-FtpDirectory -DirectoryUri $apiRootUri -Credential $credential -CreatedDirectories $cache

        foreach ($folder in @('app','database','public','src')) {
            $localFolder = Join-Path $apiPath $folder
            if (-not (Test-Path $localFolder)) {
                throw "No existe la carpeta local requerida para modo parcial: $localFolder"
            }

            $remoteFolderUri = "$apiRootUri/$folder"
            Ensure-FtpDirectory -DirectoryUri $remoteFolderUri -Credential $credential -CreatedDirectories $cache
            Upload-FtpTree -LocalRoot $localFolder -RemoteRootUri $remoteFolderUri -Credential $credential
        }
    }
    elseif ($FrontendOnly) {
        Write-Step "Limpiar raiz remota (sin tocar /api)"
        $keepEntries = @('api', '.deploy_backup')
        if ($Config.ContainsKey('KeepEntries') -and $Config.KeepEntries) {
            $keepEntries += @($Config.KeepEntries)
        }

        $keepPatternParts = @("'.'", "'..'")
        foreach ($entry in $keepEntries) {
            $keepPatternParts += "'$entry'"
        }

        $keepCase = ($keepPatternParts -join '|')
        $frontendCleanupScript = "for entry in '$remotePath'/* '$remotePath'/.[!.]* '$remotePath'/..?*; do [ -e `"`$entry`" ] || continue; name=`$(basename `"`$entry`" ); case `"`$name`" in $keepCase) continue ;; esac; rm -rf `"`$entry`"; done"
        Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $frontendCleanupScript

        Write-Step "Subir solo frontend por FTP"
        $rootCache = @{}
        $rootCache[$ftpRootUri] = $true
        Ensure-FtpDirectory -DirectoryUri "$ftpRootUri" -Credential $credential -CreatedDirectories $rootCache
        Upload-FtpTree -LocalRoot $frontendStage -RemoteRootUri $ftpRootUri -Credential $credential
    }
    else {
        Write-Step "Limpiar carpeta remota y respaldar api/.env"
        $keepEntries = @()
        if ($Config.ContainsKey('KeepEntries') -and $Config.KeepEntries) {
            $keepEntries = @($Config.KeepEntries)
        }

        $keepPatternParts = @("'.'", "'..'", "'.deploy_backup'")
        foreach ($entry in $keepEntries) {
            $keepPatternParts += "'$entry'"
        }

        $keepCase = ($keepPatternParts -join '|')
        $cleanupScript = "mkdir -p '$remotePath/.deploy_backup'; if [ -f '$remotePath/api/.env' ]; then cp '$remotePath/api/.env' '$remotePath/.deploy_backup/api.env'; fi; for entry in '$remotePath'/* '$remotePath'/.[!.]* '$remotePath'/..?*; do [ -e `"`$entry`" ] || continue; name=`$(basename `"`$entry`" ); case `"`$name`" in $keepCase) continue ;; esac; rm -rf `"`$entry`"; done"
        Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $cleanupScript

        Write-Step "Subir frontend y api.zip por FTP"
        $rootCache = @{}
        $rootCache[$ftpRootUri] = $true
        Ensure-FtpDirectory -DirectoryUri "$ftpRootUri" -Credential $credential -CreatedDirectories $rootCache
        Upload-FtpTree -LocalRoot $frontendStage -RemoteRootUri $ftpRootUri -Credential $credential
        Upload-FtpFile -LocalFile $apiZip -RemoteUri "$ftpRootUri/api.zip" -Credential $credential

        Write-Step "Descomprimir backend y restaurar api/.env"
        $extractScript = "cd '$remotePath'; unzip -oq api.zip -d '$remotePath'; rm -f api.zip; if [ -f '$remotePath/.deploy_backup/api.env' ]; then mkdir -p '$remotePath/api'; cp '$remotePath/.deploy_backup/api.env' '$remotePath/api/.env'; fi"
        Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $extractScript
    }

    if ((-not $SkipMigrations) -and (-not $FrontendOnly)) {
        Write-Step "Ejecutar migraciones y seeders"
        $migrateScript = "cd '$remotePath/api'; php vendor/bin/phinx migrate -e production; php vendor/bin/phinx seed:run -e production"
        Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $migrateScript
    }

    Write-Step "Deployment completado"
    Write-Host "Frontend publicado en / y backend en /api"
}
finally {
    if (Test-Path $tmpRoot) {
        Remove-Item -Path $tmpRoot -Recurse -Force
    }
}
