import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import { toast } from 'sonner'
import type { Customer } from '@/types/sales'
import { useEffect } from 'react'

const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (customer: Customer) => void
  customer?: Customer | null
}

export function CustomerFormModal({ open, onOpenChange, onSuccess, customer }: CustomerFormModalProps) {
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
    },
  })

  // Sync form with customer prop when editing
  useEffect(() => {
    if (open) {
      if (customer) {
        reset({
          name: customer.name,
          phone: customer.phone || '',
          email: customer.email || '',
        })
      } else {
        reset({
          name: '',
          phone: '',
          email: '',
        })
      }
    }
  }, [open, customer, reset])

  const validateEmail = (email: string) => {
    if (!email) return true
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const onSubmit = async (data: CustomerFormValues) => {
    if (data.email && !validateEmail(data.email)) {
      toast.error('El correo electrónico no es válido')
      return
    }

    try {
      let result: Customer
      if (customer) {
        result = await updateCustomer.mutateAsync({
          id: customer.id,
          name: data.name,
          phone: data.phone || '',
          email: data.email || null,
        })
        toast.success('Cliente actualizado correctamente')
      } else {
        result = await createCustomer.mutateAsync({
          name: data.name,
          phone: data.phone || '',
          email: data.email || null,
        })
        toast.success('Cliente registrado correctamente')
      }
      onSuccess(result)
      onOpenChange(false)
      reset()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar cliente'
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Nombre completo"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono {customer ? '(opcional)' : '(opcional)'}</Label>
            <Input
              id="phone"
              placeholder="Ej: 3001234567"
              {...register('phone')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo (opcional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending}>
              {createCustomer.isPending || updateCustomer.isPending ? 'Guardando...' : (customer ? 'Guardar Cambios' : 'Registrar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
