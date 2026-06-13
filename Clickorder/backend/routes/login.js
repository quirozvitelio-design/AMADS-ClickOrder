// backend/routes/login.js — actualizado para devolver perfil_completo
const express = require("express")
const router  = express.Router()
const { sql } = require("../config/db")
const bcrypt  = require("bcrypt")

router.post("/", async (req, res) => {
    const { correo, password } = req.body

    if (!correo || !password) {
        return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios." })
    }

    try {
        const pool = await sql.connect()

        const result = await pool.request()
            .input("correo", sql.VarChar, correo)
            .query(`
                SELECT u.id, u.nombre, u.correo, u.password,
                       u.validado, u.perfil_completo, u.registro_google,
                       r.nombre AS rol
                FROM usuarios u
                INNER JOIN roles r ON u.rol_id = r.id
                WHERE u.correo = @correo
            `)

        if (result.recordset.length === 0) {
            return res.status(401).json({ mensaje: "Usuario no encontrado." })
        }

        const usuario = result.recordset[0]

        // Verificar contraseña
        const esValida = await bcrypt.compare(password, usuario.password)
        if (!esValida) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta." })
        }

        // Verificar cuenta activada
        if (!usuario.validado) {
            return res.status(403).json({
                mensaje: "Tu cuenta aún no ha sido activada. Revisa tu correo para verificarla."
            })
        }

        // No devolver la contraseña
        delete usuario.password

        res.json({
            mensaje: "Login exitoso",
            usuario: {
                id:              usuario.id,
                nombre:          usuario.nombre,
                correo:          usuario.correo,
                rol:             usuario.rol,
                perfil_completo: usuario.perfil_completo ?? 1,   // ← CLAVE
                registro_google: usuario.registro_google  ?? 0
            }
        })

    } catch (error) {
        res.status(500).json({ mensaje: "Error en el servidor.", error: error.message })
    }
})

module.exports = router