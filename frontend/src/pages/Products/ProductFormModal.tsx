import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import type { Product } from '@/types/catalog'

interface Props {
  open: boolean
  onClose: () => void
  product?: Product | null
}

interface FormValues {
  name: string
  category_id: string
  price: string
  stock: string
  min_stock: string
  active: boolean
}

export function ProductFormModal({ open, onClose, product }: Props) {
  const isEdit = !!product
  const { data: categories } = useCategories()
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

          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Controller
              name="category_id"
              control={control}
              rules={{ required: 'La categoría es requerida' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('price', {
                  required: 'Requerido',
                  min: { value: 0.01, message: 'Debe ser > 0' },
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
