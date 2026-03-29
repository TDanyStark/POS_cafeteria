import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from '@/components/shared/PrivateRoute'
import { RoleRoute } from '@/components/shared/RoleRoute'
import { AppLayout } from '@/components/shared/AppLayout'
import { LoginPage } from '@/pages/Login/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<div className="text-lg font-medium">Dashboard - Fase 6</div>} />

          <Route element={<RoleRoute allowedRoles={['admin', 'cashier']} />}>
            <Route path="/pos" element={<div className="text-lg font-medium">POS - Fase 3</div>} />
            <Route path="/cash-register" element={<div className="text-lg font-medium">Caja - Fase 4</div>} />
            <Route path="/sales" element={<div className="text-lg font-medium">Ventas - Fase 5</div>} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/products" element={<div className="text-lg font-medium">Productos - Fase 6</div>} />
            <Route path="/categories" element={<div className="text-lg font-medium">Categorías - Fase 6</div>} />
            <Route path="/customers" element={<div className="text-lg font-medium">Clientes - Fase 6</div>} />
            <Route path="/reports" element={<div className="text-lg font-medium">Reportes - Fase 6</div>} />
            <Route path="/users" element={<div className="text-lg font-medium">Usuarios - Fase 6</div>} />
            <Route path="/settings" element={<div className="text-lg font-medium">Configuración - Fase 6</div>} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
