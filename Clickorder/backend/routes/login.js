const express = require("express")
const router = express.Router()
const { sql } = require("../config/db")
const bcrypt = require("bcrypt")

router.post("/", async (req, res) => {
    const { correo, password } = req.body

    try {
        const pool = await sql.connect()

        //Buscar usuario solo por correo
        const result = await pool.request()
            .input("correo", sql.VarChar, correo)
            .query(`
                SELECT u.id, u.nombre, u.correo, u.password, r.nombre AS rol
                FROM usuarios u
                INNER JOIN roles r ON u.rol_id = r.id
                WHERE u.correo = @correo
            `)

        if (result.recordset.length === 0) {
            return res.status(401).json({ mensaje: "Usuario no encontrado" })
        }

        const usuario = result.recordset[0]

        //Comparar Password ingresado con el hash almacenado
        const esValida = await bcrypt.compare(password, usuario.password)

        if (!esValida) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" })
        }

        //Opcional: no devolver password
        delete usuario.password

        res.json({
            mensaje: "Login exitoso",
            usuario
        })

    } catch (error) {
        res.status(500).json({ mensaje: "Error en el servidor", error: error.message })
    }
})

module.exports = router