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
import { useDeleteUser } from '@/hooks/useUsers'
import { getApiErrorMessage } from '@/utils/apiError'
import type { UserListItem } from '@/types/users'

interface DeleteUserDialogProps {
  open: boolean
  onClose: () => void
  user: UserListItem | null
}

export function DeleteUserDialog({ open, onClose, user }: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser()

  const handleConfirm = async () => {
    if (!user) {
      return
    }

    try {
      await deleteUser.mutateAsync(user.id)
      toast.success('Cajero eliminado correctamente')
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el cajero'))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(value) => !value && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar cajero</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. Se eliminara el usuario <strong>{user?.name}</strong>.
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
