import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useSale } from '@/hooks/useSales'
import { formatCurrency, formatDate } from '@/utils/format'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'

interface SaleDetailModalProps {
  saleId: number | null
  onClose: () => void
}

export function SaleDetailModal({ saleId, onClose }: SaleDetailModalProps) {
  const { data: sale, isLoading } = useSale(saleId ?? 0)

  return (
    <Dialog open={saleId !== null} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle de venta {saleId ? `#${saleId}` : ''}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>
        ) : sale ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Cajero</p>
                <p className="font-medium">{sale.cashier_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatDate(sale.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{sale.customer_name ?? 'Anónimo'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Método de pago</p>
                <Badge variant={sale.payment_method === 'cash' ? 'secondary' : 'outline'}>
                  {sale.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-semibold">Productos</p>
              {sale.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span>${item.subtotal.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto pagado</span>
                <span>{formatCurrency(sale.amount_paid)}</span>
              </div>
              {sale.payment_method === 'cash' && sale.change_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cambio</span>
                  <span>{formatCurrency(sale.change_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(sale.total)}</span>
              </div>
            </div>

            {sale.debt && sale.debt.status !== 'paid' && (
              <>
                <Separator />
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                    {sale.debt.status === 'partial' ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {sale.debt.status === 'partial' ? 'Deuda parcialmente pagada' : 'Venta con deuda pendiente'}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Original</p>
                      <p className="font-medium">{formatCurrency(sale.debt.original_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Abonado</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(sale.debt.paid_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Saldo</p>
                      <p className="font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(sale.debt.remaining_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {sale.debt?.status === 'paid' && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Deuda saldada</span>
                  <span className="ml-auto text-muted-foreground">
                    {formatCurrency(sale.debt.original_amount)}
                  </span>
                </div>
              </>
            )}

            {sale.notes && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Notas</p>
                <p className="bg-muted rounded p-2">{sale.notes}</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
