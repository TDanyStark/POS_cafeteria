import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateProductStock } from '@/hooks/useProducts'
import type { Product } from '@/types/catalog'

interface Props {
  open: boolean
  onClose: () => void
  product: Product | null
}

interface FormValues {
  quantity: string
}

export function StockAdjustModal({ open, onClose, product }: Props) {
  const updateStock = useUpdateProductStock()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { quantity: '' } })

  useEffect(() => {
    if (open && product) {
      reset({ quantity: String(product.stock) })
    }
  }, [open, product, reset])

  const onSubmit = async (values: FormValues) => {
    if (!product) return
    try {
      await updateStock.mutateAsync({ id: product.id, quantity: parseInt(values.quantity) })
      toast.success('Stock actualizado correctamente')
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al actualizar el stock'
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Producto: <strong className="text-foreground">{product?.name}</strong>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Nueva cantidad en stock</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              {...register('quantity', {
                required: 'La cantidad es requerida',
                min: { value: 0, message: 'No puede ser negativo' },
              })}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
