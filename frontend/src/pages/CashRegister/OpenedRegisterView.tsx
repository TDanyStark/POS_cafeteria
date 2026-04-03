import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Clock, PlusCircle, XCircle } from 'lucide-react'
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
import { AddMovementModal } from './AddMovementModal'
import { CloseRegisterModal } from './CloseRegisterModal'
import type { CashRegister } from '@/types/cashRegister'
import { formatCurrency, formatDate } from '@/utils/format'

interface OpenedRegisterViewProps {
  register: CashRegister
  isLoading: boolean
}

export function OpenedRegisterView({ register, isLoading }: OpenedRegisterViewProps) {
  const [movementOpen, setMovementOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const movements = register.movements ?? []
  const manualCashIn = register.manual_cash_in ?? register.cash_in ?? 0
  const manualCashOut = register.manual_cash_out ?? register.cash_out ?? 0
  const cashSales = register.cash_sales ?? 0
  const transferSales = register.transfer_sales ?? 0
  const expectedAmount = register.expected_amount ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Caja abierta</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3.5 w-3.5" />
            Apertura: {formatDate(register.opened_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setMovementOpen(true)}>
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Movimiento
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setCloseOpen(true)}>
            <XCircle className="mr-1.5 h-4 w-4" />
            Cerrar Caja
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Monto inicial
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(register.initial_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ventas (Efectivo)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              +{formatCurrency(cashSales)}
            </p>
            {transferSales > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Transf: {formatCurrency(transferSales)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Movimientos Manuales
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className={`text-lg font-bold ${manualCashIn - manualCashOut >= 0 ? 'text-foreground' : 'text-red-500'}`}>
              {manualCashIn - manualCashOut >= 0 ? '+' : ''}
              {formatCurrency(manualCashIn - manualCashOut)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              In: {formatCurrency(manualCashIn)} | Out: {formatCurrency(manualCashOut)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-primary uppercase tracking-wide">
              Saldo esperado
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-lg font-bold text-primary">
              {formatCurrency(expectedAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Movimientos del turno</h3>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Cajero</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Sin movimientos registrados
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {mov.type === 'in' ? (
                        <Badge variant="secondary" className="gap-1 text-green-600 dark:text-green-400">
                          <ArrowDownCircle className="h-3.5 w-3.5" />
                          Entrada
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-red-500">
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                          Salida
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{mov.description}</TableCell>
                    <TableCell className="text-muted-foreground">{mov.user_name}</TableCell>
                    <TableCell
                      className={
                        mov.type === 'in'
                          ? 'font-medium text-green-600 dark:text-green-400'
                          : 'font-medium text-red-500'
                      }
                    >
                      {mov.type === 'in' ? '+' : '-'}
                      {formatCurrency(mov.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(mov.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddMovementModal
        open={movementOpen}
        onClose={() => setMovementOpen(false)}
        registerId={register.id}
      />

      <CloseRegisterModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        register={register}
      />
    </div>
  )
}
