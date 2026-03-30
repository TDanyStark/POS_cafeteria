import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCloseCashRegister } from '@/hooks/useCashRegister'
import type { CashRegister } from '@/types/cashRegister'

interface FormValues {
  declared_amount: string
}

interface CloseRegisterModalProps {
  open: boolean
  onClose: () => void
  register: CashRegister
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)

export function CloseRegisterModal({ open, onClose, register }: CloseRegisterModalProps) {
  const { mutate: closeRegister, isPending } = useCloseCashRegister()

  const {
    register: reg,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { declared_amount: '' } })

  const declaredRaw = watch('declared_amount')
  const declaredAmount = parseFloat(declaredRaw) || 0
  const expectedAmount = register.expected_amount ?? 0
  const previewDiff = declaredAmount - expectedAmount

  const onSubmit = (values: FormValues) => {
    const amount = parseFloat(values.declared_amount)
    if (isNaN(amount) || amount < 0) {
      toast.error('El monto declarado debe ser mayor o igual a 0.')
      return
    }

    closeRegister(
      { id: register.id, declared_amount: amount },
      {
        onSuccess: () => {
          toast.success('Caja cerrada correctamente.')
          reset()
          onClose()
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Error al cerrar la caja.'
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar Caja</DialogTitle>
          <DialogDescription>
            Realiza el conteo físico del efectivo e ingresa el monto para registrar el cierre.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monto inicial</span>
            <span className="font-medium">{formatCurrency(register.initial_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ingresos en caja</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              +{formatCurrency(register.cash_in ?? 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Egresos de caja</span>
            <span className="font-medium text-red-500">
              -{formatCurrency(register.cash_out ?? 0)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Saldo esperado</span>
            <span>{formatCurrency(expectedAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="declared_amount">Monto contado en caja</Label>
            <Input
              id="declared_amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              {...reg('declared_amount', { required: 'El monto declarado es requerido.' })}
            />
            {errors.declared_amount && (
              <p className="text-sm text-destructive">{errors.declared_amount.message}</p>
            )}
          </div>

          {declaredRaw !== '' && (
            <div
              className={`rounded-md px-4 py-2 text-sm font-medium flex justify-between ${
                previewDiff >= 0
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              <span>Diferencia</span>
              <span>
                {previewDiff >= 0 ? '+' : ''}
                {formatCurrency(previewDiff)}
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" className="flex-1" disabled={isPending}>
              {isPending ? 'Cerrando...' : 'Confirmar Cierre'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
