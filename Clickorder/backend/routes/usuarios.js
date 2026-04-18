const express = require("express")
const router = express.Router()
const { sql } = require("../config/db")
const bcrypt = require("bcrypt")

// GET todos — sin devolver password
router.get("/", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request().query(`
            SELECT u.id, u.nombre, u.correo, r.nombre AS rol, u.rol_id
            FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
        `)
        res.json(result.recordset)
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message })
    }
})

// POST crear — hashear password
router.post("/", async (req, res) => {
    const { nombre, correo, password, rol_id } = req.body
    if (!nombre || !correo || !password || !rol_id)
        return res.status(400).json({ mensaje: "Todos los campos son obligatorios" })
    try {
        const pool = await sql.connect()
        const hashedPassword = await bcrypt.hash(password, 10)
        await pool.request()
            .input("nombre",   sql.VarChar, nombre)
            .input("correo",   sql.VarChar, correo)
            .input("password", sql.VarChar, hashedPassword)
            .input("rol_id",   sql.Int,     rol_id)
            .query("INSERT INTO usuarios (nombre, correo, password, rol_id) VALUES (@nombre, @correo, @password, @rol_id)")
        res.status(201).json({ mensaje: "Usuario creado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear usuario", error: error.message })
    }
})

// PUT actualizar — si viene password nueva la hashea, si no la deja igual
router.put("/:id", async (req, res) => {
    const { nombre, correo, password, rol_id } = req.body
    try {
        const pool = await sql.connect()

        if (password && password.trim() !== "") {
            // Si mandó nueva contraseña, hashearla
            const hashedPassword = await bcrypt.hash(password, 10)
            await pool.request()
                .input("id",       sql.Int,     req.params.id)
                .input("nombre",   sql.VarChar, nombre)
                .input("correo",   sql.VarChar, correo)
                .input("password", sql.VarChar, hashedPassword)
                .input("rol_id",   sql.Int,     rol_id)
                .query("UPDATE usuarios SET nombre=@nombre, correo=@correo, password=@password, rol_id=@rol_id WHERE id=@id")
        } else {
            // Si no mandó contraseña, no la cambia
            await pool.request()
                .input("id",     sql.Int,     req.params.id)
                .input("nombre", sql.VarChar, nombre)
                .input("correo", sql.VarChar, correo)
                .input("rol_id", sql.Int,     rol_id)
                .query("UPDATE usuarios SET nombre=@nombre, correo=@correo, rol_id=@rol_id WHERE id=@id")
        }

        res.json({ mensaje: "Usuario actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar usuario", error: error.message })
    }
})

// DELETE eliminar
router.delete("/:id", async (req, res) => {
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM usuarios WHERE id = @id")
        res.json({ mensaje: "Usuario eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar usuario", error: error.message })
    }
})

module.exports = router