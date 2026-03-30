import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Clock, PlusCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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

interface OpenedRegisterViewProps {
  register: CashRegister
  isLoading: boolean
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))

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
  const cashIn = register.cash_in ?? 0
  const cashOut = register.cash_out ?? 0
  const expectedAmount = register.expected_amount ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Caja abierta</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3.5 w-3.5" />
            Apertura: {formatDateTime(register.opened_at)}
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
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              +{formatCurrency(cashIn)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Egresos
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-lg font-bold text-red-500">
              -{formatCurrency(cashOut)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Saldo esperado
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-lg font-bold text-foreground">
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
                      {formatDateTime(mov.created_at)}
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
