import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useTopSellers, useSalesSummary } from '@/hooks/useReports'
import { Trophy, TrendingUp, RotateCcw } from 'lucide-react'

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('top-sellers')

  const dateFrom = searchParams.get('date_from') ?? ''
  const dateTo   = searchParams.get('date_to') ?? ''

  const setParam = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasFilters = dateFrom || dateTo

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes</h1>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Desde</p>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setParam('date_from', e.target.value)}
            className="w-40 h-9"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Hasta</p>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setParam('date_to', e.target.value)}
            className="w-40 h-9"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="top-sellers" className="gap-2">
            <Trophy className="h-4 w-4" />
            Top Vendidos
          </TabsTrigger>
          <TabsTrigger value="sales-summary" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Consolidado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top-sellers" className="mt-4">
          <TopSellersList dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} />
        </TabsContent>

        <TabsContent value="sales-summary" className="mt-4">
          <SalesSummaryView dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TopSellersList({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) {
  const { data, isLoading } = useTopSellers(10, dateFrom, dateTo)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay datos de ventas en el período seleccionado
        </CardContent>
      </Card>
    )
  }

  const maxQuantity = Math.max(...data.map((item) => item.total_quantity))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Productos más vendidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((product) => {
          const percentage = maxQuantity > 0 ? (product.total_quantity / maxQuantity) * 100 : 0

          return (
            <div
              key={product.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  product.rank <= 3
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {product.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{product.product_name}</p>
                  <p className="text-sm font-semibold">
                    ${product.total_revenue.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {product.category_name ?? 'Sin categoría'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.total_quantity} unidades
                  </p>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function SalesSummaryView({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) {
  const { data, isLoading } = useSalesSummary(dateFrom, dateTo)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay datos de ventas en el período seleccionado
        </CardContent>
      </Card>
    )
  }

  const cashPercentage = data.total_amount > 0 ? Math.round((data.total_cash / data.total_amount) * 100) : 0
  const transferPercentage = data.total_amount > 0 ? Math.round((data.total_transfer / data.total_amount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.total_amount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.total_sales} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.total_cash.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{cashPercentage}%</Badge>
              <span className="text-xs text-muted-foreground">
                {data.by_method.find((m) => m.payment_method === 'cash')?.total_sales ?? 0} ventas
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transferencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.total_transfer.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{transferPercentage}%</Badge>
              <span className="text-xs text-muted-foreground">
                {data.by_method.find((m) => m.payment_method === 'transfer')?.total_sales ?? 0} ventas
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Desglose por método de pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.by_method.map((method) => {
              const percentage =
                data.total_amount > 0
                  ? Math.round((method.total_amount / data.total_amount) * 100)
                  : 0

              return (
                <div key={method.payment_method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {method.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                    </span>
                    <div className="text-right">
                      <span className="font-semibold">${method.total_amount.toLocaleString()}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({method.total_sales} ventas)
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        method.payment_method === 'cash' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
