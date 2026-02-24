# Plan de Implementación: Sistema NewPOS Moderno

Este proyecto consiste en desarrollar un Punto de Venta (POS) robusto utilizando un stack moderno en la carpeta raíz `newpos`.

## Arquitectura Propuesta
- **Backend**: PHP (Slim Framework) como API RESTful.
- **Frontend**: SPA con React + Vite + Framer Motion.
- **Base de Datos**: MySQL (InnoDB) con transacciones seguras.
- **Seguridad**: JWT para autenticación y un sistema robusto de **RBAC Granular**.

## Identidad Visual y Estilo (Serious & Premium)
Utilizamos una paleta basada en tonos **Verdes** y **Azules**:
- **Primario (Azul Profundo)**: `#1E3A8A`
- **Secundario (Verde Esmeralda)**: `#10B981`

## Arquitectura de UI (Navegación por Tarjetas)
Dashboard interactivo donde cada módulo principal abre sub-tarjetas dinámicas.

### Módulos Implementados (Estructura)
- **Inventarios**: Items, Bodegas, Compras, Traslados, Ajustes.
- **Ventas**: POS, Promociones.
- **Reportes**: Ventas por Día, Ventas por Sede.
- **Caja**: Apertura/Cierre, Movimientos, Arqueo.
- **Configuración**: Usuarios, Sedes y Parámetros.

## Estado de Seguridad (JWT)
- Implementado el endpoint `POST /login`.
- Manejo de CORS corregido para entornos XAMPP.
- Middleware de errores configurado para devolver JSON.

## Próximos Pasos (Tras renombrar a newpos)
1. Iniciar el desarrollo del CRUD de Inventarios.
2. Implementar la persistencia de stock en bodegas.
3. Desarrollar la interfaz del POS de ventas.
