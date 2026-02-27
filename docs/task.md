# Registro de Tareas: NewPOS
_Última actualización: 2026-02-27_

## Fase 1 — Cimientos ✅
- [x] Arquitectura (PHP Slim + MySQL + JWT + React Vite)
- [x] UI Base: Dashboard de módulos con cards y sub-módulos
- [x] Autenticación JWT funcional (login / logout / expiración)
- [x] CORS configurado para desarrollo local (XAMPP)

## Fase 2 — Maestros y Configuración ✅
- [x] Módulo Usuarios + RBAC granular (permisos por módulo/acción)
- [x] Módulo Sedes
- [x] Módulo Cajas físicas por sede
- [x] Módulo Conceptos de Caja (paginación + búsqueda)
- [x] Módulo Terceros (Clientes / Proveedores)

## Fase 3 — Inventario ✅
- [x] Categorías (CRUD)
- [x] Ítems / Productos (CRUD + imágenes + paginación + búsqueda dinámica)
  - [x] Resumen: conteo, existencias totales y valor del inventario
  - [x] Modal de desglose de stock por bodega
  - [x] Endpoint `?search=` para búsqueda rápida desde POS
- [x] Bodegas (CRUD)

## Fase 4 — Compras ✅
- [x] Órdenes de Compra (estados: BORRADOR / APROBADA / RECIBIDA, edición completa)
- [x] Entradas a Bodega (actualización de stock + movimientos, edición posterior)

## Fase 5 — Traslados ✅
- [x] Traslados entre Bodegas con transacción atómica
- [x] Edición de traslados con reversión automática de stock

## Fase 6 — Caja ✅
- [x] Apertura y Cierre de Sesiones (arqueo)
- [x] Registro de Ingresos / Gastos con conceptos
- [x] Auditoría multiusuario (Admin / Supervisor)
- [x] Columna `metodo_pago` añadida a `cash_movements`

## Fase 7 — Ventas POS ✅ (completada 2026-02-27)
- [x] Tablas: `sales`, `sale_items`, `sale_payments`
- [x] Modelo `Sale.php` con transacción atómica
  - [x] Descuento de inventario por bodega + movimiento tipo VENTA
  - [x] Registro de pagos en `sale_payments` y en sesión de caja
- [x] Interfaz POS (`POS.jsx`) full-width
  - [x] Buscador dinámico (compatible lector de barras)
  - [x] Carrito con control de cantidades
  - [x] Selector de bodega y cliente
  - [x] Modal de pago multi-forma (Efectivo, Tarjeta, Transferencia)
  - [x] Pago dividido entre múltiples medios
  - [x] Cambio/Vueltas en tiempo real (verde cuando efectivo > total)
  - [x] Validación inteligente: efectivo puede superar, otros medios deben coincidir
- [x] Ticket de Venta (`SaleTicket.jsx`)
  - [x] Aparece automáticamente tras venta exitosa
  - [x] Formato térmico 80mm (Courier New)
  - [x] Incluye cambio/vueltas si aplica
  - [x] Botón de impresión (ventana emergente, sin plugins)

## Fase 8 — Pendiente
- [ ] Historial de ventas con filtros por fecha / cajero
- [ ] Anulación de ventas (reversión de stock y caja)
- [ ] Reportes de ventas por fecha / sede / producto
- [ ] Generación de factura PDF
- [ ] Módulo de Promociones y Descuentos
- [ ] E-commerce público

## Correcciones Técnicas Aplicadas
- [x] CORS Preflight fix en Slim (OPTIONS wildcard)
- [x] BasePath dinámico para XAMPP
- [x] Fix ReferenceErrors en App.jsx (íconos faltantes)
- [x] Fix auth 401 en módulo de traslados (tablas faltantes en DB)
- [x] RouteController::class → instancia en rutas Slim
- [x] Búsqueda de productos con `?search=` en `InventoryController` + método `search()` en `Product.php`
- [x] Sale.php: columna `customer_id` → `tercero_id` (nombre real en BD)
- [x] Sale.php: `sale_items` no tiene `promocion_id` → removido del INSERT
- [x] Validación de pago: efectivo puede superar el total (excedente = cambio)
