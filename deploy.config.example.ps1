$Config = @{
    # FTP
    FtpHost = "89.116.192.81"
    FtpPort = 21
    FtpUser = "u744125515.cafeteriafe.gplclubsupport.com"
    FtpPass = "REEMPLAZAR_PASSWORD_FTP"
    FtpBasePath = "/domains/cafeteriafe.gplclubsupport.com/public_html"
    # Si es false, no usa fallback a '/' ni '/public_html'
    AllowFtpRootFallback = $false

    # SSH
    SshHost = "89.116.192.81"
    SshPort = 65002
    SshUser = "u744125515"
    SshPass = "REEMPLAZAR_PASSWORD_SSH"
    # Recomendado para ejecucion en batch con plink:
    # ejemplo: "ssh-ed25519 255 SHA256:ott9Cu9PDiwONAWS03/+Huan0UR4GAHYveIusjKVbVc"
    SshHostKey = ""

    # Rutas remotas
    RemotePublicPath = "/domains/cafeteriafe.gplclubsupport.com/public_html"

    # Ruta local del proyecto (por defecto autodetecta donde esta deploy.ps1)
    ProjectRoot = ""

    # Excepciones al limpiar public_html
    KeepEntries = @(
        ".well-known"
    )
}
