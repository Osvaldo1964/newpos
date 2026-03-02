# Plan de Implementación: Sistema NewPOS Moderno
_Última actualización: 2026-03-02_

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
- **Configuración de Tienda**: Logo, Redes Sociales y Pasarelas de Pago (Wompi, PayU, MercadoPago)

### 3. Inventario ✅
- **Categorías** de productos (CRUD)
- **Ítems / Productos**: CRUD con imágenes, SKU, precio e IVA
  - Resumen: conteo total, existencias y valor del inventario
  - Paginación y búsqueda
  - Desglose de stock por bodega (modal interactivo)
  - Búsqueda por nombre/SKU con `?search=` en API
  - **Flag E-commerce**: Control de visibilidad en tienda online
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

### 7. Ventas POS ✅
- Transacción atómica: cabecera + ítems + descuento de inventario + movimientos + pagos + caja
- **Modal de Pago multi-forma:** Efectivo, Tarjeta, Transferencia/QR con pago dividido
- **Ticket de Venta**: Generación automática en formato térmico (80mm) con impresión nativa

### 8. Módulo E-Commerce (Nuevo) ✅
- **Storefront**: Catálogo público reactivo (`/store/index.html`) con carrito y checkout
- **API Pública**: Endpoints protegidos bajo prefijo `/p/` para evitar colisiones
- **Gestión de Pedidos**: Panel administrativo con seguimiento de estados y notificaciones en tiempo real
- **Integración con Ventas**: Conversión automática de pedidos a ventas POS al marcar como Pagado/Completado
- **Branding en Reportes**: Logo y datos de la tienda integrados en todos los PDFs y reportes del sistema

---

## Estructura de Componentes Relevantes

```
api/src/
├── Controllers/  SaleController, InventoryController, StockTransferController,
│                 PurchaseController, CashController, TerceroController, AuthController,
│                 PublicController, PublicAuthController, OnlineOrderController, StoreConfigController
├── Models/       Sale, Product (+ search()), StockTransfer, PurchaseOrder, CashSession
└── Middleware/   JwtMiddleware

app/src/components/
├── sales/        POS.jsx, SaleTicket.jsx, OnlineOrders.jsx
├── inventory/    Items, Categories, Warehouses, PurchaseOrders,
│                 WarehouseEntries, StockTransfers
├── cash/         CashManager, CashAudit, SessionGuard
├── config/       Sedes, Users, Permissions, CashRegisters, CashConcepts, StoreSettings
└── contacts/     Terceros
```

---

## Próximos Pasos
1. Historial de ventas extendido con filtros avanzados
2. Anulación de ventas parcial/total con notas de crédito
3. Reportes avanzados de rentabilidad y margen por producto
4. Integración con facturación electrónica (DIAN)
