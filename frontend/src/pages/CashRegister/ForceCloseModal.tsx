import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { CashRegister } from '@/types/cashRegister'

interface ForceCloseModalProps {
  open: boolean
  register: CashRegister
  onProceedToClose: () => void
}

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))

/**
 * Shown when user has a previous open register that must be closed before opening a new one.
 * It doesn't let them dismiss — they must close the existing register.
 */
export function ForceCloseModal({ open, register, onProceedToClose }: ForceCloseModalProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle>Caja anterior sin cerrar</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Tienes una caja abierta desde el{' '}
            <span className="font-medium text-foreground">
              {formatDateTime(register.opened_at)}
            </span>
            . Debes cerrarla antes de abrir un nuevo turno.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={onProceedToClose} className="w-full sm:w-auto">
            Ir a cerrar la caja
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
