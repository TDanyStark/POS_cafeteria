import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useEmailSettings, useSendTestEmail, useUpdateEmailSettings } from '@/hooks/useEmailSettings'

interface FormValues {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  from_name: string
  notification_email: string
  active: boolean
}

export function SettingsPage() {
  const { data, isLoading } = useEmailSettings()
  const updateSettings = useUpdateEmailSettings()
  const sendTestEmail = useSendTestEmail()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      smtp_host: '',
      smtp_port: '587',
      smtp_user: '',
      smtp_pass: '',
      from_name: '',
      notification_email: '',
      active: false,
    },
  })

  useEffect(() => {
    if (!data) return

    reset({
      smtp_host: data.smtp_host ?? '',
      smtp_port: data.smtp_port != null ? String(data.smtp_port) : '587',
      smtp_user: data.smtp_user ?? '',
      smtp_pass: '',
      from_name: data.from_name ?? '',
      notification_email: data.notification_email ?? '',
      active: data.active,
    })
  }, [data, reset])

  const onSubmit = async (values: FormValues) => {
    const port = parseInt(values.smtp_port, 10)
    if (Number.isNaN(port)) {
      toast.error('El puerto SMTP debe ser numérico.')
      return
    }

    try {
      await updateSettings.mutateAsync({
        smtp_host: values.smtp_host.trim(),
        smtp_port: port,
        smtp_user: values.smtp_user.trim(),
        smtp_pass: values.smtp_pass.trim() || undefined,
        from_name: values.from_name.trim(),
        notification_email: values.notification_email.trim(),
        active: values.active,
      })
      toast.success('Configuración SMTP guardada correctamente.')
      setValue('smtp_pass', '')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No fue posible guardar la configuración.'
      toast.error(message)
    }
  }

  const handleSendTestEmail = async () => {
    try {
      await sendTestEmail.mutateAsync()
      toast.success('Correo de prueba enviado correctamente.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No fue posible enviar el correo de prueba.'
      toast.error(message)
    }
  }

  const active = watch('active')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración de Email</h1>
        <p className="text-sm text-muted-foreground">
          Configura SMTP para enviar comprobantes de venta y notificaciones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMTP Hostinger</CardTitle>
          <CardDescription>
            Guarda la configuración y luego usa el botón de prueba para validar el envío.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp_host">Host SMTP</Label>
                  <Input
                    id="smtp_host"
                    placeholder="smtp.hostinger.com"
                    {...register('smtp_host', { required: 'El host SMTP es requerido.' })}
                  />
                  {errors.smtp_host && (
                    <p className="text-xs text-destructive">{errors.smtp_host.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="smtp_port">Puerto SMTP</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    min="1"
                    max="65535"
                    placeholder="587"
                    {...register('smtp_port', { required: 'El puerto SMTP es requerido.' })}
                  />
                  {errors.smtp_port && (
                    <p className="text-xs text-destructive">{errors.smtp_port.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp_user">Usuario SMTP</Label>
                  <Input
                    id="smtp_user"
                    placeholder="notificaciones@tudominio.com"
                    {...register('smtp_user', { required: 'El usuario SMTP es requerido.' })}
                  />
                  {errors.smtp_user && (
                    <p className="text-xs text-destructive">{errors.smtp_user.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="smtp_pass">Contraseña SMTP</Label>
                  <Input
                    id="smtp_pass"
                    type="password"
                    placeholder="******"
                    {...register('smtp_pass')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Déjalo vacío para mantener la contraseña guardada.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="from_name">Nombre remitente</Label>
                  <Input
                    id="from_name"
                    placeholder="POS Cafetería"
                    {...register('from_name', { required: 'El nombre remitente es requerido.' })}
                  />
                  {errors.from_name && (
                    <p className="text-xs text-destructive">{errors.from_name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notification_email">Correo destino</Label>
                  <Input
                    id="notification_email"
                    type="email"
                    placeholder="admin@cafeteria.com"
                    {...register('notification_email', { required: 'El correo destino es requerido.' })}
                  />
                  {errors.notification_email && (
                    <p className="text-xs text-destructive">{errors.notification_email.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-md border p-3">
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={(checked) => setValue('active', checked)}
                />
                <div>
                  <Label htmlFor="active">Activar envío de correos</Label>
                  <p className="text-xs text-muted-foreground">
                    Si está desactivado, las ventas no intentarán enviar comprobantes por email.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSubmitting || updateSettings.isPending}>
                  {isSubmitting || updateSettings.isPending ? 'Guardando...' : 'Guardar configuración'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendTestEmail}
                  disabled={sendTestEmail.isPending}
                >
                  {sendTestEmail.isPending ? 'Enviando...' : 'Enviar correo de prueba'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
