import { useState } from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { CheckCircle2, AlertCircle, User } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCashRegisterHistory } from '@/hooks/useCashRegister'
import { formatCurrency, formatDate } from '@/utils/format'
import { DateRangePicker } from '@/components/shared/DateRangePicker'

export function RegisterHistoryView() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  const { data: history, isLoading } = useCashRegisterHistory({
    from: date?.from ? format(startOfDay(date.from), 'yyyy-MM-dd HH:mm:ss') : undefined,
    to: date?.to ? format(endOfDay(date.to), 'yyyy-MM-dd HH:mm:ss') : undefined,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historial de Cajas</h2>
          <p className="text-sm text-muted-foreground">
            Consulta los cierres previos y audita las diferencias.
          </p>
        </div>

        <DateRangePicker value={date} onChange={setDate} />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apertura</TableHead>
              <TableHead>Cierre</TableHead>
              <TableHead>Abrió</TableHead>
              <TableHead>Cerró</TableHead>
              <TableHead className="text-right">Inicial</TableHead>
              <TableHead className="text-right">Esperado</TableHead>
              <TableHead className="text-right">Declarado</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : history && history.length > 0 ? (
              history.map((reg) => {
                const diff = Number(reg.difference ?? 0)
                const isBalanced = Math.abs(diff) < 1
                const isNegative = !isBalanced && diff < 0

                return (
                  <TableRow key={reg.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(reg.opened_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {reg.closed_at ? formatDate(reg.closed_at) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{reg.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{reg.closed_by_user_name ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(reg.initial_amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {reg.final_amount ? formatCurrency(reg.final_amount) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {reg.declared_amount ? formatCurrency(reg.declared_amount) : '—'}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-bold",
                      isBalanced ? "text-green-600 dark:text-green-400" :
                      isNegative ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                      {reg.closed_at ? (
                        <span className="flex items-center justify-end gap-1">
                          {isBalanced ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {formatCurrency(diff)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={reg.status === 'open' ? 'default' : 'secondary'}>
                        {reg.status === 'open' ? 'Abierta' : 'Cerrada'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No se encontraron registros en este rango de fechas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
