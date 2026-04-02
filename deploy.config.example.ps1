$Config = @{
    # FTP
    FtpHost = "89.116.192.81"
    FtpPort = 21
    FtpUser = "u744125515.cafeteriafe.gplclubsupport.com"
    FtpPass = "REEMPLAZAR_PASSWORD_FTP"
    FtpBasePath = "/public_html"

    # SSH
    SshHost = "89.116.192.81"
    SshPort = 65002
    SshUser = "u744125515"
    SshPass = "REEMPLAZAR_PASSWORD_SSH"

    # Rutas remotas
    RemotePublicPath = "/domains/cafeteriafe.gplclubsupport.com/public_html"

    # Ruta local del proyecto (por defecto autodetecta donde esta deploy.ps1)
    ProjectRoot = ""

    # Excepciones al limpiar public_html
    KeepEntries = @(
        ".well-known"
    )
}
