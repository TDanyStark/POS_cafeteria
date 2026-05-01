import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebts, useAddDebtPayment } from '@/hooks/useDebts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { UserMinus, Search, DollarSign, CreditCard, Calendar, ArrowDownToLine } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'destructive',
    partial: 'secondary',
    paid: 'default',
  }
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    partial: 'Abonado',
    paid: 'Pagado',
  }
  return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>
}

export function DebtorsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const page = parseInt(searchParams.get('page') || '1')
  const status = searchParams.get('status') || ''
  const customerName = searchParams.get('customer_name') || ''

  const [searchName, setSearchName] = useState(customerName)
  const [selectedDebt, setSelectedDebt] = useState<number | null>(null)
  const [selectedDebtRemaining, setSelectedDebtRemaining] = useState<number>(0)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash')
  const [paymentNotes, setPaymentNotes] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (searchName) {
        params.set('customer_name', searchName)
        params.delete('page')
      } else {
        params.delete('customer_name')
      }
      setSearchParams(params, { replace: true })
    }, 400)
    return () => clearTimeout(timer)
  }, [searchName])

  const { data, isLoading } = useDebts({
    page,
    limit: 10,
    status: status as 'pending' | 'partial' | 'paid' | '' | undefined,
    customer_name: customerName || undefined,
  })

  const addPayment = useAddDebtPayment()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
  }

  const handleAddPayment = async () => {
    if (!selectedDebt || paymentAmount <= 0) return

    try {
      await addPayment.mutateAsync({
        debtId: selectedDebt,
        payload: {
          amount: paymentAmount,
          payment_method: paymentMethod,
          notes: paymentNotes || undefined,
        },
      })
      toast.success('Abono registrado correctamente')
      setSelectedDebt(null)
      setSelectedDebtRemaining(0)
      setPaymentAmount(0)
      setPaymentMethod('cash')
      setPaymentNotes('')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { description?: string }; message?: string } } }
      const msg =
        axiosErr?.response?.data?.error?.description ||
        axiosErr?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Error al registrar el abono')
      toast.error(msg)
    }
  }

  const openPaymentModal = (debtId: number, remaining: number) => {
    setSelectedDebt(debtId)
    setSelectedDebtRemaining(remaining)
    setPaymentAmount(Math.round(remaining))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserMinus className="h-6 w-6" />
          Deudores
        </h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] max-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          value={status}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams)
            if (v) {
              params.set('status', v)
            } else {
              params.delete('status')
            }
            params.delete('page')
            setSearchParams(params)
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="partial">Abonado</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto Original</TableHead>
              <TableHead>Pagado</TableHead>
              <TableHead>Pendiente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay deudas registradas
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{debt.customer_name}</p>
                      {debt.customer_phone && (
                        <p className="text-xs text-muted-foreground">{debt.customer_phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(debt.created_at).toLocaleDateString('es-CO')}
                    </div>
                  </TableCell>
                   <TableCell className="font-medium">{formatCurrency(debt.original_amount)}</TableCell>
                   <TableCell className="text-green-600 dark:text-green-400">{formatCurrency(debt.paid_amount)}</TableCell>
                   <TableCell className="font-medium text-destructive">{formatCurrency(debt.remaining_amount)}</TableCell>
                  <TableCell><StatusBadge status={debt.status} /></TableCell>
                  <TableCell className="text-right">
                    {debt.remaining_amount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPaymentModal(debt.id, debt.remaining_amount)}
                      >
                        <ArrowDownToLine className="h-3 w-3 mr-1" />
                        Abonar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && data.pagination.total_pages > 1 && (
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">
            {data.pagination.total} deudas
          </span>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
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
              onClick={() => handlePageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog open={selectedDebt !== null} onOpenChange={(open) => {
        if (!open) {
          setSelectedDebt(null)
          setSelectedDebtRemaining(0)
          setPaymentAmount(0)
          setPaymentMethod('cash')
          setPaymentNotes('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                min={0}
                max={selectedDebtRemaining}
                step="1000"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Math.min(selectedDebtRemaining, Math.max(0, parseFloat(e.target.value) || 0)))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pendiente: {formatCurrency(selectedDebtRemaining)}
              </p>
            </div>

            <div>
              <Label>Método de pago</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Efectivo
                </Button>
                <Button
                  variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('transfer')}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Transferencia
                </Button>
              </div>
            </div>

            <div>
              <Label>Notas (opcional)</Label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Observaciones..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDebt(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={addPayment.isPending || paymentAmount <= 0 || paymentAmount > selectedDebtRemaining}
            >
              {addPayment.isPending ? 'Guardando...' : 'Confirmar abono'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}