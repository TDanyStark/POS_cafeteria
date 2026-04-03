import { AlertTriangle, DollarSign, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDailySummary, useLatestSales, useStockAlerts } from '@/hooks/useDashboard'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDailySummary()
  const { data: latestSales, isLoading: salesLoading } = useLatestSales(5)
  const { data: stockAlerts, isLoading: alertsLoading } = useStockAlerts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen del día</p>
      </div>

        {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${summary?.total_amount.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.total_sales ?? 0} transacciones
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${summary?.total_cash.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.total_sales ? Math.round((summary.total_cash / summary.total_amount) * 100) : 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferencia</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${summary?.total_transfer.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.total_sales ? Math.round((summary.total_transfer / summary.total_amount) * 100) : 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stockAlerts?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stockAlerts?.length ? 'Productos bajo stock mínimo' : 'Sin alertas'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Latest Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas ventas</CardTitle>
            <Link to="/sales" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : latestSales?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay ventas hoy</p>
            ) : (
              <div className="space-y-3">
                {latestSales?.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Venta #{sale.id}
                        <span className="text-muted-foreground font-normal ml-2">
                          {sale.cashier_name}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${sale.total.toLocaleString()}</p>
                      <Badge
                        variant={sale.payment_method === 'cash' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {sale.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stock bajo</CardTitle>
            <Link to="/products" className="text-sm text-primary hover:underline">
              Ver inventario
            </Link>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stockAlerts?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-muted-foreground text-sm">Inventario OK</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stockAlerts?.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category_name ?? 'Sin categoría'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive">
                        {product.stock} / {product.min_stock}
                      </p>
                      <p className="text-xs text-muted-foreground">unds.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
