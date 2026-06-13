-- =============================================
-- CLICKORDER - Base de Datos Completa
-- Sprint 1 al Sprint 4
-- SQL Server Management Studio
-- =============================================

CREATE DATABASE ClickOrder;
GO

USE ClickOrder;
GO

-- =============================================
-- TABLA: roles
-- Sprint 1: admin, cliente
-- Sprint 2: + logistica
-- =============================================
CREATE TABLE roles (
    id     INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);
GO

-- =============================================
-- TABLA: usuarios
-- =============================================
CREATE TABLE usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,

    validado BIT DEFAULT 0,
    email_validado BIT DEFAULT 0,
    token_validacion VARCHAR(255),
    token_expiracion DATETIME,

    FOREIGN KEY (rol_id) REFERENCES roles(id)
);
GO

-- =============================================
-- TABLA: productos
-- Sprint 1: nombre, precio
-- Sprint 2: + descripcion, stock, imagen
-- =============================================
CREATE TABLE productos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    imagen VARCHAR(255),
    categoria VARCHAR(50) NOT NULL DEFAULT 'Otros'
);
GO

-- =============================================
-- TABLA: pedidos
-- Sprint 1: usuario_id, producto_id, cantidad
-- Sprint 2: + estado, metodo_pago, fecha
-- Sprint 3: + pedido_grupo, fecha_estado_actualizado
-- Sprint 4: estado incluye 'Devuelto'
-- =============================================
CREATE TABLE pedidos (
    id                       INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id               INT          NOT NULL,
    producto_id              INT          NOT NULL,
    cantidad                 INT          NOT NULL,
    estado                   VARCHAR(50)  DEFAULT 'Recibido',
    metodo_pago              VARCHAR(50),
    pedido_grupo             VARCHAR(100),
    fecha                    DATETIME     DEFAULT GETDATE(),
    fecha_estado_actualizado DATETIME     DEFAULT GETDATE(),
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
GO

-- =============================================
-- TABLA: facturas
-- Sprint 4 HU-18: facturas electronicas
-- =============================================
CREATE TABLE facturas (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    pedido_grupo     VARCHAR(100)  NOT NULL UNIQUE,
    numero_factura   VARCHAR(20)   NOT NULL UNIQUE,
    fecha_emision    DATETIME      DEFAULT GETDATE(),
    usuario_id       INT           NOT NULL,
    total            DECIMAL(10,2) NOT NULL,
    datos_json       NVARCHAR(MAX),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
GO

CREATE TABLE configuracion_empresa (
    id INT IDENTITY(1,1) PRIMARY KEY,

    nit VARCHAR(20) NOT NULL,
    nrc VARCHAR(20) NOT NULL,

    nombre VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),

    cod_actividad VARCHAR(20),
    desc_actividad VARCHAR(255),

    tipo_establecimiento VARCHAR(10) DEFAULT '01',

    departamento VARCHAR(10) DEFAULT '12',
    municipio VARCHAR(10) DEFAULT '17',

    direccion VARCHAR(255),

    telefono VARCHAR(20),
    correo VARCHAR(150),

    cod_estable_mh VARCHAR(20) DEFAULT 'M001',
    cod_punto_venta_mh VARCHAR(20) DEFAULT 'P001',

    creado_en DATETIME DEFAULT GETDATE(),
    actualizado_en DATETIME DEFAULT GETDATE()
);
GO

-- =============================================
-- TABLA: devoluciones
-- Sprint 4 HU-21: devoluciones con restock
-- =============================================
CREATE TABLE devoluciones (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    pedido_grupo    VARCHAR(100) NOT NULL,
    motivo          VARCHAR(255),
    procesado_por   INT          NOT NULL,
    fecha           DATETIME     DEFAULT GETDATE(),
    FOREIGN KEY (procesado_por) REFERENCES usuarios(id)
);
GO

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Roles: admin, cliente, logistica
INSERT INTO roles (nombre) VALUES
    ('admin'),
    ('cliente'),
    ('logistica');
GO

-- Usuario admin por defecto
INSERT INTO usuarios (nombre, correo, password, rol_id) VALUES
    ('Admin', 'admin@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);
-- Nota: el hash corresponde a la password "1234"
-- Si usas bcrypt en el backend, crea el usuario desde Thunder Client POST /api/usuarios
GO

-- Productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, stock) VALUES
    ('Coca Cola',  'Bebida gaseosa 500ml',  0.80, 50),
    ('Pepsi',      'Bebida gaseosa 500ml',  0.75, 50),
    ('Agua pura',  'Agua purificada 1L',    0.50, 100);
GO

-- =============================================
-- VERIFICACION FINAL
-- =============================================
SELECT 'roles'       AS tabla, COUNT(*) AS registros FROM roles
UNION ALL
SELECT 'usuarios',     COUNT(*) FROM usuarios
UNION ALL
SELECT 'productos',    COUNT(*) FROM productos
UNION ALL
SELECT 'pedidos',      COUNT(*) FROM pedidos
UNION ALL
SELECT 'facturas',     COUNT(*) FROM facturas
UNION ALL
SELECT 'devoluciones', COUNT(*) FROM devoluciones;
GO