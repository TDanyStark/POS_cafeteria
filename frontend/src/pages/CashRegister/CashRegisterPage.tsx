import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActiveCashRegister } from '@/hooks/useCashRegister'
import { OpenRegisterView } from './OpenRegisterView'
import { OpenedRegisterView } from './OpenedRegisterView'
import { RegisterHistoryView } from './RegisterHistoryView'

/**
 * /cash-register — Gestión de Caja
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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Caja</h1>
        <p className="text-sm text-muted-foreground">
          Controla el flujo de efectivo, aperturas, cierres e historial de turnos.
        </p>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Caja Actual</TabsTrigger>
          <TabsTrigger value="history">Historial de Cierres</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {activeRegister ? (
            <OpenedRegisterView register={activeRegister} isLoading={false} />
          ) : (
            <OpenRegisterView />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 pt-4">
          <RegisterHistoryView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
