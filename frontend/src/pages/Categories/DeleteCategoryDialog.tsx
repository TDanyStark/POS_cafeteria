import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteCategory } from '@/hooks/useCategories'
import type { Category } from '@/types/catalog'

interface Props {
  open: boolean
  onClose: () => void
  category: Category | null
}

export function DeleteCategoryDialog({ open, onClose, category }: Props) {
  const deleteCategory = useDeleteCategory()

  const handleConfirm = async () => {
    if (!category) return
    try {
      await deleteCategory.mutateAsync(category.id)
      toast.success('Categoría eliminada correctamente')
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al eliminar la categoría'
      toast.error(message)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará la categoría{' '}
            <strong>{category?.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
