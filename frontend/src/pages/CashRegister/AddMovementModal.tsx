import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddMovement } from '@/hooks/useCashRegister'

interface FormValues {
  type: 'in' | 'out'
  amount: string
  description: string
}

interface AddMovementModalProps {
  open: boolean
  onClose: () => void
  registerId: number
}

export function AddMovementModal({ open, onClose, registerId }: AddMovementModalProps) {
  const { mutate: addMovement, isPending } = useAddMovement()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { type: 'in', amount: '', description: '' } })

  const typeValue = watch('type')

  const onSubmit = (values: FormValues) => {
    const amount = parseFloat(values.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser mayor a 0.')
      return
    }

    addMovement(
      {
        id: registerId,
        type: values.type,
        amount,
        description: values.description,
      },
      {
        onSuccess: () => {
          toast.success('Movimiento registrado.')
          reset()
          onClose()
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Error al registrar el movimiento.'
          toast.error(message)
        },
      }
    )
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={typeValue}
              onValueChange={(v) => setValue('type', v as 'in' | 'out')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Entrada (ingreso)</SelectItem>
                <SelectItem value="out">Salida (egreso)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { required: 'El monto es requerido.' })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Ej: Recarga de caja, pago de proveedor..."
              {...register('description', { required: 'La descripción es requerida.' })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
