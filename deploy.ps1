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

function Normalize-ConfigValue {
    param([string]$Value)

    $normalized = [string]$Value
    $normalized = $normalized.Trim()
    $normalized = $normalized.Replace([char]0x2018, "'")
    $normalized = $normalized.Replace([char]0x2019, "'")
    $normalized = $normalized.Replace([char]0x201C, '"')
    $normalized = $normalized.Replace([char]0x201D, '"')
    $normalized = $normalized.Trim('"', "'")
    return $normalized
}

function Normalize-RemotePath {
    param([string]$Path)

    $remotePath = Normalize-ConfigValue -Value $Path
    $remotePath = $remotePath.Replace('\\', '/')
    $remotePath = $remotePath.TrimEnd('/')

    if ($remotePath -match '^/domains/') {
        return "~$remotePath"
    }

    if ($remotePath -match '^domains/') {
        return "~/$remotePath"
    }

    return $remotePath
}

function Resolve-RemoteAbsolutePath {
    param(
        [string]$RemotePath,
        [string]$SshUser
    )

    $path = Normalize-RemotePath -Path $RemotePath
    $path = $path.Replace('\\', '/')

    if ($path -match '^~/') {
        return "/home/$SshUser/$($path.Substring(2))"
    }

    if ($path -eq '~') {
        return "/home/$SshUser"
    }

    if ($path -match '^domains/') {
        return "/home/$SshUser/$path"
    }

    if ($path -match '^/domains/') {
        return "/home/$SshUser$path"
    }

    return $path
}

function Normalize-FtpBasePath {
    param([string]$BasePath)

    $ftpPath = Normalize-ConfigValue -Value $BasePath
    $ftpPath = $ftpPath.Replace('\\', '/')

    if ([string]::IsNullOrWhiteSpace($ftpPath)) {
        return '/'
    }

    if (-not $ftpPath.StartsWith('/')) {
        $ftpPath = "/$ftpPath"
    }

    if ($ftpPath.Length -gt 1) {
        $ftpPath = $ftpPath.TrimEnd('/')
    }

    return $ftpPath
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
        $status = ''
        if ($_.Exception -and $_.Exception.PSObject.Properties['Response'] -and $_.Exception.Response) {
            $status = $_.Exception.Response.StatusDescription
        }
        $combined = "$msg $status"
        if ($combined -match "exist|550") {
            if (-not (Test-FtpPath -Uri $DirectoryUri -Credential $Credential)) {
                throw "No se pudo crear/acceder al directorio FTP: $DirectoryUri. Detalle: $combined"
            }
        }
        else {
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

    try {
        $bytes = [System.IO.File]::ReadAllBytes($LocalFile)
        $req = New-FtpRequest -Uri $RemoteUri -Method ([System.Net.WebRequestMethods+Ftp]::UploadFile) -Credential $Credential
        $req.ContentLength = $bytes.Length
        $stream = $req.GetRequestStream()
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Close()
        $resp = $req.GetResponse()
        $resp.Close()
    }
    catch {
        throw "Error subiendo archivo por FTP. Local: '$LocalFile' Remote: '$RemoteUri'. Detalle: $($_.Exception.Message)"
    }
}

function Remove-FtpFile {
    param(
        [string]$RemoteUri,
        [System.Net.NetworkCredential]$Credential
    )

    $req = New-FtpRequest -Uri $RemoteUri -Method ([System.Net.WebRequestMethods+Ftp]::DeleteFile) -Credential $Credential
    $resp = $req.GetResponse()
    $resp.Close()
}

function Remove-FtpDirectory {
    param(
        [string]$DirectoryUri,
        [System.Net.NetworkCredential]$Credential
    )

    $req = New-FtpRequest -Uri $DirectoryUri -Method ([System.Net.WebRequestMethods+Ftp]::RemoveDirectory) -Credential $Credential
    $resp = $req.GetResponse()
    $resp.Close()
}

function Test-FtpUploadAccess {
    param(
        [string]$DirectoryUri,
        [System.Net.NetworkCredential]$Credential
    )

    $probeFile = [System.IO.Path]::GetTempFileName()
    $probeName = ".deploy_probe_{0}.txt" -f ([Guid]::NewGuid().ToString('N'))
    $probeUri = "$($DirectoryUri.TrimEnd('/'))/$probeName"

    try {
        [System.IO.File]::WriteAllText($probeFile, "probe")
        Upload-FtpFile -LocalFile $probeFile -RemoteUri $probeUri -Credential $Credential
        return $true
    }
    catch {
        return $false
    }
    finally {
        try {
            Remove-FtpFile -RemoteUri $probeUri -Credential $Credential
        }
        catch {
        }

        if (Test-Path $probeFile) {
            Remove-Item -Path $probeFile -Force
        }
    }
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

function Test-FtpPath {
    param(
        [string]$Uri,
        [System.Net.NetworkCredential]$Credential
    )

    try {
        $req = New-FtpRequest -Uri $Uri -Method ([System.Net.WebRequestMethods+Ftp]::ListDirectory) -Credential $Credential
        $resp = $req.GetResponse()
        $resp.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Resolve-FtpRootUri {
    param(
        [hashtable]$Config,
        [System.Net.NetworkCredential]$Credential,
        [string]$PreferredPath = ""
    )

    $ftpHost = Normalize-ConfigValue -Value $Config.FtpHost
    $port = [string]$Config.FtpPort
    $configuredPath = Normalize-FtpBasePath -BasePath $Config.FtpBasePath

    $candidates = @($configuredPath)
    if (-not [string]::IsNullOrWhiteSpace($PreferredPath)) {
        $candidates += (Normalize-FtpBasePath -BasePath $PreferredPath)
    }
    $candidates += '/'
    $allowFallback = $false
    if ($Config.ContainsKey('AllowFtpRootFallback')) {
        $allowFallback = [bool]$Config.AllowFtpRootFallback
    }
    if ($allowFallback) {
        $candidates += '/public_html'
    }
    $candidates = $candidates | Select-Object -Unique
    foreach ($path in $candidates) {
        $candidateUri = "ftp://{0}:{1}{2}" -f $ftpHost, $port, $path
        if (Test-FtpPath -Uri $candidateUri -Credential $Credential) {
            if (Test-FtpUploadAccess -DirectoryUri $candidateUri -Credential $Credential) {
                if ($path -ne $configuredPath) {
                    Write-Host "   FtpBasePath '$configuredPath' no accesible. Usando '$path'." -ForegroundColor Yellow
                }
                Write-Host "   FTP root activo: $candidateUri"
                return $candidateUri
            }
        }
    }

    throw "No se pudo acceder por FTP a ninguna ruta candidata ($($candidates -join ', ')). Revisa FtpBasePath/RemotePublicPath y permisos FTP."
}

function Resolve-FtpDeployUri {
    param(
        [string]$FtpRootUri,
        [string]$RemotePath,
        [System.Net.NetworkCredential]$Credential,
        [string]$SshUser
    )

    $candidates = @()

    if ($RemotePath -match '/public_html$') {
        $forcedCandidates = @(
            "$($FtpRootUri.TrimEnd('/'))/public_html",
            "$($FtpRootUri.TrimEnd('/'))/domains/$($RemotePath.Split('/')[4])/public_html"
        ) | Select-Object -Unique

        foreach ($forced in $forcedCandidates) {
            if (Test-FtpPath -Uri $forced -Credential $Credential) {
                if (Test-FtpUploadAccess -DirectoryUri $forced -Credential $Credential) {
                    Write-Host "   FTP deploy path forzado por RemotePublicPath: $forced" -ForegroundColor Yellow
                    return $forced
                }
            }
        }

        Write-Host "   No existe path FTP directo a public_html; se usara root FTP y publicacion por SSH." -ForegroundColor Yellow
        return $FtpRootUri
    }

    $candidates += $FtpRootUri

    $homePrefix = "/home/$SshUser"
    if ($RemotePath.StartsWith($homePrefix)) {
        $relative = $RemotePath.Substring($homePrefix.Length)
        if (-not [string]::IsNullOrWhiteSpace($relative)) {
            $relative = $relative.TrimStart('/')
            if (-not [string]::IsNullOrWhiteSpace($relative)) {
                $candidates += "$($FtpRootUri.TrimEnd('/'))/$relative"
            }
        }
    }

    $candidates = $candidates | Select-Object -Unique
    foreach ($uri in $candidates) {
        if (Test-FtpPath -Uri $uri -Credential $Credential) {
            if (Test-FtpUploadAccess -DirectoryUri $uri -Credential $Credential) {
                if ($uri -ne $FtpRootUri) {
                    Write-Host "   FTP deploy path ajustado a: $uri" -ForegroundColor Yellow
                }
                return $uri
            }
        }
    }

    return $FtpRootUri
}

function Invoke-Plink {
    param(
        [string]$PlinkPath,
        [hashtable]$Config,
        [string]$Script
    )

    $target = "{0}@{1}" -f $Config.SshUser, $Config.SshHost
    & $PlinkPath -batch -ssh -P $Config.SshPort -hostkey $Config.SshHostKey -pw $Config.SshPass $target $Script
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

if (-not $Config.ContainsKey('SshHostKey') -or [string]::IsNullOrWhiteSpace([string]$Config.SshHostKey)) {
    throw "Falta 'SshHostKey' en la configuracion. Agrega la huella publica para evitar errores de host key en batch."
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
    $plink = (Get-Command plink.exe -ErrorAction SilentlyContinue)
    if (-not $plink) {
        throw "No se encontro plink.exe (PuTTY). Instala PuTTY y agrega plink al PATH para ejecutar comandos SSH con password."
    }

    $remotePath = Resolve-RemoteAbsolutePath -RemotePath $Config.RemotePublicPath -SshUser $Config.SshUser
    $credential = New-Object System.Net.NetworkCredential($Config.FtpUser, $Config.FtpPass)

    $preferredFtpPath = ""
    if ($remotePath -match '^/home/[^/]+/(.+)$') {
        $preferredFtpPath = "/$($Matches[1])"
    }
    elseif ($remotePath.StartsWith('/')) {
        $preferredFtpPath = $remotePath
    }

    $ftpRootUri = Resolve-FtpRootUri -Config $Config -Credential $credential -PreferredPath $preferredFtpPath
    $ftpDeployUri = Resolve-FtpDeployUri -FtpRootUri $ftpRootUri -RemotePath $remotePath -Credential $credential -SshUser $Config.SshUser
    $remoteHomePath = "/home/$($Config.SshUser)"
    $remoteStagingPath = "$remoteHomePath/.deploy_upload"
    $useSshPublish = ($ftpDeployUri -eq $ftpRootUri)

    Write-Step "Preflight de conectividad"
    $sshPreflightScript = "mkdir -p '$remotePath'; test -d '$remotePath'"
    Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $sshPreflightScript
    if (-not (Test-FtpUploadAccess -DirectoryUri $ftpDeployUri -Credential $credential)) {
        throw "Preflight FTP fallo: no hay permisos de escritura en $ftpDeployUri"
    }

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

    if ($ApiPartial) {
        Write-Step "Limpiar solo carpetas API parciales en servidor"
        $partialCleanupScript = "cd '$remotePath'; mkdir -p api; rm -rf api/app api/database api/public api/src; mkdir -p api/app api/database api/public api/src"
        Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $partialCleanupScript

        if ($useSshPublish) {
            Write-Step "Preparar staging remoto API parcial"
            $preparePartialStaging = "mkdir -p '$remoteStagingPath/api_partial'; rm -rf '$remoteStagingPath/api_partial/app' '$remoteStagingPath/api_partial/database' '$remoteStagingPath/api_partial/public' '$remoteStagingPath/api_partial/src'"
            Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $preparePartialStaging
        }

        Write-Step "Subir solo carpetas API parciales por FTP"
        $apiRootUri = if ($useSshPublish) { "$ftpDeployUri/.deploy_upload/api_partial" } else { "$ftpDeployUri/api" }
        $cache = @{}
        $cache[$ftpRootUri] = $true
        $cache[$ftpDeployUri] = $true
        if ($useSshPublish) {
            $cache["$ftpDeployUri/.deploy_upload"] = $true
            Ensure-FtpDirectory -DirectoryUri "$ftpDeployUri/.deploy_upload" -Credential $credential -CreatedDirectories $cache
        }
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

        if ($useSshPublish) {
            Write-Step "Aplicar API parcial desde staging"
            $applyPartialScript = "mkdir -p '$remotePath/api'; rm -rf '$remotePath/api/app' '$remotePath/api/database' '$remotePath/api/public' '$remotePath/api/src'; cp -a '$remoteStagingPath/api_partial/app' '$remotePath/api/'; cp -a '$remoteStagingPath/api_partial/database' '$remotePath/api/'; cp -a '$remoteStagingPath/api_partial/public' '$remotePath/api/'; cp -a '$remoteStagingPath/api_partial/src' '$remotePath/api/'; rm -rf '$remoteStagingPath'"
            Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $applyPartialScript
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

        if ($useSshPublish) {
            Write-Step "Preparar staging remoto frontend"
            $prepareFrontendStaging = "mkdir -p '$remoteStagingPath/frontend'"
            Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $prepareFrontendStaging
        }

        Write-Step "Subir solo frontend por FTP"
        $rootCache = @{}
        $rootCache[$ftpRootUri] = $true
        $rootCache[$ftpDeployUri] = $true
        if ($useSshPublish) {
            $rootCache["$ftpDeployUri/.deploy_upload"] = $true
            Ensure-FtpDirectory -DirectoryUri "$ftpDeployUri/.deploy_upload" -Credential $credential -CreatedDirectories $rootCache
            Ensure-FtpDirectory -DirectoryUri "$ftpDeployUri/.deploy_upload/frontend" -Credential $credential -CreatedDirectories $rootCache
            Upload-FtpTree -LocalRoot $frontendStage -RemoteRootUri "$ftpDeployUri/.deploy_upload/frontend" -Credential $credential
            Write-Step "Publicar frontend desde staging"
            $publishFrontendScript = "mkdir -p '$remotePath'; cp -a '$remoteStagingPath/frontend/.' '$remotePath/'; rm -rf '$remoteStagingPath'"
            Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $publishFrontendScript
        }
        else {
            Ensure-FtpDirectory -DirectoryUri "$ftpDeployUri" -Credential $credential -CreatedDirectories $rootCache
            Upload-FtpTree -LocalRoot $frontendStage -RemoteRootUri $ftpDeployUri -Credential $credential
        }
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

        if ($useSshPublish) {
            Write-Step "Preparar staging remoto full deploy"
            $prepareFullStaging = "mkdir -p '$remoteStagingPath/frontend'"
            Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $prepareFullStaging
        }

        Write-Step "Subir frontend y api.zip por FTP"
        $rootCache = @{}
        $rootCache[$ftpRootUri] = $true
        $rootCache[$ftpDeployUri] = $true
        if ($useSshPublish) {
            $rootCache["$ftpDeployUri/.deploy_upload"] = $true
            Ensure-FtpDirectory -DirectoryUri "$ftpDeployUri/.deploy_upload" -Credential $credential -CreatedDirectories $rootCache
            Ensure-FtpDirectory -DirectoryUri "$ftpDeployUri/.deploy_upload/frontend" -Credential $credential -CreatedDirectories $rootCache
            Upload-FtpTree -LocalRoot $frontendStage -RemoteRootUri "$ftpDeployUri/.deploy_upload/frontend" -Credential $credential
            Upload-FtpFile -LocalFile $apiZip -RemoteUri "$ftpDeployUri/.deploy_upload/api.zip" -Credential $credential
        }
        else {
            Ensure-FtpDirectory -DirectoryUri "$ftpDeployUri" -Credential $credential -CreatedDirectories $rootCache
            Upload-FtpTree -LocalRoot $frontendStage -RemoteRootUri $ftpDeployUri -Credential $credential
            Upload-FtpFile -LocalFile $apiZip -RemoteUri "$ftpDeployUri/api.zip" -Credential $credential
        }

        Write-Step "Validar artefacto api.zip en servidor"
        $zipCheckScript = if ($useSshPublish) { "if [ ! -f '$remoteStagingPath/api.zip' ]; then echo 'No se encontro api.zip en $remoteStagingPath'; exit 1; fi" } else { "if [ ! -f '$remotePath/api.zip' ]; then echo 'No se encontro api.zip en $remotePath'; exit 1; fi" }
        Invoke-Plink -PlinkPath $plink.Source -Config $Config -Script $zipCheckScript

        Write-Step "Descomprimir backend y restaurar api/.env"
        $extractScript = if ($useSshPublish) { "mkdir -p '$remotePath'; cp -a '$remoteStagingPath/frontend/.' '$remotePath/'; unzip -oq '$remoteStagingPath/api.zip' -d '$remotePath'; rm -f '$remoteStagingPath/api.zip'; if [ -f '$remotePath/.deploy_backup/api.env' ]; then mkdir -p '$remotePath/api'; cp '$remotePath/.deploy_backup/api.env' '$remotePath/api/.env'; fi; rm -rf '$remoteStagingPath'" } else { "cd '$remotePath'; unzip -oq api.zip -d '$remotePath'; rm -f api.zip; if [ -f '$remotePath/.deploy_backup/api.env' ]; then mkdir -p '$remotePath/api'; cp '$remotePath/.deploy_backup/api.env' '$remotePath/api/.env'; fi" }
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
