import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCashRegister } from '@/hooks/useCashRegister'
import { useSales } from '@/hooks/useSales'
import { SaleDetailModal } from '@/pages/Sales/SaleDetailModal'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

export function CashRegisterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const registerId = Number(id)
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)

  const { data: register, isLoading: isLoadingRegister } = useCashRegister(registerId)
  const { data: salesData, isLoading: isLoadingSales } = useSales({
    cash_register_id: registerId,
    limit: 100,
  })

  const movements = register?.movements ?? []
  const manualCashIn = register?.manual_cash_in ?? register?.cash_in ?? 0
  const manualCashOut = register?.manual_cash_out ?? register?.cash_out ?? 0
  const cashSales = register?.cash_sales ?? 0
  const transferSales = register?.transfer_sales ?? 0
  const expectedAmount = register?.expected_amount ?? 0
  const diff = Number(register?.difference ?? 0)
  const isBalanced = Math.abs(diff) < 1
  const isNegative = !isBalanced && diff < 0

  if (isLoadingRegister) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!register) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Caja no encontrada.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">Caja #{register.id}</h1>
            <Badge variant={register.status === 'open' ? 'default' : 'secondary'}>
              {register.status === 'open' ? 'Abierta' : 'Cerrada'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Abierta por <span className="font-medium">{register.user_name}</span>
            {' · '}{formatDate(register.opened_at)}
            {register.closed_at && (
              <>
                {' · '}Cerrada por <span className="font-medium">{register.closed_by_user_name ?? '—'}</span>
                {' · '}{formatDate(register.closed_at)}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Monto inicial
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold">{formatCurrency(register.initial_amount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ventas efectivo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(cashSales)}
            </p>
            {transferSales > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                + {formatCurrency(transferSales)} transferencia
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Movimientos manuales
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={cn(
              'text-xl font-bold',
              manualCashIn - manualCashOut >= 0
                ? 'text-foreground'
                : 'text-red-600 dark:text-red-400'
            )}>
              {formatCurrency(manualCashIn - manualCashOut)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              +{formatCurrency(manualCashIn)} / -{formatCurrency(manualCashOut)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-primary uppercase tracking-wide">
              Saldo esperado
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-primary">{formatCurrency(expectedAmount)}</p>
          </CardContent>
        </Card>

        {register.status === 'closed' && (
          <Card className={cn(
            'border',
            isBalanced
              ? 'border-green-500/30 bg-green-500/5'
              : isNegative
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-amber-500/30 bg-amber-500/5'
          )}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className={cn(
                'text-xs font-medium uppercase tracking-wide',
                isBalanced
                  ? 'text-green-600 dark:text-green-400'
                  : isNegative
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
              )}>
                Diferencia
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={cn(
                'flex items-center gap-1 text-xl font-bold',
                isBalanced
                  ? 'text-green-600 dark:text-green-400'
                  : isNegative
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
              )}>
                {isBalanced
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <AlertCircle className="h-4 w-4" />}
                {formatCurrency(diff)}
              </div>
              {register.declared_amount != null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Declarado: {formatCurrency(register.declared_amount)}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Movements table */}
      {movements.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">Movimientos manuales</h2>
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {mov.type === 'in' ? (
                          <ArrowDownCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <ArrowUpCircle className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            mov.type === 'in'
                              ? 'border-green-500/30 text-green-600 dark:text-green-400'
                              : 'border-red-500/30 text-red-600 dark:text-red-400'
                          )}
                        >
                          {mov.type === 'in' ? 'Entrada' : 'Salida'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{mov.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mov.user_name ?? '—'}</TableCell>
                    <TableCell className={cn(
                      'text-right font-semibold',
                      mov.type === 'in'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {mov.type === 'in' ? '+' : '-'}{formatCurrency(mov.amount)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(mov.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Sales table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Ventas de esta caja</h2>
          {salesData && (
            <span className="text-sm text-muted-foreground">
              {salesData.pagination?.total ?? salesData.data?.length ?? 0} ventas
            </span>
          )}
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cajero</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingSales ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !salesData?.data || salesData.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No hay ventas registradas en esta caja
                  </TableCell>
                </TableRow>
              ) : (
                salesData.data.map((sale) => {
                  const paidLess = Number(sale.amount_paid) < Number(sale.total)
                  const debtPending = sale.debt_status != null && sale.debt_status !== 'paid'
                  const hasDebt = paidLess && debtPending
                  return (
                    <TableRow key={sale.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">#{sale.id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(sale.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">{sale.cashier_name}</TableCell>
                      <TableCell className="text-sm">
                        {sale.customer_name ?? (
                          <span className="text-muted-foreground italic">Anónimo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant={sale.payment_method === 'cash' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {sale.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                          </Badge>
                          {hasDebt && (
                            <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400">
                              Deuda
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell className={cn(
                        'text-right font-semibold',
                        hasDebt
                          ? 'text-amber-600 dark:text-amber-400'
                          : paidLess && !debtPending
                            ? 'text-muted-foreground'
                            : 'text-green-600 dark:text-green-400'
                      )}>
                        {formatCurrency(sale.amount_paid)}
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
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <SaleDetailModal saleId={selectedSaleId} onClose={() => setSelectedSaleId(null)} />
    </div>
  )
}
