export interface EmailSettings {
  id: number
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_pass: string | null
  from_name: string | null
  notification_email: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface UpdateEmailSettingsPayload {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_pass?: string
  from_name: string
  notification_email: string
  active: boolean
}
