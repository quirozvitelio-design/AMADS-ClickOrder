const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sql = require('mssql');
const { OAuth2Client } = require('google-auth-library');
const { enviarCorreoVerificacion } = require('../config/mailer');

const CLIENT_ID = '130057316456-gmtiq84j2rrilvua4dbnkban9m2loum1.apps.googleusercontent.com';
const googleClient = new OAuth2Client(CLIENT_ID);

// ==========================================
// VISTA ADMIN: OBTENER TODOS LOS USUARIOS
// ==========================================
router.get("/", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request().query(`
            SELECT u.id, u.nombre, u.correo, r.nombre AS rol, u.rol_id, u.validado
            FROM usuarios u
            INNER JOIN roles r ON u.rol_id = r.id
        `)
        res.json(result.recordset)
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message })
    }
})

// ==========================================
// VISTA ADMIN: CREAR USUARIO MANUALMENTE
// ==========================================
router.post("/", async (req, res) => {
    const { nombre, correo, password, rol_id } = req.body

    if (!nombre || !correo || !password || !rol_id) {
        return res.status(400).json({ mensaje: "Todos los campos son obligatorios" })
    }

    try {
        const pool = await sql.connect()

        const userCheck = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT id FROM usuarios WHERE correo = @correo')

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ mensaje: "El correo electrónico ya está registrado." })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await pool.request()
            .input("nombre",          sql.VarChar, nombre)
            .input("correo",          sql.VarChar, correo)
            .input("password",        sql.VarChar, hashedPassword)
            .input("rol_id",          sql.Int,     rol_id)
            .input("validado",        sql.Bit,     1)
            .input("email_validado",  sql.Bit,     1)
            .input("perfil_completo", sql.Bit,     1)
            .input("registro_google", sql.Bit,     0)
            .query(`
                INSERT INTO usuarios
                  (nombre, correo, password, rol_id, validado, email_validado, perfil_completo, registro_google)
                VALUES
                  (@nombre, @correo, @password, @rol_id, @validado, @email_validado, @perfil_completo, @registro_google)
            `)

        res.status(201).json({ mensaje: "Usuario creado correctamente por el administrador" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear usuario", error: error.message })
    }
})

// ==========================================
// VISTA ADMIN: ACTUALIZAR USUARIO
// ==========================================
router.put("/:id", async (req, res) => {
    const { nombre, correo, password, rol_id } = req.body
    try {
        const pool = await sql.connect()

        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10)
            await pool.request()
                .input("id",       sql.Int,     req.params.id)
                .input("nombre",   sql.VarChar, nombre)
                .input("correo",   sql.VarChar, correo)
                .input("password", sql.VarChar, hashedPassword)
                .input("rol_id",   sql.Int,     rol_id)
                .query("UPDATE usuarios SET nombre=@nombre, correo=@correo, password=@password, rol_id=@rol_id WHERE id=@id")
        } else {
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

// ==========================================
// VISTA ADMIN: ELIMINAR USUARIO
// ==========================================
router.delete("/:id", async (req, res) => {
    try {
        const pool = await sql.connect()

        const usuario = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("SELECT rol_id FROM usuarios WHERE id = @id")

        if (usuario.recordset.length > 0 && usuario.recordset[0].rol_id === 1) {
            return res.status(403).json({ mensaje: "No se puede eliminar un administrador" })
        }

        await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM usuarios WHERE id = @id")

        res.json({ mensaje: "Usuario eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar usuario", error: error.message })
    }
})

// ==========================================
// SITIO PÚBLICO: REGISTRO MANUAL DE CLIENTES
// ==========================================
router.post('/registro', async (req, res) => {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
        return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
    }

    try {
        const pool = await sql.connect();

        const userCheck = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT id FROM usuarios WHERE correo = @correo');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ mensaje: "El correo electrónico ya está registrado." });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiracion = new Date();
        expiracion.setHours(expiracion.getHours() + 24);

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.request()
            .input('nombre',           sql.VarChar,  nombre)
            .input('correo',           sql.VarChar,  correo)
            .input('password',         sql.VarChar,  passwordHash)
            .input('rol_id',           sql.Int,      2)
            .input('validado',         sql.Bit,      0)
            .input('email_validado',   sql.Bit,      0)
            .input('token_validacion', sql.VarChar,  token)
            .input('token_expiracion', sql.DateTime, expiracion)
            .input('perfil_completo',  sql.Bit,      0)
            .input('registro_google',  sql.Bit,      0)
            .query(`
                INSERT INTO usuarios
                  (nombre, correo, password, rol_id, validado, email_validado,
                   token_validacion, token_expiracion, perfil_completo, registro_google)
                VALUES
                  (@nombre, @correo, @password, @rol_id, @validado, @email_validado,
                   @token_validacion, @token_expiracion, @perfil_completo, @registro_google)
            `);

        await enviarCorreoVerificacion(correo, nombre, token);

        res.status(201).json({
            mensaje: "¡Registro exitoso! Por favor verifica tu correo electrónico para activar tu cuenta."
        });

    } catch (error) {
        console.error("Error en /registro:", error);
        res.status(500).json({ mensaje: "Error interno al procesar el registro." });
    }
});

// ==========================================
// SITIO PÚBLICO: VERIFICAR TOKEN DESDE LINK
// ==========================================
router.get('/verificar-cuenta', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ mensaje: "Token de validación requerido." });

    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('token', sql.VarChar, token)
            .query('SELECT id, token_expiracion FROM usuarios WHERE token_validacion = @token');

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: "El enlace de activación no es válido o ya fue utilizado." });
        }

        const usuario = result.recordset[0];
        if (new Date() > new Date(usuario.token_expiracion)) {
            return res.status(400).json({ mensaje: "El enlace ha expirado. Por favor, regístrate de nuevo." });
        }

        await pool.request()
            .input('id', sql.Int, usuario.id)
            .query(`
                UPDATE usuarios
                SET validado = 1, email_validado = 1,
                    token_validacion = NULL, token_expiracion = NULL
                WHERE id = @id
            `);

        res.json({ mensaje: "¡Tu cuenta ha sido activada con éxito! Ya puedes iniciar sesión." });
    } catch (error) {
        console.error("Error en /verificar-cuenta:", error);
        res.status(500).json({ mensaje: "Error interno al verificar la cuenta." });
    }
});

// ==========================================
// SITIO PÚBLICO: LOGIN TRADICIONAL
// ==========================================
router.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query(`
                SELECT u.*, r.nombre AS rol_nombre
                FROM usuarios u
                INNER JOIN roles r ON u.rol_id = r.id
                WHERE u.correo = @correo
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ mensaje: "El correo electrónico o la contraseña son incorrectos." });
        }

        const usuario = result.recordset[0];

        const match = await bcrypt.compare(password, usuario.password);
        if (!match) {
            return res.status(401).json({ mensaje: "El correo electrónico o la contraseña son incorrectos." });
        }

        if (usuario.validado === false || usuario.validado === 0) {
            return res.status(403).json({
                mensaje: "Tu cuenta aún no está activada. Por favor, revisa tu correo electrónico para verificarla."
            });
        }

        res.json({
            usuario: {
                id:               usuario.id,
                nombre:           usuario.nombre,
                correo:           usuario.correo,
                rol_id:           usuario.rol_id,
                rol:              usuario.rol_nombre,
                perfil_completo:  usuario.perfil_completo  ?? 1,
                registro_google:  usuario.registro_google  ?? 0
            }
        });

    } catch (error) {
        console.error("Error en /login:", error);
        res.status(500).json({ mensaje: "Error interno en el servidor." });
    }
});

// ==========================================
// SITIO PÚBLICO: GOOGLE LOGIN
// ==========================================
router.post('/google-login', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ mensaje: "Token de Google requerido." });

    try {
        const ticket = await googleClient.verifyIdToken({ idToken: token, audience: CLIENT_ID });
        const { email, name } = ticket.getPayload();

        const pool = await sql.connect();
        let result = await pool.request()
            .input('correo', sql.VarChar, email)
            .query(`
                SELECT u.*, r.nombre AS rol_nombre
                FROM usuarios u
                INNER JOIN roles r ON u.rol_id = r.id
                WHERE u.correo = @correo
            `);

        let usuario;

        if (result.recordset.length === 0) {
            // ── Usuario NUEVO por Google → perfil_completo = 0 ──
            // El router guard lo mandará a /completar-perfil
            const passwordFicticio = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(passwordFicticio, salt);

            const insertResult = await pool.request()
                .input('nombre',          sql.VarChar, name)
                .input('correo',          sql.VarChar, email)
                .input('password',        sql.VarChar, passwordHash)
                .input('rol_id',          sql.Int,     2)
                .input('validado',        sql.Bit,     1)
                .input('email_validado',  sql.Bit,     1)
                .input('perfil_completo', sql.Bit,     0)
                .input('registro_google', sql.Bit,     1)
                .query(`
                    INSERT INTO usuarios
                      (nombre, correo, password, rol_id, validado, email_validado,
                       perfil_completo, registro_google)
                    VALUES
                      (@nombre, @correo, @password, @rol_id, @validado, @email_validado,
                       @perfil_completo, @registro_google);

                    SELECT u.*, r.nombre AS rol_nombre
                    FROM usuarios u
                    INNER JOIN roles r ON u.rol_id = r.id
                    WHERE u.id = SCOPE_IDENTITY();
                `);
            usuario = insertResult.recordset[0];
        } else {
            // ── Usuario EXISTENTE por Google ──
            usuario = result.recordset[0];
        }

        res.json({
            usuario: {
                id:               usuario.id,
                nombre:           usuario.nombre,
                correo:           usuario.correo,
                rol_id:           usuario.rol_id,
                rol:              usuario.rol_nombre,
                perfil_completo:  usuario.perfil_completo ?? 0,
                registro_google:  usuario.registro_google  ?? 1
            }
        });

    } catch (error) {
        console.error("Error en /google-login:", error);
        res.status(401).json({ mensaje: "Autenticación de Google no válida." });
    }
});

module.exports = router;