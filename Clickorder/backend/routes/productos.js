const express = require("express")
const router  = express.Router()
const { sql } = require("../config/db")

// GET todos los productos
router.get("/", async (req, res) => {
    try {
        const pool   = await sql.connect()
        const result = await pool.request()
            // 🌟 Mapeamos tu columna [imagen] como 'imagen_url' para que coincida exactamente con Vue
            .query("SELECT id, nombre, descripcion, precio, stock, imagen AS imagen_url, categoria FROM productos ORDER BY id ASC")
        res.json(result.recordset)
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener productos", error: error.message })
    }
})

// GET producto por id
router.get("/:id", async (req, res) => {
    try {
        const pool   = await sql.connect()
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            // 🌟 Mismo mapeo con alias para mantener consistencia
            .query("SELECT id, nombre, descripcion, precio, stock, imagen AS imagen_url, categoria FROM productos WHERE id = @id")
        if (result.recordset.length === 0)
            return res.status(404).json({ mensaje: "Producto no encontrado" })
        res.json(result.recordset[0])
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener producto", error: error.message })
    }
})

// POST — Crear producto
router.post("/", async (req, res) => {
    // 🌟 Extraemos 'imagen_url' directamente desde el body enviado por Vue
    const { nombre, descripcion, stock, imagen_url, categoria } = req.body
    const precio   = parseFloat(req.body.precio)
    const stockNum = parseInt(stock) || 0

    if (!nombre || isNaN(precio))
        return res.status(400).json({ mensaje: "Nombre y precio son obligatorios" })

    try {
        const pool = await sql.connect()
        await pool.request()
            .input("nombre",      sql.VarChar(100),   nombre)
            .input("descripcion", sql.VarChar(255),   descripcion || "")
            .input("precio",      sql.Decimal(10, 2), precio)
            .input("stock",       sql.Int,            stockNum)
            .input("imagen",      sql.VarChar(255),   imagen_url || null) // 🌟 Inserta en tu columna [imagen]
            .input("categoria",   sql.VarChar(100),   categoria || "")
            .query(`INSERT INTO productos (nombre, descripcion, precio, stock, imagen, categoria)
                    VALUES (@nombre, @descripcion, @precio, @stock, @imagen, @categoria)`)
        res.status(201).json({ mensaje: "Producto creado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear producto", error: error.message })
    }
})

// PUT — Actualizar producto
router.put("/:id", async (req, res) => {
    // 🌟 Extraemos 'imagen_url' aquí también para que se actualice correctamente en la base de datos
    const { nombre, descripcion, stock, imagen_url, categoria } = req.body
    const precio   = parseFloat(req.body.precio)
    const stockNum = parseInt(stock) || 0

    if (!nombre || isNaN(precio))
        return res.status(400).json({ mensaje: "Nombre y precio son obligatorios" })

    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id",          sql.Int,            parseInt(req.params.id))
            .input("nombre",      sql.VarChar(100),   nombre)
            .input("descripcion", sql.VarChar(255),   descripcion || "")
            .input("precio",      sql.Decimal(10, 2), precio)
            .input("stock",       sql.Int,            stockNum)
            .input("imagen",      sql.VarChar(255),   imagen_url || null) // 🌟 Modifica tu columna [imagen]
            .input("categoria",   sql.VarChar(100),   categoria || "")
            .query(`UPDATE productos
                    SET nombre      = @nombre,
                        descripcion = @descripcion,
                        precio      = @precio,
                        stock       = @stock,
                        imagen      = @imagen,
                        categoria   = @categoria
                    WHERE id = @id`)
        res.json({ mensaje: "Producto actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar producto", error: error.message })
    }
})

// DELETE — Eliminar producto
router.delete("/:id", async (req, res) => {
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM productos WHERE id = @id")
        res.json({ mensaje: "Producto eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar producto", error: error.message })
    }
})

module.exports = router