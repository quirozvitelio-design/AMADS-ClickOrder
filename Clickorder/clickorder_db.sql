CREATE DATABASE ClickOrder;
GO

USE ClickOrder;

CREATE TABLE roles(
id INT IDENTITY(1,1) PRIMARY KEY,
nombre VARCHAR(50)
);

CREATE TABLE usuarios(
id INT IDENTITY(1,1) PRIMARY KEY,
nombre VARCHAR(100),
correo VARCHAR(100),
password VARCHAR(255),
rol_id INT,
FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE productos(
id INT IDENTITY(1,1) PRIMARY KEY,
nombre VARCHAR(100),
precio DECIMAL(10,2)
);

CREATE TABLE pedidos(
id INT IDENTITY(1,1) PRIMARY KEY,
usuario_id INT,
producto_id INT,
cantidad INT,
FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
FOREIGN KEY (producto_id) REFERENCES productos(id)
);

INSERT INTO roles(nombre)
VALUES
('admin'),
('cliente');