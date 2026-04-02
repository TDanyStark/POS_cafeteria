import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from '@/components/shared/PrivateRoute'
import { RoleRoute } from '@/components/shared/RoleRoute'
import { AppLayout } from '@/components/shared/AppLayout'
import { LoginPage } from '@/pages/Login/LoginPage'
import { CategoriesPage } from '@/pages/Categories/CategoriesPage'
import { ProductsPage } from '@/pages/Products/ProductsPage'
import { CashRegisterPage } from '@/pages/CashRegister/CashRegisterPage'
import { PosPage } from '@/pages/Pos/PosPage'
import { SalesPage } from '@/pages/Sales/SalesPage'
import { CustomersPage } from '@/pages/Customers/CustomersPage'
import { DashboardPage } from '@/pages/Dashboard/DashboardPage'
import { ReportsPage } from '@/pages/Reports/ReportsPage'
import { SettingsPage } from '@/pages/Settings/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route element={<RoleRoute allowedRoles={['admin', 'cashier']} />}>
            <Route path="/pos" element={<PosPage />} />
            <Route path="/cash-register" element={<CashRegisterPage />} />
            <Route path="/sales" element={<SalesPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<div className="text-lg font-medium">Usuarios - Fase 8</div>} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
