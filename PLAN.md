# Plan de Ejecución — POS Mini Cafetería

Estado general: **EN PROGRESO**

---

## Fase 1 — Scaffolding & Infraestructura Base
**Estado:** [x] Completada

### Backend (`/api`)
- [x] Instalar dependencias faltantes: `phinx`, `firebase/php-jwt`, `phpmailer/phpmailer`, `vlucas/phpdotenv`
- [x] Crear estructura Clean Architecture: `Application/Actions`, `Application/Middleware`, `Domain/Entities`, `Domain/Repositories`, `Domain/Services`, `Infrastructure/Persistence`, `Infrastructure/Mail`
- [x] Configurar `.env` y `.env.example` con variables de DB, JWT y SMTP
- [x] Configurar conexión MySQL en `dependencies.php`
- [x] Registrar ruta `GET /api/v1/health` con validación de conexión DB
- [x] Configurar CORS middleware para desarrollo local
- [x] Crear `database/migrations/` y `database/seeders/` con `phinx.php`

### Frontend (`/frontend`)
- [x] Instalar dependencias faltantes: `axios`, `react-router-dom`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `shadcn`
- [x] Configurar proxy en `vite.config.ts` (`/api` → `http://localhost:8080`)
- [x] Inicializar Shadcn UI (`npx shadcn@latest init`)
- [x] Crear estructura de carpetas: `components/shared`, `pages`, `hooks`, `stores`, `types`, `utils`, `lib`
- [x] Configurar `axios` instance con interceptor de errores en `lib/axios.ts`
- [x] Configurar `QueryClient` en `lib/queryClient.ts`
- [x] Configurar `react-router-dom` con layout base en `App.tsx`

---

## Fase 2 — Autenticación & Usuarios
**Estado:** [x] Completada  
**Depende de:** Fase 1

### Backend
- [x] Migración: tabla `users`
- [x] Seeder: 1 admin + 2 cajeros de prueba
- [x] `LoginAction` — `POST /api/v1/auth/login`
- [x] `MeAction` — `GET /api/v1/auth/me`
- [x] `JwtMiddleware` — valida token en rutas protegidas
- [x] `RoleMiddleware` — restringe acceso por rol (`admin`, `cashier`)

### Frontend
- [x] Página `/login` con formulario (React Hook Form + Shadcn)
- [x] `useAuthStore` (Zustand) — token, user, login, logout
- [x] `PrivateRoute` — redirige a `/login` si no hay token
- [x] `RoleRoute` — redirige si el rol no tiene acceso
- [x] Layout principal con sidebar (links según rol)
- [x] Types: `User`, `AuthResponse`

---

## Fase 3 — Catálogo (Categorías + Productos)
**Estado:** [x] Completada  
**Depende de:** Fase 2

### Backend
- [x] Migración: tabla `categories`
- [x] Migración: tabla `products`
- [x] Seeder: 5 categorías por defecto (Bebidas, Comidas, Snacks, Postres, Otros)
- [x] Seeder: 10 productos distribuidos con stock inicial
- [x] CRUD `categories` — `GET/POST/PUT/DELETE /api/v1/categories`
- [x] CRUD `products` — `GET/POST/PUT/DELETE /api/v1/products` (paginado, filtros por categoría)
- [x] `PATCH /api/v1/products/{id}/stock` — ajuste manual de stock

### Frontend
- [x] Página `/categories` — listado + modal crear/editar/eliminar
- [x] Página `/products` — listado paginado con filtros en URL (`?page=&category=&search=`)
- [x] Skeleton loaders en listados
- [x] Formulario producto con selector de categoría
- [x] Types: `Category`, `Product`, `PaginatedResponse`

---

## Fase 4 — Gestión de Caja
**Estado:** [ ] Pendiente  
**Depende de:** Fase 2

### Backend
- [ ] Migración: tabla `cash_registers`
- [ ] Migración: tabla `cash_movements`
- [ ] `POST /api/v1/cash-registers/open` — valida si hay caja anterior sin cerrar → `409`
- [ ] `POST /api/v1/cash-registers/{id}/close` — calcula saldo esperado vs declarado, guarda diferencia
- [ ] `GET /api/v1/cash-registers/active` — retorna caja abierta del usuario actual
- [ ] `GET /api/v1/cash-registers/{id}` — detalle con movimientos
- [ ] `POST /api/v1/cash-registers/{id}/movements` — registrar entrada/salida manual
- [ ] `CashRegisterMiddleware` — verifica caja abierta antes de procesar ventas

### Frontend
- [ ] Página `/cash-register`:
  - Vista "Sin caja abierta" → formulario de apertura con saldo inicial
  - Vista "Caja abierta" → resumen del turno, movimientos, botón cierre
  - Vista "Cerrar caja" → formulario con monto declarado + resumen diferencia
- [ ] Guard: si hay caja anterior sin cerrar, mostrar modal de cierre forzado antes de abrir
- [ ] Types: `CashRegister`, `CashMovement`

---

## Fase 5 — Ventas / Fast Checkout
**Estado:** [ ] Pendiente  
**Depende de:** Fases 3 y 4

### Backend
- [ ] Migración: tabla `customers`
- [ ] Migración: tabla `sales`
- [ ] Migración: tabla `sale_items`
- [ ] `POST /api/v1/sales`:
  - Verifica caja abierta (via middleware) → `403` si no existe
  - Descuenta stock en transacción DB → rechaza venta completa si stock insuficiente
  - Registra `user_id` del cajero
  - Dispara email asíncrono tras confirmar
- [ ] `GET /api/v1/sales` — paginado, filtros por fecha, método de pago, cajero
- [ ] `GET /api/v1/sales/{id}` — detalle con items
- [ ] `GET /api/v1/customers` — paginado
- [ ] `POST /api/v1/customers`
- [ ] `GET /api/v1/customers/{id}`

### Frontend
- [ ] Página `/pos` (Fast Checkout):
  - Grilla de productos filtrable por categoría
  - Carrito lateral con items, cantidades y subtotales
  - Selector de método de pago (Efectivo / Transferencia)
  - Calculadora de cambio (solo efectivo)
  - Campo opcional de cliente (buscar por nombre/teléfono o registrar nuevo)
  - Confirmación y reset del carrito
- [ ] Página `/sales` — historial paginado con filtros en URL
- [ ] Página `/customers` — historial de clientes
- [ ] Types: `Sale`, `SaleItem`, `Customer`, `CartItem`

---

## Fase 6 — Reportes & Dashboard
**Estado:** [ ] Pendiente  
**Depende de:** Fase 5

### Backend
- [ ] `GET /api/v1/reports/top-sellers` — productos más vendidos (con filtro de fecha)
- [ ] `GET /api/v1/reports/sales-summary` — total ventas por periodo y método de pago
- [ ] `GET /api/v1/reports/stock-alerts` — productos con stock <= min_stock

### Frontend
- [ ] Página `/dashboard`:
  - Resumen del día (ventas totales, efectivo vs transferencia)
  - Alertas de stock bajo
  - Últimas ventas del turno
- [ ] Página `/reports`:
  - Top sellers con ranking visual
  - Consolidado financiero con filtro por rango de fechas
- [ ] Types: `TopSeller`, `SalesSummary`, `StockAlert`

---

## Fase 7 — Notificaciones Email
**Estado:** [ ] Pendiente  
**Depende de:** Fase 5

### Backend
- [ ] Migración: tabla `email_settings`
- [ ] Seeder: registro vacío por defecto
- [ ] `EmailService` con PHPMailer + SMTP Hostinger
- [ ] Template HTML de comprobante de venta
- [ ] Integración asíncrona en `POST /api/v1/sales` (no bloquea respuesta)
- [ ] `GET /api/v1/settings/email`
- [ ] `PUT /api/v1/settings/email`

### Frontend
- [ ] Página `/settings`:
  - Formulario SMTP (host, puerto, usuario, contraseña, nombre remitente, correo destino)
  - Botón "Enviar correo de prueba"
- [ ] Types: `EmailSettings`

---

## Fase 8 — Gestión de Usuarios (Admin)
**Estado:** [ ] Pendiente  
**Depende de:** Fase 2

### Backend
- [ ] `GET /api/v1/users` — paginado (solo admin via RoleMiddleware)
- [ ] `POST /api/v1/users` — crear cajero
- [ ] `PUT /api/v1/users/{id}` — editar datos / activar / desactivar
- [ ] `DELETE /api/v1/users/{id}` — eliminar cajero

### Frontend
- [ ] Página `/users` — listado paginado de cajeros
- [ ] Modal crear/editar cajero (nombre, email, contraseña, activo)
- [ ] Solo visible en sidebar para rol `admin`

---

## Checklist Global de Calidad
- [ ] Todas las colecciones están paginadas
- [ ] Todos los filtros y paginación reflejados en URL params
- [ ] Skeleton loaders en todos los listados
- [ ] Manejo de errores con Toast (nunca `alert()`)
- [ ] Tipos TypeScript definidos para todas las respuestas del backend
- [ ] Variables sensibles en `.env` (nunca hardcodeadas)
- [ ] CORS configurado correctamente para producción en Hostinger
- [ ] `.htaccess` configurado para Slim en `api/public/`
- [ ] Build de producción probado (`npm run build`)
