# Plan de Implementación: Sistema NewPOS Moderno
_Última actualización: 2026-02-27_

## Arquitectura

| Capa | Tecnología |
|------|-----------|
| Backend API | PHP 8 + Slim Framework 4 (REST) |
| Frontend SPA | React 18 + Vite + Framer Motion |
| Base de Datos | MySQL 8 (InnoDB, transacciones) |
| Seguridad | JWT (JSON Web Tokens) + Middleware |
| Permisos | RBAC granular por módulo y acción |

## Identidad Visual
- **Primario (Azul Profundo):** `#1E3A8A`
- **Secundario (Verde Esmeralda):** `#10B981`
- **Estilo:** Glassmorphism, micro-animaciones, fuentes Inter/Outfit
- **Iconografía:** Lucide React

---

## Módulos Implementados

### 1. Seguridad y Usuarios ✅
- Autenticación JWT (login / logout / expiración automática)
- Gestión de Usuarios vinculados a Sedes
- Matriz de Permisos granulares por Rol (CRUD por módulo)

### 2. Configuración ✅
- Maestro de Sedes
- Maestro de Cajas físicas por Sede
- Terceros (Clientes / Proveedores: `es_cliente` / `es_proveedor`)

### 3. Inventario ✅
- **Categorías** de productos (CRUD)
- **Ítems / Productos**: CRUD con imágenes, SKU, precio e IVA
  - Resumen: conteo total, existencias y valor del inventario
  - Paginación y búsqueda
  - Desglose de stock por bodega (modal interactivo)
  - Búsqueda por nombre/SKU con `?search=` en API
- **Bodegas**: CRUD + vínculo a sede

### 4. Compras ✅
- **Órdenes de Compra**: Cabecera + ítems, estados (BORRADOR → APROBADA → RECIBIDA), edición completa
- **Entradas a Bodega**: Conversión desde OC aprobadas, actualización de stock, edición posterior

### 5. Traslados entre Bodegas ✅
- Validación de stock | Transacción atómica
- Registro de movimientos (tipo TRASLADO)
- Edición con reversión automática de stock previo

### 6. Caja ✅
- Apertura y Cierre de sesiones con arqueo
- Conceptos de caja con paginación y búsqueda
- Movimientos manuales (Ingresos / Gastos)
- Auditoría en tiempo real (Admin / Supervisor)
- Columna `metodo_pago` en `cash_movements`

### 7. Ventas POS ✅ (completado en esta sesión)
**Base de datos:**
- Tabla `sales` (`user_id`, `tercero_id`, `sede_id`, `tipo`, `subtotal`, `iva_total`, `total`, `estado`)
- Tabla `sale_items` (`sale_id`, `product_id`, `cantidad`, `precio_unitario`, `descuento`, `subtotal`)
- Tabla `sale_payments` (`sale_id`, `metodo`, `monto`, `referencia`)

**Backend (`Sale.php`, `SaleController.php`, rutas `/sales`):**
- Transacción atómica: cabecera + ítems + descuento de inventario + movimientos + pagos + caja
- Endpoints: `GET /sales`, `GET /sales/{id}`, `POST /sales`

**Interfaz POS (`POS.jsx`):**
- Buscador dinámico (nombre/SKU, Enter para añadir primero, compatible con lector de barras)
- Selector de bodega de despacho y cliente/tercero
- Carrito con control de cantidades (+/−)
- Panel de totales (subtotal, IVA, total)
- **Modal de Pago multi-forma:** Efectivo, Tarjeta, Transferencia/QR
  - Pago dividido (múltiples medios en una venta)
  - Cambio/Vueltas en tiempo real (resaltado en verde cuando efectivo > total)
  - Validación inteligente: efectivo puede superar el total (excedente = cambio); otros medios deben coincidir exactamente
- Layout full-width automático al activar el POS (`CSS :has(.pos-container)`)

**Ticket de Venta (`SaleTicket.jsx`):**
- Se muestra automáticamente al finalizar cada venta
- Diseño de ticket térmico (80mm, Courier New)
- Incluye: Nº ticket, fecha/hora, cajero, cliente, bodega, ítems con precio unitario, totales, formas de pago y **cambio/vueltas** si aplica
- Botón "Imprimir Ticket" → ventana emergente lista para impresora

---

## Estructura de Componentes Relevantes

```
api/src/
├── Controllers/  SaleController, InventoryController, StockTransferController,
│                 PurchaseController, CashController, TerceroController, AuthController
├── Models/       Sale, Product (+ search()), StockTransfer, PurchaseOrder, CashSession
└── Middleware/   JwtMiddleware

app/src/components/
├── sales/        POS.jsx, SaleTicket.jsx
├── inventory/    Items, Categories, Warehouses, PurchaseOrders,
│                 WarehouseEntries, StockTransfers
├── cash/         CashManager, CashAudit, SessionGuard
├── config/       Sedes, Users, Permissions, CashRegisters, CashConcepts
└── contacts/     Terceros
```

---

## Próximos Pasos
1. Historial de ventas con filtros por fecha / cajero
2. Anulación de ventas (reversión de stock y caja)
3. Reportes de ventas por día / sede / producto
4. Generación de factura PDF
5. Módulo de Promociones y Descuentos
