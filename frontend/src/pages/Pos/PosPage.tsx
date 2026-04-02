import { ProductGrid } from './ProductGrid'
import { CartPanel } from './CartPanel'
import { useActiveCashRegister } from '@/hooks/useCashRegister'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

export function PosPage() {
  const navigate = useNavigate()
  const { data: register, isLoading } = useActiveCashRegister()

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
          <Skeleton className="h-full" />
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
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Left — Products */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <h1 className="text-xl font-bold mb-3">Fast Checkout</h1>
        <div className="flex-1 overflow-hidden">
          <ProductGrid />
        </div>
      </div>

      {/* Right — Cart */}
      <div className="w-80 xl:w-96 flex flex-col overflow-hidden">
        <CartPanel />
      </div>
    </div>
  )
}
