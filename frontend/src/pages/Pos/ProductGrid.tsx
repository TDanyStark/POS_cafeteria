import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { useCartStore } from '@/stores/cartStore'
import type { Product } from '@/types/catalog'
import { Search } from 'lucide-react'

export function ProductGrid() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const { data: categoriesData } = useCategories({ page: 1, per_page: 100 })
  const { data: productsData, isLoading } = useProducts({
    search,
    category_id: categoryId,
    active: true,
    per_page: 50,
  })

  const addItem = useCartStore((s) => s.addItem)

  const handleAdd = (product: Product) => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_code: product.code,
      unit_price: product.price,
      stock: product.stock,
    })
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={categoryId === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryId(null)}
        >
          Todos
        </Button>
        {categoriesData?.data.map((cat) => (
          <Button
            key={cat.id}
            variant={categoryId === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryId(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {productsData?.data.map((product) => {
              const outOfStock = product.stock <= 0
              return (
                <button
                  key={product.id}
                  onClick={() => !outOfStock && handleAdd(product)}
                  disabled={outOfStock}
                  className={`
                    relative text-left p-3 rounded-xl border transition-all
                    bg-card hover:bg-accent border-border
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:shadow-md active:scale-95
                  `}
                >
                  <div className="font-medium text-sm leading-tight line-clamp-2 mb-1">
                    {product.name}
                  </div>
                  <div className="text-primary font-bold text-base">
                    ${product.price.toLocaleString()}
                  </div>
                  <div className="mt-1">
                    {outOfStock ? (
                      <Badge variant="destructive" className="text-xs">Sin stock</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Stock: {product.stock}</Badge>
                    )}
                  </div>
                </button>
              )
            })}
            {productsData?.data.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No se encontraron productos
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
