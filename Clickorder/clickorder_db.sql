-- =============================================
-- CLICKORDER - Base de Datos Completa
-- Sprint 1 al Sprint 4
-- Grupo 5 | AMDS Ciclo I-2026
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
    nombre      VARCHAR(100)  NOT NULL,
    descripcion VARCHAR(255),
    precio      DECIMAL(10,2) NOT NULL,
    stock       INT           DEFAULT 0,
    imagen      VARCHAR(255)
);
GO

-- =============================================
-- TABLA: pedidos
-- Sprint 1: usuario_id, producto_id, cantidad
-- Sprint 2: + estado, metodo_pago, fecha
-- Sprint 3: + pedido_grupo, fecha_estado_actualizado
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
-- Sprint 4 HU-18
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

-- =============================================
-- TABLA: configuracion_empresa
-- Sprint 4 HU-18: datos emisor DTE
-- =============================================
CREATE TABLE configuracion_empresa (
    id                   INT IDENTITY(1,1) PRIMARY KEY,
    nit                  VARCHAR(20)  NOT NULL,
    nrc                  VARCHAR(20)  NOT NULL,
    nombre               VARCHAR(150) NOT NULL,
    nombre_comercial     VARCHAR(150),
    cod_actividad        VARCHAR(10),
    desc_actividad       VARCHAR(255),
    tipo_establecimiento VARCHAR(5)   DEFAULT '01',
    departamento         VARCHAR(5)   DEFAULT '12',
    municipio            VARCHAR(5)   DEFAULT '17',
    direccion            VARCHAR(255),
    telefono             VARCHAR(20),
    correo               VARCHAR(100),
    cod_estable_mh       VARCHAR(10)  DEFAULT 'M001',
    cod_punto_venta_mh   VARCHAR(10)  DEFAULT 'P001',
    actualizado_en       DATETIME     DEFAULT GETDATE()
);
GO

-- =============================================
-- DATOS INICIALES: roles
-- =============================================
INSERT INTO roles (nombre) VALUES
    ('admin'),
    ('cliente'),
    ('logistica');
GO

-- =============================================
-- DATOS INICIALES: usuario admin por defecto
-- Password: 1234 (hash bcrypt)
-- Crear desde Thunder si el backend hashea al insertar
-- =============================================
-- INSERT INTO usuarios (nombre, correo, password, rol_id)
-- VALUES ('Admin', 'admin@gmail.com', '1234', 1);
-- GO

-- =============================================
-- DATOS INICIALES: configuracion empresa
-- =============================================
INSERT INTO configuracion_empresa (
    nit, nrc, nombre, nombre_comercial,
    cod_actividad, desc_actividad,
    tipo_establecimiento, departamento, municipio,
    direccion, telefono, correo
) VALUES (
    '06141806941027',
    '123456-7',
    'ClickOrder S.A. de C.V.',
    'ClickOrder — E-commerce Local',
    '47191',
    'Comercio al por menor de productos varios',
    '01', '12', '17',
    'San Miguel, El Salvador',
    '7000-0000',
    'facturacion@clickorder.com'
);
GO

-- =============================================
-- DATOS INICIALES: productos tecnologia
-- 30 productos con marcas reales
-- =============================================
INSERT INTO productos (nombre, descripcion, precio, stock) VALUES

-- CARGADORES
('Cargador Apple 20W USB-C',
 'Cargador original Apple USB-C Power Adapter 20W para iPhone 12 en adelante',
 8.50, 40),

('Cargador Samsung 25W Super Fast',
 'Cargador Samsung EP-TA800 25W Super Fast Charging USB-C para Galaxy S21/S22',
 7.00, 40),

('Cargador Anker Nano 20W',
 'Cargador Anker Nano PIQ 3.0 20W USB-C compacto compatible iPhone y Android',
 6.50, 35),

('Cargador Baseus 65W GaN',
 'Cargador Baseus GaN2 65W 3 puertos USB-C + USB-A carga multiple dispositivos',
 12.00, 25),

('Cargador Inalámbrico Samsung 15W',
 'Cargador inalambrico Samsung EP-P2400 15W Qi Fast Charge para Galaxy y iPhone',
 9.00, 25),

-- CABLES
('Cable Apple Lightning 1m',
 'Cable Apple MFi certificado Lightning a USB-A 1 metro para iPhone/iPad',
 5.00, 60),

('Cable Samsung USB-C 1.5m',
 'Cable Samsung EP-DX310 USB-C a USB-C 3A 1.5 metros carga y datos rapidos',
 4.00, 60),

('Cable Anker USB-C 2m 60W',
 'Cable Anker Powerline III USB-C 60W 2 metros nylon trenzado resistente',
 5.50, 50),

('Cable Baseus HDMI 4K 2m',
 'Cable Baseus HDMI 2.0 4K 60Hz 2 metros para TV monitor y laptop',
 6.00, 30),

('Cable Ugreen Micro-USB 1m',
 'Cable Ugreen Micro-USB 2.4A 1 metro nylon trenzado carga rapida',
 2.50, 60),

-- AUDÍFONOS
('Audífonos Sony WH-1000XM4',
 'Audifonos Sony WH-1000XM4 cancelacion de ruido Bluetooth 5.0 30h bateria',
 45.00, 15),

('Audífonos JBL Tune 510BT',
 'Audifonos JBL Tune 510BT inalambricos Bluetooth 5.0 40h bateria plegables',
 18.00, 25),

('Audífonos Samsung Galaxy Buds2',
 'Audifonos Samsung Galaxy Buds2 TWS cancelacion ruido activa estuche carga',
 25.00, 20),

('Audífonos Xiaomi Redmi Buds 4',
 'Audifonos Xiaomi Redmi Buds 4 TWS Bluetooth 5.3 30h autonomia IPX4',
 12.00, 30),

('Audífonos JBL T110 cable 3.5mm',
 'Audifonos JBL T110 con cable jack 3.5mm microfono integrado sonido puro bass',
 5.00, 50),

-- CASES
('Case Spigen iPhone 15 Pro',
 'Funda Spigen Ultra Hybrid iPhone 15 Pro transparente bordes reforzados',
 6.00, 40),

('Case Spigen Samsung S24',
 'Funda Spigen Liquid Crystal Samsung Galaxy S24 transparente slim fit',
 6.00, 40),

('Case OtterBox iPhone 14',
 'Funda OtterBox Commuter iPhone 14 doble capa proteccion caidas 3 metros',
 9.00, 30),

('Case Ringke Samsung A55',
 'Funda Ringke Fusion Samsung Galaxy A55 transparente antiamarillamiento',
 4.50, 45),

('Case Xiaomi 13 Pro transparente',
 'Funda Xiaomi 13 Pro silicona transparente original bordes elevados camara',
 4.00, 45),

-- PROTECTORES
('Vidrio Belkin iPhone 15',
 'Protector Belkin ScreenForce TemperedGlass iPhone 15 dureza 9H antihuella',
 7.00, 50),

('Vidrio Spigen Samsung S24',
 'Protector Spigen GLAS.tR Slim Samsung Galaxy S24 9H 0.3mm ultrafino',
 6.00, 50),

('Vidrio universal 6.7 pulgadas',
 'Protector vidrio templado universal 6.7 pulgadas 9H antirayones 2.5D',
 2.00, 80),

-- ACCESORIOS Y ALMACENAMIENTO
('Hub Anker 7 en 1 USB-C',
 'Hub Anker 543 USB-C 7 en 1 HDMI 4K USB-A 3.0 SD MicroSD lector tarjetas',
 18.00, 20),

('Adaptador Baseus USB-C a HDMI',
 'Adaptador Baseus USB-C a HDMI 4K 60Hz para MacBook iPad y laptop Windows',
 8.00, 25),

('Soporte Lamicall para celular',
 'Soporte Lamicall escritorio aluminio ajustable compatible todos los celulares',
 7.00, 35),

('Soporte Mpow para auto rejilla',
 'Soporte Mpow celular auto rejilla ventilacion rotacion 360 instalacion rapida',
 5.50, 40),

('Memoria Kingston USB 3.0 64GB',
 'Memoria Kingston DataTraveler Exodia USB 3.0 64GB lectura 50MB/s tapa movil',
 8.00, 35),

('MicroSD Samsung Evo Plus 128GB',
 'Tarjeta Samsung MicroSD Evo Plus 128GB Clase 10 lectura 130MB/s incluye adaptador',
 12.00, 30),

('Mouse Logitech M170 inalámbrico',
 'Mouse Logitech M170 inalambrico 2.4GHz receptor nano 12 meses bateria',
 9.00, 25);
GO

-- =============================================
-- VERIFICACION FINAL
-- =============================================
SELECT 'roles'                AS tabla, COUNT(*) AS registros FROM roles
UNION ALL
SELECT 'usuarios',              COUNT(*) FROM usuarios
UNION ALL
SELECT 'productos',             COUNT(*) FROM productos
UNION ALL
SELECT 'pedidos',               COUNT(*) FROM pedidos
UNION ALL
SELECT 'facturas',              COUNT(*) FROM facturas
UNION ALL
SELECT 'devoluciones',          COUNT(*) FROM devoluciones
UNION ALL
SELECT 'configuracion_empresa', COUNT(*) FROM configuracion_empresa;
GO

-- Ver todos los productos insertados
SELECT id, nombre, precio, stock FROM productos ORDER BY id;
GO