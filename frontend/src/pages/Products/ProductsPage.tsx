import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, PackageOpen, Barcode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { formatCurrency } from '@/utils/format'
import { ProductFormModal } from './ProductFormModal'
import { DeleteProductDialog } from './DeleteProductDialog'
import { StockAdjustModal } from './StockAdjustModal'
import type { Product } from '@/types/catalog'

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [stockTarget, setStockTarget] = useState<Product | null>(null)

  const page = parseInt(searchParams.get('page') ?? '1')
  const categoryId = searchParams.get('category_id')
    ? parseInt(searchParams.get('category_id')!)
    : null
  const search = searchParams.get('search') ?? ''
  const activeParam = searchParams.get('active')
  const active = activeParam === '1' ? true : activeParam === '0' ? false : null

  const { data: productsData, isLoading } = useProducts({
    page,
    per_page: 15,
    category_id: categoryId,
    search: search || undefined,
    active,
  })

  const { data: categories } = useCategories({ page: 1, per_page: 100 })

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value === null || value === '') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    if (key !== 'page') next.set('page', '1')
    setSearchParams(next)
  }

  const handleEdit = (product: Product) => {
    setEditTarget(product)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditTarget(null)
  }

  const pagination = productsData?.pagination

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el catálogo y stock de productos
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Input
          placeholder="Buscar por nombre..."
          className="w-full sm:max-w-xs"
          defaultValue={search}
          onChange={(e) => setParam('search', e.target.value)}
        />

        <Select
          value={categoryId ? String(categoryId) : 'all'}
          onValueChange={(v) => setParam('category_id', v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas las categorías">
              {categoryId
                ? (categories?.data.find((c) => c.id === categoryId)?.name ?? 'Todas las categorías')
                : 'Todas las categorías'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories?.data.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={activeParam ?? 'all'}
          onValueChange={(v) => setParam('active', v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Estado">
              {activeParam === '1' ? 'Activos' : activeParam === '0' ? 'Inactivos' : 'Todos'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="1">Activos</SelectItem>
            <SelectItem value="0">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden min-w-0 max-w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-35">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
              ))
            ) : productsData?.data && productsData.data.length > 0 ? (
              productsData.data.map((product) => {
                const isLowStock = product.stock <= product.min_stock
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium text-foreground">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      {product.code ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <Barcode className="h-3.5 w-3.5" />
                          {product.code}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category_name}
                    </TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? 'default' : 'outline'}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ajustar stock"
                          onClick={() => setStockTarget(product)}
                        >
                          <PackageOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {productsData?.data.length ?? 0} de {pagination.total} productos
          </span>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}
            >
              Anterior
            </Button>
            <span>
              Página {pagination.page} de {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.total_pages}
              onClick={() => setParam('page', String(page + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <ProductFormModal
        open={formOpen}
        onClose={handleCloseForm}
        product={editTarget}
      />

      <DeleteProductDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        product={deleteTarget}
      />

      <StockAdjustModal
        open={!!stockTarget}
        onClose={() => setStockTarget(null)}
        product={stockTarget}
      />
    </div>
  )
}
