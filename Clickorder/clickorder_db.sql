-- =============================================
-- CLICKORDER - Base de Datos Completa
-- SQL Server Management Studio
-- =============================================

CREATE DATABASE ClickOrder;
GO

USE ClickOrder;
GO

-- =============================================
-- TABLA: roles
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
    id       INT IDENTITY(1,1) PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL,
    correo   VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol_id   INT NOT NULL,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);
GO

-- =============================================
-- TABLA: productos
-- Sprint 1: nombre, precio
-- Sprint 2: + descripcion, stock, imagen
-- =============================================
CREATE TABLE productos (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(100)   NOT NULL,
    descripcion VARCHAR(255),
    precio      DECIMAL(10,2)  NOT NULL,
    stock       INT            DEFAULT 0,
    imagen      VARCHAR(255)
);
GO

-- =============================================
-- TABLA: pedidos
-- Sprint 1: usuario_id, producto_id, cantidad
-- Sprint 2: + estado, metodo_pago, fecha
-- =============================================
CREATE TABLE pedidos (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id  INT           NOT NULL,
    producto_id INT           NOT NULL,
    cantidad    INT           NOT NULL,
    estado      VARCHAR(50)   DEFAULT 'Pendiente',
    metodo_pago VARCHAR(50),
    pedido_grupo VARCHAR(50),
    fecha       DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
GO

-- =============================================
-- DATOS INICIALES
-- =============================================
INSERT INTO roles (nombre) VALUES
    ('admin'),
    ('cliente');
GO

INSERT INTO productos (nombre, descripcion, precio, stock) VALUES
    ('Coca Cola',  'Bebida gaseosa 500ml',  0.80, 50),
    ('Pepsi',      'Bebida gaseosa 500ml',  0.75, 50),
    ('Agua pura',  'Agua purificada 1L',    0.50, 100);
GO