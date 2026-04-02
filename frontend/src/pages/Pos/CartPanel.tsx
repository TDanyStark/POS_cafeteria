import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useCartStore } from '@/stores/cartStore'
import { useCreateSale } from '@/hooks/useSales'
import { CartItemRow } from './CartItem'
import { CustomerSelector } from './CustomerSelector'
import { SaleConfirmModal } from './SaleConfirmModal'
import type { Sale } from '@/types/sales'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function CartPanel() {
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const items = useCartStore((s) => s.items)
  const customer = useCartStore((s) => s.customer)
  const paymentMethod = useCartStore((s) => s.paymentMethod)
  const amountPaid = useCartStore((s) => s.amountPaid)
  const notes = useCartStore((s) => s.notes)
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod)
  const setAmountPaid = useCartStore((s) => s.setAmountPaid)
  const setNotes = useCartStore((s) => s.setNotes)
  const clearCart = useCartStore((s) => s.clearCart)
  const getTotal = useCartStore((s) => s.getTotal)
  const getChange = useCartStore((s) => s.getChange)

  const createSale = useCreateSale()

  const total = getTotal()
  const change = getChange()
  const canPay = items.length > 0 && amountPaid >= total

  const handleCheckout = async () => {
    if (!canPay) return

    try {
      const sale = await createSale.mutateAsync({
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        customer_id: customer?.id ?? null,
        notes: notes || undefined,
      })

      setLastSale(sale)
      setShowConfirm(true)
      clearCart()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la venta'
      toast.error(msg)
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-5 w-5" />
          <span>Carrito</span>
          {items.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {items.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={clearCart}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 px-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <ShoppingCart className="h-8 w-8 mb-2 opacity-30" />
            Agrega productos al carrito
          </div>
        ) : (
          <div className="py-2">
            {items.map((item) => (
              <CartItemRow key={item.product_id} item={item} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer — Payment */}
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-border space-y-3">
          {/* Customer */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Cliente (opcional)</Label>
            <CustomerSelector />
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Método de pago</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('cash')}
              >
                Efectivo
              </Button>
              <Button
                variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('transfer')}
              >
                Transferencia
              </Button>
            </div>
          </div>

          {/* Amount paid */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Monto recibido</Label>
            <Input
              type="number"
              min={total}
              step="1000"
              value={amountPaid || ''}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              placeholder={`Mínimo $${total.toLocaleString()}`}
              className="h-9"
            />
          </div>

          {/* Change */}
          {paymentMethod === 'cash' && amountPaid > 0 && (
            <div className={`flex justify-between text-sm font-medium rounded-lg px-3 py-2 ${
              change >= 0 ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
            }`}>
              <span>Cambio</span>
              <span>${change.toLocaleString()}</span>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* Total + confirm */}
          <Separator />

          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">${total.toLocaleString()}</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!canPay || createSale.isPending}
            onClick={handleCheckout}
          >
            {createSale.isPending ? 'Procesando...' : 'Confirmar venta'}
          </Button>
        </div>
      )}

      {/* Confirm modal */}
      <SaleConfirmModal
        sale={lastSale}
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
      />
    </div>
  )
}
