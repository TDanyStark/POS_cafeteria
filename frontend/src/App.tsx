import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from '@/components/shared/PrivateRoute'
import { RoleRoute } from '@/components/shared/RoleRoute'
import { AppLayout } from '@/components/shared/AppLayout'
import { Skeleton } from '@/components/ui/skeleton'

const LoginPage = lazy(() => import('@/pages/Login/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const PosPage = lazy(() => import('@/pages/Pos/PosPage').then(m => ({ default: m.PosPage })))
const CashRegisterPage = lazy(() => import('@/pages/CashRegister/CashRegisterPage').then(m => ({ default: m.CashRegisterPage })))
const SalesPage = lazy(() => import('@/pages/Sales/SalesPage').then(m => ({ default: m.SalesPage })))
const ProductsPage = lazy(() => import('@/pages/Products/ProductsPage').then(m => ({ default: m.ProductsPage })))
const CategoriesPage = lazy(() => import('@/pages/Categories/CategoriesPage').then(m => ({ default: m.CategoriesPage })))
const CustomersPage = lazy(() => import('@/pages/Customers/CustomersPage').then(m => ({ default: m.CustomersPage })))
const ReportsPage = lazy(() => import('@/pages/Reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const UsersPage = lazy(() => import('@/pages/Users/UsersPage').then(m => ({ default: m.UsersPage })))
const SettingsPage = lazy(() => import('@/pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const DebtorsPage = lazy(() => import('@/pages/Debtors/DebtorsPage').then(m => ({ default: m.DebtorsPage })))

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route element={<RoleRoute allowedRoles={['admin', 'cashier']} />}>
              <Route path="/pos" element={<PosPage />} />
              <Route path="/cash-register" element={<CashRegisterPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/debtors" element={<DebtorsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
