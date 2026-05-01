import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { formatCurrency } from '@/utils/format'

export function CartPanel() {
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const items = useCartStore((s) => s.items)
  const customer = useCartStore((s) => s.customer)
  const paymentMethod = useCartStore((s) => s.paymentMethod)
  const amountPaid = useCartStore((s) => s.amountPaid)
  const notes = useCartStore((s) => s.notes)
  const createDebt = useCartStore((s) => s.createDebt)
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod)
  const setAmountPaid = useCartStore((s) => s.setAmountPaid)
  const setNotes = useCartStore((s) => s.setNotes)
  const setCreateDebt = useCartStore((s) => s.setCreateDebt)
  const clearCart = useCartStore((s) => s.clearCart)
  const getTotal = useCartStore((s) => s.getTotal)

  const createSale = useCreateSale()

  const total = getTotal()
  const canPay = items.length > 0 && (
    paymentMethod === 'transfer'
      ? true
      : createDebt
        ? amountPaid >= 0 && amountPaid < total
        : amountPaid >= total
  )
  const needsCustomerForDebt = createDebt && !customer

  useEffect(() => {
    if (paymentMethod === 'transfer') {
      setAmountPaid(total)
    }
  }, [paymentMethod, total, setAmountPaid])

  useEffect(() => {
    if (createDebt) {
      setAmountPaid(0)
    }
  }, [createDebt, setAmountPaid])

  const handleCheckout = async () => {
    if (!canPay) return
    if (createDebt && !customer) {
      toast.error('Selecciona un cliente para crear deuda')
      return
    }

    try {
      const sale = await createSale.mutateAsync({
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        customer_id: customer?.id ?? null,
        notes: notes || undefined,
        create_debt: createDebt,
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
    <div className="flex flex-col h-full border-l border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-none">
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
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-32 text-muted-foreground text-sm">
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
      </div>

      {/* Footer — Payment */}
      {items.length > 0 && (
        <div className="flex-none border-t border-border bg-card">
          <ScrollArea>
            <div className="px-4 py-3 space-y-3">
              {/* Customer */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Cliente {createDebt && <span className="text-destructive">*</span>}
                </Label>
                <CustomerSelector />
                {needsCustomerForDebt && (
                  <p className="text-xs text-destructive mt-1">Requerido para deuda</p>
                )}
              </div>

              {/* Debt Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-debt"
                  checked={createDebt}
                  onChange={(e) => setCreateDebt(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="create-debt" className="text-sm font-normal cursor-pointer">
                  Crear deuda (venta a crédito)
                </Label>
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
              {paymentMethod === 'cash' && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Monto recibido {createDebt && <span className="text-xs">(parcial o total)</span>}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="1000"
                    value={amountPaid || ''}
                    onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder={createDebt ? `$0 - ${formatCurrency(total)}` : `Mínimo ${formatCurrency(total)}`}
                    className="h-9"
                  />
                </div>
              )}

              {/* Change / Pending display */}
              {paymentMethod === 'cash' && !createDebt && (
                <div className={`flex justify-between text-sm font-medium rounded-lg px-3 py-2 ${
                  amountPaid >= total
                    ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                }`}>
                  <span>{amountPaid >= total ? 'Cambio' : 'Pendiente'}</span>
                  <span>
                    {amountPaid >= total
                      ? formatCurrency(amountPaid - total)
                      : formatCurrency(total - amountPaid)}
                  </span>
                </div>
              )}

              {/* Pending Debt Display */}
              {createDebt && (
                <div className="flex justify-between text-sm font-medium rounded-lg px-3 py-2 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                  <span>Pendiente</span>
                  <span>{formatCurrency(total - amountPaid)}</span>
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
            </div>
          </ScrollArea>

          {/* Fixed Footer Bottom (Total and Button) */}
          <div className="px-4 py-3 border-t border-border space-y-3 bg-card">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={(!canPay && !createDebt) || createSale.isPending || needsCustomerForDebt}
              onClick={handleCheckout}
            >
              {createSale.isPending 
                ? 'Procesando...' 
                : createDebt 
                  ? 'Confirmar venta a crédito' 
                  : 'Confirmar venta'
              }
            </Button>
          </div>
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
