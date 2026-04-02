$Config = @{
    # FTP
    FtpHost = "89.116.192.81"
    FtpPort = 21
    FtpUser = "u744125515.cafeteriafe.gplclubsupport.com"
    FtpPass = "REEMPLAZAR_PASSWORD_FTP"

    # SSH
    SshHost = "89.116.192.81"
    SshPort = 65002
    SshUser = "u744125515"
    SshPass = "REEMPLAZAR_PASSWORD_SSH"

    SshHostKey = "ssh-ed25519 255 SHA256:ott9Cu9PDiwONAWS03/+Huan0UR4GAHYveIusjKVbVc"

    # Excepciones al limpiar public_html
    KeepEntries = @(
        ".well-known"
    )
}
