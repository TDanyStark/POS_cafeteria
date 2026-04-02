import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/stores/cartStore'
import type { CartItem as CartItemType } from '@/types/sales'
import { Minus, Plus, Trash2 } from 'lucide-react'

interface CartItemProps {
  item: CartItemType
}

export function CartItemRow({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <div className="flex items-center gap-2 py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.product_name}</p>
        <p className="text-xs text-muted-foreground">${item.unit_price.toLocaleString()} c/u</p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          type="number"
          min={1}
          max={item.stock}
          value={item.quantity}
          onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
          className="w-12 h-7 text-center px-1 text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
          disabled={item.quantity >= item.stock}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="w-20 text-right">
        <p className="text-sm font-semibold">${item.subtotal.toLocaleString()}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => removeItem(item.product_id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}
