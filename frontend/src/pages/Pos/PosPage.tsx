import { useState } from 'react'
import { ProductGrid } from './ProductGrid'
import { CartPanel } from './CartPanel'
import { useActiveCashRegister } from '@/hooks/useCashRegister'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ShoppingCart, Grid3X3 } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'

export function PosPage() {
  const navigate = useNavigate()
  const { data: register, isLoading } = useActiveCashRegister()
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products')
  const cartItems = useCartStore((s) => s.items)
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0)

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
          <Skeleton className="h-32 sm:h-full" />
        </div>
      </div>
    )
  }

  if (!register) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Sin caja abierta</h2>
          <p className="text-muted-foreground text-sm">
            Debes abrir una caja antes de realizar ventas.
          </p>
          <Button onClick={() => navigate('/cash-register')}>
            Ir a caja
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-3 sm:-m-6 h-screen flex flex-col overflow-hidden">
      {/* Mobile tab switcher — only visible on small screens */}
      <div className="flex md:hidden border-b border-border bg-card flex-none">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            mobileView === 'products'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setMobileView('products')}
        >
          <Grid3X3 className="h-4 w-4" />
          Productos
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors relative ${
            mobileView === 'cart'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setMobileView('cart')}
        >
          <ShoppingCart className="h-4 w-4" />
          Carrito
          {cartCount > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-58px)] bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: side-by-side | Mobile: single panel at a time */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Products */}
        <div
          className={`flex-1 p-4 overflow-hidden flex-col ${
            mobileView === 'products' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <h1 className="text-xl font-bold mb-3">Fast Checkout</h1>
          <div className="flex-1 overflow-hidden">
            <ProductGrid />
          </div>
        </div>

        {/* Right — Cart */}
        <div
          className={`w-full md:w-80 xl:w-96 flex-col overflow-hidden ${
            mobileView === 'cart' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <CartPanel />
        </div>
      </div>
    </div>
  )
}
