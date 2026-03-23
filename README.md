# 🛒 ClickOrder - Sistema de Pedidos

Aplicación web para la gestión de usuarios, productos y pedidos.
Desarrollada con **Node.js, Express, Vue.js y SQL Server**.

---

## 🚀 Tecnologías utilizadas

### 🔧 Backend

* Node.js
* Express.js
* SQL Server (SSMS)
* bcrypt (encriptación de contraseñas)
* mssql
* cors

### 🎨 Frontend

* Vue.js
* HTML5
* CSS3
* JavaScript (Fetch API / Axios)

---

## 📁 Estructura del Proyecto

```bash
CLICKORDER/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── routes/
│   │   ├── login.js
│   │   ├── usuarios.js
│   │   ├── productos.js
│   │   ├── pedidos.js
│   │   └── roles.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
```

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/quirozvitelio-design/AMADS-ClickOrder.git
cd Clickorder
```

---

## 🔧 Configuración del Backend

### 2. Instalar dependencias

```bash
cd backend
npm install
```

---

### 3. Configurar base de datos

Ejecutar en SQL Server:

```sql
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
VALUES ('admin'), ('cliente');
```

---

### 4. Configurar conexión

Editar:

```bash
backend/config/db.js
```

```js
const config = {
  user: "sa",
  password: "1234",
  server: "localhost",
  database: "ClickOrder",
  port: 49725,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
}
```

---

### 5. Ejecutar backend

```bash
node server.js
```

Servidor en:

```
http://localhost:3000
```

---

## 🎨 Configuración del Frontend (Vue)

### 6. Instalar dependencias

```bash
cd frontend
npm install
```

---

### 7. Ejecutar frontend

```bash
npm run dev
```

Aplicación en:

```
http://localhost:5173
```

---

## 🔗 Conexión Frontend ↔ Backend

Ejemplo de consumo de API desde Vue:

```javascript
fetch("http://localhost:3000/api/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    correo: "admin@mail.com",
    password: "1234"
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

---

## 🔐 Seguridad

* Contraseñas encriptadas con bcrypt
* Validación segura en login
* No se almacenan contraseñas en texto plano

---

## 📡 Endpoints principales

### 🔑 Login

POST `/api/login`

### 👤 Usuarios

* GET `/api/usuarios`
* POST `/api/usuarios`
* PUT `/api/usuarios/:id`
* DELETE `/api/usuarios/:id`

### 📦 Productos

* GET `/api/productos`
* POST `/api/productos`
* PUT `/api/productos/:id`
* DELETE `/api/productos/:id`

### 🧾 Pedidos

* GET `/api/pedidos`
* POST `/api/pedidos`
* PUT `/api/pedidos/:id`
* DELETE `/api/pedidos/:id`

### 🛡️ Roles

* GET `/api/roles`
* POST `/api/roles`
* PUT `/api/roles/:id`
* DELETE `/api/roles/:id`

---

## 🧪 Pruebas

Se recomienda usar:

* Postman
* Thunder Client

Ejemplo:

```json
{
  "nombre": "Admin",
  "correo": "admin@mail.com",
  "password": "1234",
  "rol_id": 1
}
```

---

## ⚠️ Notas importantes

* No insertar contraseñas manualmente en la base de datos
* Crear usuarios desde la API
* Backend y frontend deben estar corriendo simultáneamente

---

## 🔮 Mejoras futuras

* Autenticación con JWT
* Protección de rutas
* Panel de administración
* Deploy en la nube

---

## 👨‍💻 Autor

* Vitelio Smith Coreas Quiroz
* Jorge Alexander Ventura Vázquez

---

## 📄 Licencia

Proyecto de uso educativo.