import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories'
import type { Category } from '@/types/catalog'

interface Props {
  open: boolean
  onClose: () => void
  category?: Category | null
}

interface FormValues {
  name: string
}

export function CategoryFormModal({ open, onClose, category }: Props) {
  const isEdit = !!category
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { name: '' } })

  const nameValue = watch('name')
  const slugPreview = nameValue
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '')

  useEffect(() => {
    if (open) {
      reset({ name: category?.name ?? '' })
    }
  }, [open, category, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && category) {
        await updateCategory.mutateAsync({ id: category.id, name: values.name })
        toast.success('Categoría actualizada correctamente')
      } else {
        await createCategory.mutateAsync({ name: values.name })
        toast.success('Categoría creada correctamente')
      }
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar la categoría'
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Bebidas"
              {...register('name', { required: 'El nombre es requerido' })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {slugPreview && (
            <p className="text-xs text-muted-foreground">
              Slug: <span className="font-mono">{slugPreview}</span>
            </p>
          )}

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
