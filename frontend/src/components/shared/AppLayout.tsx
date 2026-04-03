import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Receipt,
  Package,
  Tags,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Coffee,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'POS', path: '/pos' },
  { icon: Wallet, label: 'Caja', path: '/cash-register' },
  { icon: Receipt, label: 'Ventas', path: '/sales' },
  { icon: Package, label: 'Productos', path: '/products' },
  { icon: Tags, label: 'Categorías', path: '/categories' },
  { icon: Users, label: 'Clientes', path: '/customers' },
  { icon: BarChart3, label: 'Reportes', path: '/reports' },
  { icon: Users, label: 'Usuarios', path: '/users' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
]

const cashierNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'POS', path: '/pos' },
  { icon: Wallet, label: 'Caja', path: '/cash-register' },
  { icon: Receipt, label: 'Ventas', path: '/sales' },
]

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navItems = user?.role === 'admin' ? adminNavItems : cashierNavItems

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-6 py-5 border-b">
            <Coffee className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Cafetería</span>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t p-4">
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-40 bg-card border-b px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </header>

        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <main className="p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
