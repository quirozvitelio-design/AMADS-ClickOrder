const express = require("express")
const router = express.Router()
const { sql } = require("../config/db")

// GET todos
router.get("/", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request().query("SELECT * FROM roles")
        res.json(result.recordset)
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener roles", error: error.message })
    }
})

// POST crear
router.post("/", async (req, res) => {
    const { nombre } = req.body
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("nombre", sql.VarChar, nombre)
            .query("INSERT INTO roles (nombre) VALUES (@nombre)")
        res.status(201).json({ mensaje: "Rol creado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear rol", error: error.message })
    }
})

// PUT actualizar
router.put("/:id", async (req, res) => {
    const { nombre } = req.body
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id",     sql.Int,     req.params.id)
            .input("nombre", sql.VarChar, nombre)
            .query("UPDATE roles SET nombre = @nombre WHERE id = @id")
        res.json({ mensaje: "Rol actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar rol", error: error.message })
    }
})

// DELETE eliminar
router.delete("/:id", async (req, res) => {
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM roles WHERE id = @id")
        res.json({ mensaje: "Rol eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar rol", error: error.message })
    }
})

module.exports = router