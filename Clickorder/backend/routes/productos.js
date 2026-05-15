const express = require("express")
const router = express.Router()
const { sql } = require("../config/db")

router.get("/", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request().query("SELECT * FROM productos")
        res.json(result.recordset)
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener productos", error: error.message })
    }
})

router.get("/:id", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("SELECT * FROM productos WHERE id = @id")
        if (result.recordset.length === 0)
            return res.status(404).json({ mensaje: "Producto no encontrado" })
        res.json(result.recordset[0])
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener producto", error: error.message })
    }
})

router.post("/", async (req, res) => {
    const { nombre, descripcion, stock, imagen } = req.body
    const precio = parseFloat(req.body.precio)
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
            .input("imagen",      sql.VarChar(255),   imagen || null)
            .query(`INSERT INTO productos (nombre, descripcion, precio, stock, imagen)
            VALUES (@nombre, @descripcion, @precio, @stock, @imagen)`)
        res.status(201).json({ mensaje: "Producto creado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear producto", error: error.message })
    }
})

router.put("/:id", async (req, res) => {
    const { nombre, descripcion, stock, imagen } = req.body
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
            .input("imagen",      sql.VarChar(255),   imagen || null)
            .query(`UPDATE productos
                  SET nombre      = @nombre,
                    descripcion = @descripcion,
                    precio      = @precio,
                    stock       = @stock,
                    imagen      = @imagen
                  WHERE id = @id`)
        res.json({ mensaje: "Producto actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar producto", error: error.message })
    }
})

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