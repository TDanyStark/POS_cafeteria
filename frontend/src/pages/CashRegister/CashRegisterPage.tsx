import { Skeleton } from '@/components/ui/skeleton'
import { useActiveCashRegister } from '@/hooks/useCashRegister'
import { OpenRegisterView } from './OpenRegisterView'
import { OpenedRegisterView } from './OpenedRegisterView'

/**
 * /cash-register — Gestión de Caja
 *
 * States:
 *  1. Loading  — skeleton while fetching active register
 *  2. No open register → OpenRegisterView (form to open new shift)
 *     - If there's a previous unclosed register, the backend returns 409
 *       and OpenRegisterView surfaces it via ForceCloseGuard.
 *  3. Open register → OpenedRegisterView (summary, movements, close button)
 */
export function CashRegisterPage() {
  const { data: activeRegister, isLoading } = useActiveCashRegister()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Caja</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona la apertura, movimientos y cierre del turno.
        </p>
      </div>

      {activeRegister ? (
        <OpenedRegisterView register={activeRegister} isLoading={false} />
      ) : (
        <OpenRegisterView />
      )}
    </div>
  )
}
