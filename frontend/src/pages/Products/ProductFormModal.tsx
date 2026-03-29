import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Barcode } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CategoryCreatableSelect } from '@/components/shared/CategoryCreatableSelect'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import type { Product } from '@/types/catalog'

interface Props {
  open: boolean
  onClose: () => void
  product?: Product | null
}

interface FormValues {
  code: string
  name: string
  category_id: string
  price: string
  stock: string
  min_stock: string
  active: boolean
}

export function ProductFormModal({ open, onClose, product }: Props) {
  const isEdit = !!product
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      code: '',
      name: '',
      category_id: '',
      price: '',
      stock: '0',
      min_stock: '5',
      active: true,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        code: product?.code ?? '',
        name: product?.name ?? '',
        category_id: product?.category_id ? String(product.category_id) : '',
        price: product?.price ? String(product.price) : '',
        stock: product?.stock != null ? String(product.stock) : '0',
        min_stock: product?.min_stock != null ? String(product.min_stock) : '5',
        active: product?.active ?? true,
      })
    }
  }, [open, product, reset])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      code: values.code.trim() || null,
      name: values.name,
      category_id: parseInt(values.category_id),
      price: parseFloat(values.price),
      stock: parseInt(values.stock),
      min_stock: parseInt(values.min_stock),
      active: values.active,
    }

    try {
      if (isEdit && product) {
        await updateProduct.mutateAsync({ id: product.id, ...payload })
        toast.success('Producto actualizado correctamente')
      } else {
        await createProduct.mutateAsync(payload)
        toast.success('Producto creado correctamente')
      }
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar el producto'
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Código de barras */}
          <div className="space-y-1.5">
            <Label htmlFor="code" className="flex items-center gap-1.5">
              <Barcode className="h-3.5 w-3.5" />
              Código
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="code"
              placeholder="Escanea o escribe el código de barras"
              autoComplete="off"
              {...register('code')}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Puedes usar un lector de código de barras — el campo recibe el escaneo directamente.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Café Americano"
              {...register('name', { required: 'El nombre es requerido' })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Categoría — Creatable Select */}
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Controller
              name="category_id"
              control={control}
              rules={{ required: 'La categoría es requerida' }}
              render={({ field, fieldState }) => (
                <CategoryCreatableSelect
                  value={field.value}
                  onChange={field.onChange}
                  hasError={!!fieldState.error}
                />
              )}
            />
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio (COP)</Label>
              <Input
                id="price"
                type="number"
                step="1"
                min="1"
                placeholder="0"
                {...register('price', {
                  required: 'Requerido',
                  min: { value: 1, message: 'Debe ser > 0' },
                })}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register('stock', {
                  required: 'Requerido',
                  min: { value: 0, message: 'No puede ser negativo' },
                })}
              />
              {errors.stock && (
                <p className="text-xs text-destructive">{errors.stock.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="min_stock">Stock mín.</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                {...register('min_stock', {
                  required: 'Requerido',
                  min: { value: 0, message: 'No puede ser negativo' },
                })}
              />
              {errors.min_stock && (
                <p className="text-xs text-destructive">{errors.min_stock.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch
                  id="active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="active">Producto activo</Label>
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
