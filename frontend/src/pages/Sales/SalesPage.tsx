import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useSales } from '@/hooks/useSales'
import { SaleDetailModal } from './SaleDetailModal'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import type { PaymentMethod, SaleFilters } from '@/types/sales'
import type { DateRange } from 'react-day-picker'
import { Eye, RotateCcw, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

export function SalesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)
  const navigate = useNavigate()

  const page          = parseInt(searchParams.get('page') ?? '1')
  const dateFrom      = searchParams.get('date_from') ?? ''
  const dateTo        = searchParams.get('date_to') ?? ''
  const paymentMethod: PaymentMethod | '' = (searchParams.get('payment_method') || '') as PaymentMethod | ''

  const dateRange: DateRange | undefined = useMemo(() => {
    if (!dateFrom) return undefined
    return {
      from: parseISO(dateFrom),
      to: dateTo ? parseISO(dateTo) : undefined,
    }
  }, [dateFrom, dateTo])

  const filters: SaleFilters = {
    page,
    limit: 20,
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    ...(paymentMethod && { payment_method: paymentMethod }),
  }

  const { data, isLoading } = useSales(filters)

  const handleDateChange = (range: DateRange | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (range?.from) {
        next.set('date_from', format(startOfDay(range.from), 'yyyy-MM-dd'))
      } else {
        next.delete('date_from')
      }
      
      if (range?.to) {
        next.set('date_to', format(endOfDay(range.to), 'yyyy-MM-dd'))
      } else {
        next.delete('date_to')
      }
      
      next.set('page', '1')
      return next
    })
  }

  const setParam = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.set('page', '1')
      return next
    })
  }

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasFilters = dateFrom || dateTo || paymentMethod

  const handleCashRegisterClick = (e: React.MouseEvent, registerId: number) => {
    e.stopPropagation()
    navigate(`/cash-register/${registerId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Historial de ventas</h1>
        <p className="text-sm text-muted-foreground">Consulta y filtra las ventas realizadas en el sistema.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end bg-card p-4 rounded-lg border">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Rango de fechas</p>
          <DateRangePicker 
            value={dateRange} 
            onChange={handleDateChange}
            align="start"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Método de pago</p>
          <Select value={(paymentMethod || 'all') as string} onValueChange={(v) => setParam('payment_method', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-44 h-9">
              <SelectValue placeholder="Todos">
                {(paymentMethod || 'all') === 'all' ? 'Todos' : paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card min-w-0 max-w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cajero</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Caja</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Deuda</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No se encontraron ventas
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((sale) => (
                <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">#{sale.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(sale.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">{sale.cashier_name}</TableCell>
                  <TableCell className="text-sm">{sale.customer_name ?? <span className="text-muted-foreground italic">Anónimo</span>}</TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => handleCashRegisterClick(e, sale.cash_register_id)}
                      className="font-mono text-xs text-primary underline-offset-2 hover:underline"
                    >
                      #{sale.cash_register_id}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sale.payment_method === 'cash' ? 'secondary' : 'outline'} className="text-xs">
                      {sale.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.debt_status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {formatCurrency(sale.debt_remaining ?? 0)}
                      </span>
                    )}
                    {sale.debt_status === 'partial' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        {formatCurrency(sale.debt_remaining ?? 0)}
                      </span>
                    )}
                    {sale.debt_status === 'paid' && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Saldada
                      </span>
                    )}
                    {!sale.debt_status && (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-semibold',
                    sale.debt_status && sale.debt_status !== 'paid' ? 'text-red-600 dark:text-red-400' : ''
                  )}>
                    {formatCurrency(sale.total)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setSelectedSaleId(sale.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.total_pages > 1 && (
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">
            {data.pagination.total} ventas
          </span>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-2 text-muted-foreground">
              {page} / {data.pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.total_pages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <SaleDetailModal saleId={selectedSaleId} onClose={() => setSelectedSaleId(null)} />
    </div>
  )
}
