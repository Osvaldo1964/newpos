-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-02-2026 a las 19:39:06
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pos_system`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cash_concepts`
--

CREATE TABLE `cash_concepts` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('INGRESO','GASTO') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cash_concepts`
--

INSERT INTO `cash_concepts` (`id`, `nombre`, `tipo`, `created_at`) VALUES
(1, 'Pago de Factura', 'INGRESO', '2026-02-27 12:33:57'),
(2, 'Préstamo Recibido', 'INGRESO', '2026-02-27 12:33:57'),
(3, 'Otros Ingresos', 'INGRESO', '2026-02-27 12:33:57'),
(4, 'Servicios Públicos', 'GASTO', '2026-02-27 12:33:57'),
(5, 'Transporte / Taxi', 'GASTO', '2026-02-27 12:33:57'),
(6, 'Papelería', 'GASTO', '2026-02-27 12:33:57'),
(7, 'Cafetería / Alimentación', 'GASTO', '2026-02-27 12:33:57'),
(8, 'Mantenimiento', 'GASTO', '2026-02-27 12:33:57'),
(9, 'Otros Gastos', 'GASTO', '2026-02-27 12:33:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cash_movements`
--

CREATE TABLE `cash_movements` (
  `id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `concept_id` int(11) DEFAULT NULL,
  `tipo` enum('INGRESO','GASTO','PAGO') NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `metodo_pago` varchar(50) DEFAULT 'EFECTIVO',
  `descripcion` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cash_movements`
--

INSERT INTO `cash_movements` (`id`, `session_id`, `concept_id`, `tipo`, `monto`, `metodo_pago`, `descripcion`, `created_at`) VALUES
(1, 1, 6, 'GASTO', 1000.00, 'EFECTIVO', 'COMPRA DE HOJAS', '2026-02-27 13:41:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cash_registers`
--

CREATE TABLE `cash_registers` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `sede_id` int(11) DEFAULT NULL,
  `estado` enum('ACTIVA','INACTIVA') DEFAULT 'ACTIVA',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cash_registers`
--

INSERT INTO `cash_registers` (`id`, `nombre`, `sede_id`, `estado`, `created_at`) VALUES
(1, 'Caja Principal', 1, 'ACTIVA', '2026-02-26 18:27:46'),
(2, 'Caja Norte 01', 2, 'ACTIVA', '2026-02-26 18:27:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cash_sessions`
--

CREATE TABLE `cash_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `sede_id` int(11) DEFAULT NULL,
  `register_id` int(11) DEFAULT NULL,
  `monto_apertura` decimal(12,2) NOT NULL,
  `monto_cierre` decimal(12,2) DEFAULT NULL,
  `estado` enum('ABIERTA','CERRADA') DEFAULT 'ABIERTA',
  `fecha_apertura` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_cierre` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cash_sessions`
--

INSERT INTO `cash_sessions` (`id`, `user_id`, `sede_id`, `register_id`, `monto_apertura`, `monto_cierre`, `estado`, `fecha_apertura`, `fecha_cierre`) VALUES
(1, 2, 1, 1, 5000.00, NULL, 'ABIERTA', '2026-02-27 13:15:43', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categories`
--

INSERT INTO `categories` (`id`, `nombre`, `created_at`) VALUES
(1, 'PINTURAS TIPO A', '2026-02-26 16:53:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras_entradas`
--

CREATE TABLE `compras_entradas` (
  `id` int(11) NOT NULL,
  `orden_id` int(11) DEFAULT NULL,
  `tercero_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `num_remision` varchar(50) DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `observaciones` text DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `compras_entradas`
--

INSERT INTO `compras_entradas` (`id`, `orden_id`, `tercero_id`, `warehouse_id`, `num_remision`, `fecha`, `observaciones`, `user_id`, `created_at`) VALUES
(2, 1, 1, 1, '66545', '2026-02-27 10:35:08', '', 2, '2026-02-27 15:35:08');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras_entradas_detalles`
--

CREATE TABLE `compras_entradas_detalles` (
  `id` int(11) NOT NULL,
  `entrada_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `cantidad` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `compras_entradas_detalles`
--

INSERT INTO `compras_entradas_detalles` (`id`, `entrada_id`, `product_id`, `cantidad`) VALUES
(2, 2, 1, 100.00),
(3, 2, 2, 40.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras_ordenes`
--

CREATE TABLE `compras_ordenes` (
  `id` int(11) NOT NULL,
  `tercero_id` int(11) NOT NULL,
  `sede_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `total` decimal(12,2) DEFAULT 0.00,
  `estado` enum('PENDIENTE','PARCIAL','COMPLETADA','ANULADA') DEFAULT 'PENDIENTE',
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `compras_ordenes`
--

INSERT INTO `compras_ordenes` (`id`, `tercero_id`, `sede_id`, `user_id`, `fecha`, `total`, `estado`, `observaciones`, `created_at`) VALUES
(1, 1, 1, 2, '2026-02-27 10:06:18', 355500.00, 'PARCIAL', 'COMPRAS VARIAS', '2026-02-27 15:06:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras_ordenes_detalles`
--

CREATE TABLE `compras_ordenes_detalles` (
  `id` int(11) NOT NULL,
  `orden_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `cantidad_pedida` decimal(12,2) NOT NULL,
  `cantidad_recibida` decimal(12,2) DEFAULT 0.00,
  `precio_unitario` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `compras_ordenes_detalles`
--

INSERT INTO `compras_ordenes_detalles` (`id`, `orden_id`, `product_id`, `cantidad_pedida`, `cantidad_recibida`, `precio_unitario`) VALUES
(3, 1, 1, 150.00, 100.00, 1650.00),
(4, 1, 2, 80.00, 40.00, 1350.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventory`
--

CREATE TABLE `inventory` (
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `stock_actual` decimal(12,2) DEFAULT 0.00,
  `last_update` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventory`
--

INSERT INTO `inventory` (`product_id`, `warehouse_id`, `stock_actual`, `last_update`) VALUES
(1, 1, 89.00, '2026-02-27 18:36:47'),
(1, 2, 10.00, '2026-02-27 16:31:26'),
(2, 1, 39.00, '2026-02-27 18:36:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `id` int(11) NOT NULL,
  `tipo` enum('COMPRA','TRASLADO','VENTA','AJUSTE') NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `from_warehouse_id` int(11) DEFAULT NULL,
  `to_warehouse_id` int(11) DEFAULT NULL,
  `cantidad` decimal(12,2) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventory_movements`
--

INSERT INTO `inventory_movements` (`id`, `tipo`, `product_id`, `from_warehouse_id`, `to_warehouse_id`, `cantidad`, `user_id`, `observaciones`, `created_at`) VALUES
(1, 'COMPRA', 1, NULL, 1, 50.00, 2, 'Entrada por compra #1 - Remisión: 6541', '2026-02-27 15:14:41'),
(2, 'AJUSTE', 1, 1, NULL, 50.00, 2, 'Reversión de entrada #1', '2026-02-27 15:31:20'),
(3, 'COMPRA', 1, NULL, 1, 100.00, 2, 'Entrada por compra #2 - Remisión: 66545', '2026-02-27 15:35:08'),
(4, 'COMPRA', 2, NULL, 1, 40.00, 2, 'Entrada por compra #2 - Remisión: 66545', '2026-02-27 15:35:08'),
(5, 'TRASLADO', 1, 1, 2, 10.00, 2, 'Traslado #1 - TRASLADO DE MERCANCIA A PUNTO DE VENTA', '2026-02-27 16:31:26'),
(6, 'VENTA', 1, 1, NULL, 1.00, 2, 'Venta POS #1', '2026-02-27 18:36:47'),
(7, 'VENTA', 2, 1, NULL, 1.00, 2, 'Venta POS #1', '2026-02-27 18:36:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modules`
--

CREATE TABLE `modules` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `modules`
--

INSERT INTO `modules` (`id`, `nombre`, `slug`) VALUES
(1, 'Inventarios', 'inventory'),
(2, 'Ventas POS', 'sales_pos'),
(3, 'Caja', 'cash'),
(4, 'E-commerce', 'ecommerce'),
(5, 'Reportes', 'reports'),
(6, 'Configuración', 'config');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `nombre` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `permissions`
--

INSERT INTO `permissions` (`id`, `nombre`) VALUES
(1, 'create'),
(4, 'delete'),
(2, 'read'),
(3, 'update');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio_base` decimal(12,2) NOT NULL,
  `iva` decimal(5,2) DEFAULT 0.00,
  `category_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `products`
--

INSERT INTO `products` (`id`, `sku`, `nombre`, `descripcion`, `precio_base`, `iva`, `category_id`, `created_at`) VALUES
(1, 'PRO-001', 'PRUEBA', 'PRUEBA', 1500.00, 19.00, 1, '2026-02-26 17:00:29'),
(2, 'PINT-002', 'PINTURA TIPO B', '', 1450.00, 19.00, 1, '2026-02-27 15:34:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `is_main` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `url`, `is_main`) VALUES
(1, 1, 'uploads/products/1_1772125229_0.jpeg', 1),
(2, 1, 'uploads/products/1_1772125229_1.jpeg', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `promotions`
--

CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('PORCENTAJE','FIJO') NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `status` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`) VALUES
(1, 'Administrador'),
(3, 'Cajero'),
(2, 'Supervisor');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `module_id`, `permission_id`) VALUES
(1, 1, 1),
(1, 1, 2),
(1, 1, 3),
(1, 1, 4),
(1, 2, 1),
(1, 2, 2),
(1, 2, 3),
(1, 2, 4),
(1, 3, 1),
(1, 3, 2),
(1, 3, 3),
(1, 3, 4),
(1, 4, 1),
(1, 4, 2),
(1, 4, 3),
(1, 4, 4),
(1, 5, 1),
(1, 5, 2),
(1, 5, 3),
(1, 5, 4),
(1, 6, 1),
(1, 6, 2),
(1, 6, 3),
(1, 6, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `tercero_id` int(11) DEFAULT NULL,
  `sede_id` int(11) DEFAULT NULL,
  `tipo` enum('POS','ONLINE') NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `iva_total` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `estado` enum('PAGADA','PENDIENTE','ANULADA') DEFAULT 'PAGADA',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sales`
--

INSERT INTO `sales` (`id`, `user_id`, `tercero_id`, `sede_id`, `tipo`, `subtotal`, `iva_total`, `total`, `estado`, `created_at`) VALUES
(1, 2, 1, NULL, 'POS', 2950.00, 560.50, 3510.50, 'PAGADA', '2026-02-27 18:36:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sale_items`
--

CREATE TABLE `sale_items` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `cantidad` decimal(12,2) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `promocion_id` int(11) DEFAULT NULL,
  `descuento` decimal(12,2) DEFAULT 0.00,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `cantidad`, `precio_unitario`, `promocion_id`, `descuento`, `subtotal`) VALUES
(1, 1, 1, 1.00, 1500.00, NULL, 0.00, 1500.00),
(2, 1, 2, 1.00, 1450.00, NULL, 0.00, 1450.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sale_payments`
--

CREATE TABLE `sale_payments` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `metodo` varchar(50) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sale_payments`
--

INSERT INTO `sale_payments` (`id`, `sale_id`, `metodo`, `monto`, `referencia`, `created_at`) VALUES
(1, 1, 'EFECTIVO', 4000.00, '', '2026-02-27 18:36:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sedes`
--

CREATE TABLE `sedes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sedes`
--

INSERT INTO `sedes` (`id`, `nombre`, `direccion`, `telefono`, `created_at`) VALUES
(1, 'Sede Principal', 'Calle Falsa 123', '555-0101', '2026-02-24 19:00:00'),
(2, 'Sede Norte', 'Calle 2', '3023898254', '2026-02-26 17:40:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stock_transfers`
--

CREATE TABLE `stock_transfers` (
  `id` int(11) NOT NULL,
  `from_warehouse_id` int(11) NOT NULL,
  `to_warehouse_id` int(11) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `observaciones` text DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('COMPLETADO','ANULADO') DEFAULT 'COMPLETADO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `stock_transfers`
--

INSERT INTO `stock_transfers` (`id`, `from_warehouse_id`, `to_warehouse_id`, `fecha`, `observaciones`, `user_id`, `status`) VALUES
(1, 1, 2, '2026-02-27 11:31:26', 'TRASLADO DE MERCANCIA A PUNTO DE VENTA', 2, 'COMPLETADO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stock_transfer_items`
--

CREATE TABLE `stock_transfer_items` (
  `id` int(11) NOT NULL,
  `transfer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `stock_transfer_items`
--

INSERT INTO `stock_transfer_items` (`id`, `transfer_id`, `product_id`, `cantidad`) VALUES
(1, 1, 1, 10.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `terceros`
--

CREATE TABLE `terceros` (
  `id` int(11) NOT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `tipo_documento` enum('NIT','CC','CE','PP') DEFAULT 'CC',
  `tipo_persona` enum('Natural','JurÝdica') DEFAULT 'Natural',
  `nombre` varchar(100) NOT NULL,
  `razon_social` varchar(150) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `es_cliente` tinyint(1) DEFAULT 1,
  `es_proveedor` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `terceros`
--

INSERT INTO `terceros` (`id`, `documento`, `tipo_documento`, `tipo_persona`, `nombre`, `razon_social`, `email`, `google_id`, `password`, `direccion`, `telefono`, `es_cliente`, `es_proveedor`, `created_at`) VALUES
(1, '5566', 'NIT', '', 'JUAN PEREZ', 'EMPRESA DE PRUEBA', 'osvicor1964@gmail.com', NULL, NULL, 'URB SAN LORENZO MZ J CS 34', '3023898254', 1, 1, '2026-02-27 14:20:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `sede_id` int(11) DEFAULT NULL,
  `status` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `nombre`, `email`, `password`, `role_id`, `sede_id`, `status`, `created_at`) VALUES
(1, 'Admin', 'admin@pos.com', '$2y$10$0qx6vgIkBVtTm5euTC.83./T2dTRDkS8m.yyBHL/7TUj97JaQwf0i', 1, 1, 1, '2026-02-24 19:00:00'),
(2, 'Pedro Perez', 'pedro@google.com', '$2y$10$31JEkaKrVGW.oOSj40dpSOzzG3KhHxuNTkXrvTDdAUN/sUDrqN0/W', 3, 2, 1, '2026-02-26 19:09:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `warehouses`
--

CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `sede_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `warehouses`
--

INSERT INTO `warehouses` (`id`, `nombre`, `sede_id`, `created_at`) VALUES
(1, 'BODEGA CENTRAL', 1, '2026-02-24 19:00:00'),
(2, 'BODEGA 02', 2, '2026-02-27 16:18:36');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cash_concepts`
--
ALTER TABLE `cash_concepts`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `cash_movements`
--
ALTER TABLE `cash_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `concept_id` (`concept_id`);

--
-- Indices de la tabla `cash_registers`
--
ALTER TABLE `cash_registers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sede_id` (`sede_id`);

--
-- Indices de la tabla `cash_sessions`
--
ALTER TABLE `cash_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `sede_id` (`sede_id`),
  ADD KEY `register_id` (`register_id`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `compras_entradas`
--
ALTER TABLE `compras_entradas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orden_id` (`orden_id`),
  ADD KEY `tercero_id` (`tercero_id`),
  ADD KEY `warehouse_id` (`warehouse_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `compras_entradas_detalles`
--
ALTER TABLE `compras_entradas_detalles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `entrada_id` (`entrada_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indices de la tabla `compras_ordenes`
--
ALTER TABLE `compras_ordenes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tercero_id` (`tercero_id`),
  ADD KEY `sede_id` (`sede_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `compras_ordenes_detalles`
--
ALTER TABLE `compras_ordenes_detalles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orden_id` (`orden_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indices de la tabla `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`product_id`,`warehouse_id`),
  ADD KEY `warehouse_id` (`warehouse_id`);

--
-- Indices de la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `from_warehouse_id` (`from_warehouse_id`),
  ADD KEY `to_warehouse_id` (`to_warehouse_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indices de la tabla `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `category_id` (`category_id`);

--
-- Indices de la tabla `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indices de la tabla `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`module_id`,`permission_id`),
  ADD KEY `module_id` (`module_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indices de la tabla `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `customer_id` (`tercero_id`),
  ADD KEY `sede_id` (`sede_id`);

--
-- Indices de la tabla `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `promocion_id` (`promocion_id`);

--
-- Indices de la tabla `sale_payments`
--
ALTER TABLE `sale_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_id` (`sale_id`);

--
-- Indices de la tabla `sedes`
--
ALTER TABLE `sedes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `stock_transfers`
--
ALTER TABLE `stock_transfers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `from_warehouse_id` (`from_warehouse_id`),
  ADD KEY `to_warehouse_id` (`to_warehouse_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transfer_id` (`transfer_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indices de la tabla `terceros`
--
ALTER TABLE `terceros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `documento` (`documento`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `sede_id` (`sede_id`);

--
-- Indices de la tabla `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sede_id` (`sede_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cash_concepts`
--
ALTER TABLE `cash_concepts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `cash_movements`
--
ALTER TABLE `cash_movements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `cash_registers`
--
ALTER TABLE `cash_registers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `cash_sessions`
--
ALTER TABLE `cash_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `compras_entradas`
--
ALTER TABLE `compras_entradas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `compras_entradas_detalles`
--
ALTER TABLE `compras_entradas_detalles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `compras_ordenes`
--
ALTER TABLE `compras_ordenes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `compras_ordenes_detalles`
--
ALTER TABLE `compras_ordenes_detalles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `sale_payments`
--
ALTER TABLE `sale_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `sedes`
--
ALTER TABLE `sedes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `stock_transfers`
--
ALTER TABLE `stock_transfers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `terceros`
--
ALTER TABLE `terceros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `warehouses`
--
ALTER TABLE `warehouses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cash_movements`
--
ALTER TABLE `cash_movements`
  ADD CONSTRAINT `cash_movements_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `cash_sessions` (`id`),
  ADD CONSTRAINT `cash_movements_ibfk_2` FOREIGN KEY (`concept_id`) REFERENCES `cash_concepts` (`id`);

--
-- Filtros para la tabla `cash_registers`
--
ALTER TABLE `cash_registers`
  ADD CONSTRAINT `cash_registers_ibfk_1` FOREIGN KEY (`sede_id`) REFERENCES `sedes` (`id`);

--
-- Filtros para la tabla `cash_sessions`
--
ALTER TABLE `cash_sessions`
  ADD CONSTRAINT `cash_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `cash_sessions_ibfk_2` FOREIGN KEY (`sede_id`) REFERENCES `sedes` (`id`),
  ADD CONSTRAINT `cash_sessions_ibfk_3` FOREIGN KEY (`register_id`) REFERENCES `cash_registers` (`id`);

--
-- Filtros para la tabla `compras_entradas`
--
ALTER TABLE `compras_entradas`
  ADD CONSTRAINT `compras_entradas_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `compras_ordenes` (`id`),
  ADD CONSTRAINT `compras_entradas_ibfk_2` FOREIGN KEY (`tercero_id`) REFERENCES `terceros` (`id`),
  ADD CONSTRAINT `compras_entradas_ibfk_3` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `compras_entradas_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `compras_entradas_detalles`
--
ALTER TABLE `compras_entradas_detalles`
  ADD CONSTRAINT `compras_entradas_detalles_ibfk_1` FOREIGN KEY (`entrada_id`) REFERENCES `compras_entradas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `compras_entradas_detalles_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Filtros para la tabla `compras_ordenes`
--
ALTER TABLE `compras_ordenes`
  ADD CONSTRAINT `compras_ordenes_ibfk_1` FOREIGN KEY (`tercero_id`) REFERENCES `terceros` (`id`),
  ADD CONSTRAINT `compras_ordenes_ibfk_2` FOREIGN KEY (`sede_id`) REFERENCES `sedes` (`id`),
  ADD CONSTRAINT `compras_ordenes_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `compras_ordenes_detalles`
--
ALTER TABLE `compras_ordenes_detalles`
  ADD CONSTRAINT `compras_ordenes_detalles_ibfk_1` FOREIGN KEY (`orden_id`) REFERENCES `compras_ordenes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `compras_ordenes_detalles_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Filtros para la tabla `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Filtros para la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `inventory_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `inventory_movements_ibfk_2` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `inventory_movements_ibfk_3` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `inventory_movements_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Filtros para la tabla `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`),
  ADD CONSTRAINT `role_permissions_ibfk_3` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`);

--
-- Filtros para la tabla `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`tercero_id`) REFERENCES `terceros` (`id`),
  ADD CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`sede_id`) REFERENCES `sedes` (`id`);

--
-- Filtros para la tabla `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`),
  ADD CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `sale_items_ibfk_3` FOREIGN KEY (`promocion_id`) REFERENCES `promotions` (`id`);

--
-- Filtros para la tabla `sale_payments`
--
ALTER TABLE `sale_payments`
  ADD CONSTRAINT `sale_payments_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `stock_transfers`
--
ALTER TABLE `stock_transfers`
  ADD CONSTRAINT `stock_transfers_ibfk_1` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `stock_transfers_ibfk_2` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `stock_transfers_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  ADD CONSTRAINT `stock_transfer_items_ibfk_1` FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_transfer_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`sede_id`) REFERENCES `sedes` (`id`);

--
-- Filtros para la tabla `warehouses`
--
ALTER TABLE `warehouses`
  ADD CONSTRAINT `warehouses_ibfk_1` FOREIGN KEY (`sede_id`) REFERENCES `sedes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
