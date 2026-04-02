import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { Eye, RotateCcw } from 'lucide-react'

export function SalesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)

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

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Historial de ventas</h1>
        <p className="text-sm text-muted-foreground">Consulta y filtra las ventas realizadas en el sistema.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-card p-4 rounded-lg border">
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
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Todos" />
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
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cajero</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No se encontraron ventas
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((sale) => (
                <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">#{sale.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(sale.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{sale.cashier_name}</TableCell>
                  <TableCell className="text-sm">{sale.customer_name ?? <span className="text-muted-foreground italic">Anónimo</span>}</TableCell>
                  <TableCell>
                    <Badge variant={sale.payment_method === 'cash' ? 'secondary' : 'outline'} className="text-xs">
                      {sale.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${sale.total.toLocaleString()}
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {data.pagination.total} ventas
          </span>
          <div className="flex gap-2">
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
