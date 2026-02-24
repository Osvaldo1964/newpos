-- Script Inicial Base de Datos: Sistema POS Moderno
-- Motor: MySQL (InnoDB)

CREATE DATABASE IF NOT EXISTS pos_system;
USE pos_system;

-- 1. Sedes
CREATE TABLE sedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Usuarios y Roles
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Tablas de Permisos Granulares
CREATE TABLE modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE -- ej: 'inventarios', 'ventas'
) ENGINE=InnoDB;

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE -- ej: 'create', 'read', 'update', 'delete'
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
    role_id INT,
    module_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, module_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (module_id) REFERENCES modules(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT,
    sede_id INT,
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB;

-- 3. Clientes (E-commerce & Local)
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    google_id VARCHAR(255),
    password VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Catálogo
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(12, 2) NOT NULL,
    iva DECIMAL(5, 2) DEFAULT 0.00,
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- 5. Bodegas e Inventario
CREATE TABLE warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sede_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB;

CREATE TABLE inventory (
    product_id INT,
    warehouse_id INT,
    stock_actual DECIMAL(12, 2) DEFAULT 0.00,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, warehouse_id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB;

CREATE TABLE inventory_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('COMPRA', 'TRASLADO', 'VENTA', 'AJUSTE') NOT NULL,
    product_id INT,
    from_warehouse_id INT,
    to_warehouse_id INT,
    cantidad DECIMAL(12, 2) NOT NULL,
    user_id INT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 6. Caja
CREATE TABLE cash_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    sede_id INT,
    monto_apertura DECIMAL(12, 2) NOT NULL,
    monto_cierre DECIMAL(12, 2),
    estado ENUM('ABIERTA', 'CERRADA') DEFAULT 'ABIERTA',
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB;

CREATE TABLE cash_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    tipo ENUM('INGRESO', 'GASTO', 'PAGO') NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES cash_sessions(id)
) ENGINE=InnoDB;

-- 7. Ventas y Promociones
CREATE TABLE promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('PORCENTAJE', 'FIJO') NOT NULL,
    valor DECIMAL(12, 2) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    status TINYINT DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, -- Cajero (NULL si fue online)
    customer_id INT,
    sede_id INT,
    tipo ENUM('POS', 'ONLINE') NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    iva_total DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    estado ENUM('PAGADA', 'PENDIENTE', 'ANULADA') DEFAULT 'PAGADA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB;

CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    product_id INT,
    cantidad DECIMAL(12, 2) NOT NULL,
    precio_unitario DECIMAL(12, 2) NOT NULL,
    promocion_id INT,
    descuento DECIMAL(12, 2) DEFAULT 0.00,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (promocion_id) REFERENCES promotions(id)
) ENGINE=InnoDB;

-- Inserción de Roles Base
INSERT INTO roles (nombre) VALUES ('Administrador'), ('Supervisor'), ('Cajero');

-- Inserción de Módulos Base
INSERT INTO modules (nombre, slug) VALUES 
('Inventarios', 'inventory'),
('Ventas POS', 'sales_pos'),
('Caja', 'cash'),
('E-commerce', 'ecommerce'),
('Reportes', 'reports'),
('Configuración', 'config');

-- Inserción de Permisos CRUD
INSERT INTO permissions (nombre) VALUES ('create'), ('read'), ('update'), ('delete');

-- Permisos iniciales para Administrador (Todo a todo)
INSERT INTO role_permissions (role_id, module_id, permission_id)
SELECT 1, m.id, p.id 
FROM modules m, permissions p;

-- Inserción de Sede y Bodega Inicial
INSERT INTO sedes (nombre, direccion, telefono) VALUES ('Sede Principal', 'Calle Falsa 123', '555-0101');
INSERT INTO warehouses (nombre, sede_id) VALUES ('Bodega Central', 1);

-- Inserción de Usuario Administrador (Password: admin123)
INSERT INTO users (nombre, email, password, role_id, sede_id) 
VALUES ('Admin', 'admin@pos.com', '$2y$10$0qx6vgIkBVtTm5euTC.83./T2dTRDkS8m.yyBHL/7TUj97JaQwf0i', 1, 1);
