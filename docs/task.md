# Registro de Tareas: NewPOS
_Última actualización: 2026-03-02_

## Fase 1 — Cimientos ✅
- [x] Arquitectura (PHP Slim + MySQL + JWT + React Vite)
- [x] UI Base: Dashboard de módulos con cards y sub-módulos
- [x] Autenticación JWT funcional (login / logout / expiración automáticamente)
- [x] CORS configurado para desarrollo local (XAMPP)

## Fase 2 — Maestros y Configuración ✅ 
- [x] Módulo Usuarios + RBAC granular (permisos por módulo/acción)
- [x] Módulo Sedes y Cajas físicas
- [x] Módulo Conceptos de Caja
- [x] Módulo Terceros (Clientes / Proveedores)

## Fase 3 — Inventario ✅
- [x] Categorías y Bodegas
- [x] Ítems / Productos (CRUD + imágenes + paginación + búsqueda dinámica)
- [x] Desglose de stock por bodega
- [x] Flag para visibilidad en tienda online

## Fase 4 — Compras ✅
- [x] Órdenes de Compra (estados: BORRADOR / APROBADA / RECIBIDA)
- [x] Entradas a Bodega (actualización de stock + movimientos)

## Fase 5 — Traslados ✅
- [x] Traslados entre Bodegas con transacción atómica
- [x] Edición de traslados con reversión automática de stock

## Fase 6 — Caja ✅
- [x] Apertura y Cierre de Sesiones (arqueo)
- [x] Registro de Ingresos / Gastos con conceptos
- [x] Auditoría multiusuario (Admin / Supervisor)

## Fase 7 — Ventas POS ✅
- [x] Modelo `Sale.php` con transacción atómica y descuento de stock
- [x] Interfaz POS (`POS.jsx`) con buscador dinámico y carrito
- [x] Modal de pago multi-forma y dividido
- [x] Ticket de Venta en formato térmico (80mm) con botón de impresión

## Fase 8 — E-Commerce & Estabilidad ✅ (completada 2026-03-02)
- [x] Tienda Pública (`/store/index.html`) con carrito y checkout
- [x] Prefijo de API `/p/` para evitar colisiones entre Admin y Tienda
- [x] Gestión de Pedidos Online en Panel Admin
- [x] Conversión automática de Pedido -> Venta POS
- [x] Notificaciones de nuevos pedidos en el Dashboard
- [x] Logo y Branding dinámico en reportes PDF
- [x] Refinamiento de Modales (React Portals) para mejor visualización
- [x] Fallback de estados y normalización de 'PENDIENTE' para visualización de botones

## Fase 9 — Reportes y Optimización ✅ (completada 2026-03-03)
- [x] Corrección de URLs malformadas en reportes dinámicos
- [x] Implementación de rutas de API para reportes de Top Productos/Clientes
- [x] Optimización visual de KPI cards y tablas (estilo compacto/premium)
- [x] Soporte para scroll horizontal en tablas extensas
- [x] Sincronización de Logo e Información en cabeceras de reportes (`StoreHeader`) y tickets (`SaleTicket`)
- [x] Integración de API para Reporte de Inventario Físico agrupado por Bodega con valores monetarios
- [x] Refinamiento estricto de estilos de impresión en Inventario Físico (fuente 10px unificada)
- [x] Implementación y corrección de API para Desglose de Stock por Bodega (`/inventory/products/{id}/stock`)
- [x] Ajuste crítico en validación de transacciones de caja (`Sale.php`) bloqueando ventas sin stock en la bodega seleccionada

## Fase 10 — Próximos Pasos (Hoja de Ruta)
- [ ] Historial de ventas avanzado con filtros de fecha
- [ ] Anulación de ventas (reversión de stock y caja)
- [ ] Reportes de rentabilidad y margen
- [ ] Integración con facturación electrónica (DIAN)
