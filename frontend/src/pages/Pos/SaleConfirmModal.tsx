import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Sale } from '@/types/sales'
import { CheckCircle2, ShoppingBag, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

interface SaleConfirmModalProps {
  sale: Sale | null
  open: boolean
  onClose: () => void
}

export function SaleConfirmModal({ sale, open, onClose }: SaleConfirmModalProps) {
  if (!sale) return null

  const hasDebt = sale.debt != null && sale.debt.remaining_amount > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            Venta registrada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">N° Venta</span>
            <span className="font-semibold">#{sale.id}</span>
          </div>

          {sale.customer_name && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente</span>
              <span>{sale.customer_name}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Método de pago</span>
            <Badge variant={sale.payment_method === 'cash' ? 'secondary' : 'outline'}>
              {sale.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-1">
            {sale.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.product_name} × {item.quantity}
                </span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(sale.total)}</span>
          </div>

          {sale.payment_method === 'cash' && sale.change_amount > 0 && (
            <div className="flex justify-between text-sm font-medium text-green-600 dark:text-green-400">
              <span>Cambio</span>
              <span>{formatCurrency(sale.change_amount)}</span>
            </div>
          )}

          {hasDebt && sale.debt && (
            <>
              <Separator />
              <div className="rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Venta a crédito
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Abonado</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(sale.amount_paid)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo pendiente</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {formatCurrency(sale.debt.remaining_amount)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={onClose}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Nueva venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
