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
import { formatDate } from '@/utils/format'

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
                <span>${sale.amount_paid.toLocaleString()}</span>
              </div>
              {sale.payment_method === 'cash' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cambio</span>
                  <span>${sale.change_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span className="text-primary">${sale.total.toLocaleString()}</span>
              </div>
            </div>

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
