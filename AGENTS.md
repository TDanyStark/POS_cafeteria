# POS Cafetería — Contexto del Proyecto

## Descripción
Sistema POS (Point of Sale) para mini cafetería. Digitaliza la operación diaria con control de inventario, caja, ventas, clientes y reportes en tiempo real.

## Skill Activo
**Cargar antes de cualquier tarea:** `fullstack-expert-slim-react`
Ruta: `file:///C:/Users/USER/.agents/skills/fullstack-expert-slim-react/SKILL.md`

Este skill define todas las convenciones de arquitectura, nomenclatura, UI y patrones que deben seguirse estrictamente en este proyecto.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | PHP Slim 4 (slim/slim-skeleton) | ^4.10 |
| DI Container | PHP-DI | ^6.4 |
| Frontend | React + TypeScript | React ^19, TS ~5.9 |
| Build Tool | Vite | ^8 |
| Estilos | Tailwind CSS | ^4.2 |
| Componentes UI | Shadcn UI | latest |
| Estado servidor | TanStack Query | latest |
| Estado global | Zustand | latest |
| Formularios | React Hook Form | latest |
| HTTP Client | Axios | latest |
| Routing | React Router DOM | latest |
| Base de datos | MySQL | — |
| Migraciones | Phinx | latest |
| Auth | JWT (firebase/php-jwt) | latest |
| Email | PHPMailer + SMTP Hostinger | latest |
| Infra | Hostinger Shared Hosting | — |

---

## Estructura de Directorios

```
POS_cafeteria/
├── api/                          # Backend Slim PHP
│   ├── src/
│   │   ├── Application/
│   │   │   ├── Actions/          # Controllers (un archivo por action)
│   │   │   └── Middleware/       # JWT, Role, CashRegister, etc.
│   │   ├── Domain/
│   │   │   ├── Entities/         # Modelos de dominio
│   │   │   ├── Repositories/     # Interfaces de repositorio
│   │   │   └── Services/         # Lógica de negocio
│   │   └── Infrastructure/
│   │       ├── Persistence/      # Implementaciones de repositorio (MySQL)
│   │       └── Mail/             # PHPMailer service
│   ├── database/
│   │   ├── migrations/           # Phinx migrations
│   │   └── seeders/              # Datos de prueba
│   └── public/                   # Entry point (index.php)
│
└── frontend/                     # React + TypeScript + Vite
    └── src/
        ├── components/
        │   └── shared/           # Componentes reutilizables
        ├── pages/                # Una carpeta por página
        │   └── Pos/
        │       ├── CustomerSelector.tsx
        │       └── CustomerFormModal.tsx
        ├── hooks/                # Custom hooks (useXxx.ts)
        ├── stores/               # Zustand stores
        ├── types/                # Interfaces TypeScript (espejo del backend)
        ├── utils/                # Helpers y funciones puras
        └── lib/                  # Configuración axios, queryClient, etc.
```

---

## Modelo de Datos

```sql
users            → id, name, email, password, role (admin|cashier), active, timestamps
categories       → id, name, slug, timestamps
products         → id, category_id, name, price, stock, min_stock, active, timestamps
customers        → id, name, phone(nullable), email(nullable), timestamps

cash_registers   → id, user_id, opened_at, closed_at, initial_amount, final_amount,
                   declared_amount, difference, status (open|closed), timestamps
cash_movements   → id, cash_register_id, user_id, type (in|out), amount,
                   description, timestamps

sales            → id, cash_register_id, user_id, customer_id(nullable),
                   total, payment_method (cash|transfer),
                   amount_paid, change_amount, notes, timestamps
sale_items       → id, sale_id, product_id, quantity, unit_price, subtotal

email_settings   → id, smtp_host, smtp_port, smtp_user, smtp_pass,
                   from_name, notification_email, active
```

---

## Endpoints API (`/api/v1/`)

| Módulo | Método | Ruta |
|--------|--------|------|
| Health | GET | `/health` |
| **Auth** | POST | `/auth/login` |
| | GET | `/auth/me` |
| **Users** | GET | `/users` |
| | POST | `/users` |
| | PUT | `/users/{id}` |
| | DELETE | `/users/{id}` |
| **Categories** | GET | `/categories` |
| | POST | `/categories` |
| | PUT | `/categories/{id}` |
| | DELETE | `/categories/{id}` |
| **Products** | GET | `/products` |
| | POST | `/products` |
| | PUT | `/products/{id}` |
| | DELETE | `/products/{id}` |
| | PATCH | `/products/{id}/stock` |
| **Customers** | GET | `/customers` |
| | POST | `/customers` |
| | GET | `/customers/{id}` |
| **Cash Registers** | POST | `/cash-registers/open` |
| | POST | `/cash-registers/{id}/close` |
| | GET | `/cash-registers/active` |
| | GET | `/cash-registers/{id}` |
| | POST | `/cash-registers/{id}/movements` |
| **Sales** | POST | `/sales` |
| | GET | `/sales` |
| | GET | `/sales/{id}` |
| **Reports** | GET | `/reports/top-sellers` |
| | GET | `/reports/sales-summary` |
| | GET | `/reports/stock-alerts` |
| **Settings** | GET | `/settings/email` |
| | PUT | `/settings/email` |

---

## Páginas Frontend

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/login` | Autenticación | Público |
| `/dashboard` | Resumen del día, stock bajo, últimas ventas | Admin + Cajero |
| `/pos` | Fast Checkout — interfaz de venta rápida (con `CustomerSelector` y `CustomerFormModal`) | Admin + Cajero |
| `/cash-register` | Apertura, movimientos y cierre de caja | Admin + Cajero |
| `/sales` | Historial de ventas con filtros | Admin + Cajero |
| `/products` | Gestión de catálogo y stock | Admin |
| `/categories` | Gestión de categorías | Admin |
| `/customers` | Historial de clientes | Admin |
| `/reports` | Top sellers y consolidado financiero | Admin |
| `/users` | Gestión de cajeros | Admin |
| `/settings` | Configuración SMTP y correo | Admin |

---

## Reglas de Negocio Críticas

### Caja (Cash Register)
- **Sin caja abierta:** El sistema bloquea ventas y redirige a abrir caja.
- **Caja anterior sin cerrar:** Antes de abrir una nueva caja, el sistema obliga a cerrar la del turno anterior.
- **Apertura:** Requiere ingresar saldo inicial (conteo físico de efectivo).
- **Cierre:** Calcula `saldo_esperado = initial_amount + ingresos_efectivo - egresos`. El cajero declara el monto físico. Se registra la diferencia (sobrante/faltante) pero no bloquea el cierre.

### Ventas
- `POST /sales` verifica existencia de `cash_register` con `status = open` para el `user_id`. Sin caja abierta → `403`.
- El descuento de stock ocurre en la misma transacción DB. Si un producto no tiene stock suficiente → la venta se rechaza completa.
- `customer_id` es nullable. Las ventas anónimas son válidas.
- Las ventas registran el `user_id` del cajero que las realizó.

### Clientes
- El `nombre` es el único campo obligatorio. `teléfono` y `email` son opcionales.
- La búsqueda en el POS se realiza por `nombre`, `teléfono` o `email`.
- El POS permite el registro rápido de clientes mediante un modal sin abandonar el flujo de venta.

### Notificaciones Email
- Se disparan después de confirmar cada venta.
- Son asíncronas: no bloquean la respuesta al frontend.
- Si el envío falla, se loguea el error pero la venta queda registrada correctamente.

### Roles
- `admin`: acceso total a todos los módulos.
- `cashier`: acceso solo a `/pos`, `/cash-register`, `/sales` (sus propias ventas) y `/dashboard`.

---

## Seeders por Defecto

| Entidad | Datos |
|---------|-------|
| Users | 1 admin (`admin@cafeteria.com` / `admin123`) + 2 cajeros de prueba |
| Categories | Bebidas, Comidas, Snacks, Postres, Otros |
| Products | 10 productos distribuidos entre categorías con stock inicial |
| Email Settings | Registro vacío listo para configurar |

---

## Dark Mode

El proyecto tiene soporte completo de dark mode con tres modos: `light`, `dark` y `system` (predeterminado).

### Arquitectura
- **Tailwind v4:** `@custom-variant dark (&:is(.dark *))` para el toggle manual con clase `.dark` en `<html>`.
- **Sistema por defecto:** `@media (prefers-color-scheme: dark)` en `index.css` aplica las variables cuando `<html>` no tiene `.light` ni `.dark`.
- **`useTheme` hook** (`src/hooks/useTheme.ts`): gestiona el estado del tema, persiste en `localStorage` (`pos-theme`), escucha cambios del sistema cuando está en modo `system`.
- **`ThemeProvider`** (`src/components/shared/ThemeProvider.tsx`): provee el contexto del tema a toda la app. Está montado en `main.tsx` como el wrapper más externo.

### Lógica de clases en `<html>`
| Modo seleccionado | Clase en `<html>` | CSS activo |
|-------------------|--------------------|------------|
| `system` (default) | ninguna | `prefers-color-scheme` del SO |
| `light` | `.light` | Variables `:root` (light) |
| `dark` | `.dark` | Variables `.dark` block |

### Reglas para los agentes
- **Todas las vistas DEBEN tener soporte dark mode.** Usar siempre las variables semánticas de Shadcn (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, etc.), NUNCA colores hardcodeados como `bg-white` o `text-gray-900`.
- Si necesitas un color que cambie con el tema, usa `dark:` variant: `className="bg-white dark:bg-gray-900"`.
- Para toggle de tema en la UI (botón en el header/sidebar), usar `useThemeContext()` del `ThemeProvider`.
- **No usar** `document.documentElement.classList` directamente — siempre via el hook `useTheme` o `useThemeContext`.

### Ejemplo de uso del toggle
```tsx
import { useThemeContext } from '@/components/shared/ThemeProvider'

function ThemeToggle() {
  const { theme, setTheme } = useThemeContext()
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? 'Claro' : 'Oscuro'}
    </button>
  )
}
```

---

## Convenciones (resumen rápido)

- **Rutas API:** siempre `/api/v1/...` en plural y `kebab-case`
- **Tablas DB:** plural y `snake_case`
- **Clases PHP:** `PascalCase`
- **Variables/métodos PHP:** `camelCase`
- **Componentes React:** `PascalCase`, un componente por archivo `.tsx`
- **Custom Hooks:** `useXxx.ts`
- **Estado en URL:** filtros, paginación y búsquedas siempre en query params (`?page=1&category=bebidas`)
- **Paginación:** obligatoria en todos los endpoints que retornen colecciones
- **Errores backend:** siempre `{ "success": false, "message": "...", "errors": {} }`
- **Feedback UI:** solo Toast/Notificaciones de Shadcn, nunca `alert()`
- **Dark mode:** siempre usar variables semánticas Shadcn, nunca colores hardcodeados


## Migraciones:

- **Correr migraciones pendientes**
`composer migrate`

- **Poblar datos de prueba**
`composer seed`

- **Reset completo (borrar todo y volver a crear)**
`composer reset`