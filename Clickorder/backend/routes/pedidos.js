const express = require("express")
const router = express.Router()
const { sql } = require("../config/db")

router.get("/", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request().query(`
            SELECT p.id, u.nombre AS usuario, pr.nombre AS producto,
                   pr.precio, p.cantidad, (pr.precio * p.cantidad) AS total
            FROM pedidos p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            INNER JOIN productos pr ON p.producto_id = pr.id
        `)
        res.json(result.recordset)
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener pedidos", error: error.message })
    }
})

router.get("/:id", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                SELECT p.id, u.nombre AS usuario, pr.nombre AS producto,
                       pr.precio, p.cantidad, (pr.precio * p.cantidad) AS total
                FROM pedidos p
                INNER JOIN usuarios u ON p.usuario_id = u.id
                INNER JOIN productos pr ON p.producto_id = pr.id
                WHERE p.id = @id
            `)
        if (result.recordset.length === 0)
            return res.status(404).json({ mensaje: "Pedido no encontrado" })
        res.json(result.recordset[0])
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener pedido", error: error.message })
    }
})

router.post("/", async (req, res) => {
    const { usuario_id, producto_id, cantidad } = req.body
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("usuario_id", sql.Int, usuario_id)
            .input("producto_id", sql.Int, producto_id)
            .input("cantidad", sql.Int, cantidad)
            .query("INSERT INTO pedidos (usuario_id, producto_id, cantidad) VALUES (@usuario_id, @producto_id, @cantidad)")
        res.status(201).json({ mensaje: "Pedido creado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear pedido", error: error.message })
    }
})

router.put("/:id", async (req, res) => {
    const { usuario_id, producto_id, cantidad } = req.body
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id", sql.Int, req.params.id)
            .input("usuario_id", sql.Int, usuario_id)
            .input("producto_id", sql.Int, producto_id)
            .input("cantidad", sql.Int, cantidad)
            .query("UPDATE pedidos SET usuario_id = @usuario_id, producto_id = @producto_id, cantidad = @cantidad WHERE id = @id")
        res.json({ mensaje: "Pedido actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar pedido", error: error.message })
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM pedidos WHERE id = @id")
        res.json({ mensaje: "Pedido eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar pedido", error: error.message })
    }
})

module.exports = router