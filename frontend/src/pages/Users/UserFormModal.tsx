import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import { getApiErrorMessage } from '@/utils/apiError'
import type { UserListItem } from '@/types/users'

interface UserFormValues {
  name: string
  email: string
  password: string
  active: boolean
}

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: UserListItem | null
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const isEdit = !!user
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      active: true,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        active: user?.active ?? true,
      })
    }
  }, [open, reset, user])

  const onSubmit = async (values: UserFormValues) => {
    try {
      if (isEdit && user) {
        await updateUser.mutateAsync({
          id: user.id,
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password.trim() || undefined,
          active: values.active,
        })
        toast.success('Cajero actualizado correctamente')
      } else {
        await createUser.mutateAsync({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password.trim(),
          active: values.active,
        })
        toast.success('Cajero creado correctamente')
      }
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al guardar el cajero'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cajero' : 'Nuevo cajero'}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Juan Perez"
              {...register('name', { required: 'El nombre es requerido' })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              placeholder="cajero@cafeteria.com"
              {...register('email', {
                required: 'El correo es requerido',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Ingresa un correo electrónico válido',
                },
              })}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña {isEdit ? '(opcional)' : ''}</Label>
            <Input
              id="password"
              type="password"
              placeholder={isEdit ? 'Dejar vacia para conservar' : 'Minimo 6 caracteres'}
              {...register('password', {
                validate: (value) => {
                  const trimmed = value.trim()
                  if (!isEdit && trimmed.length < 6) return 'Minimo 6 caracteres'
                  if (isEdit && trimmed !== '' && trimmed.length < 6) return 'Minimo 6 caracteres'
                  return true
                },
              })}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex items-center gap-3">
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="active">Usuario activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
