const express = require('express')
const router  = express.Router()
const sql     = require('mssql')

// ──────────────────────────────────────────────────────────────
// GET /api/perfil/:id
// ──────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const pool   = await sql.connect()
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, nombre, correo, telefono, genero, documento, fecha_nacimiento, registro_google FROM usuarios WHERE id = @id')
    if (!result.recordset.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' })
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener perfil', error: err.message })
  }
})

// ──────────────────────────────────────────────────────────────
// PUT /api/perfil/:id   — editar perfil
// ──────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { nombre, telefono, genero, documento, fecha_nacimiento } = req.body
  if (!nombre || !nombre.trim())
    return res.status(400).json({ mensaje: 'El nombre es obligatorio' })
  try {
    const pool = await sql.connect()
    const result = await pool.request()
      .input('id',               sql.Int,      req.params.id)
      .input('nombre',           sql.VarChar,  nombre.trim())
      .input('telefono',         sql.VarChar,  telefono       || null)
      .input('genero',           sql.VarChar,  genero         || null)
      .input('documento',        sql.VarChar,  documento      || null)
      .input('fecha_nacimiento', sql.Date,     fecha_nacimiento || null)
      .query(`UPDATE usuarios
              SET nombre=@nombre, telefono=@telefono, genero=@genero,
                  documento=@documento, fecha_nacimiento=@fecha_nacimiento,
                  perfil_completo=1
              WHERE id=@id;
              SELECT id, nombre, correo, telefono, genero, documento, fecha_nacimiento
              FROM usuarios WHERE id=@id`)
    res.json({ mensaje: 'Perfil actualizado', usuario: result.recordset[0] })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar perfil', error: err.message })
  }
})

// ──────────────────────────────────────────────────────────────
// PUT /api/perfil/:id/password
// ──────────────────────────────────────────────────────────────
router.put('/:id/password', async (req, res) => {
  const { password_actual, password_nuevo } = req.body
  if (!password_actual || !password_nuevo)
    return res.status(400).json({ mensaje: 'Contraseña actual y nueva son requeridas' })
  try {
    const bcrypt = require('bcryptjs')
    const pool   = await sql.connect()
    const r = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT password FROM usuarios WHERE id = @id')
    if (!r.recordset.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' })

    const ok = await bcrypt.compare(password_actual, r.recordset[0].password)
    if (!ok) return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' })

    const hash = await bcrypt.hash(password_nuevo, 10)
    await pool.request()
      .input('id',   sql.Int,     req.params.id)
      .input('hash', sql.VarChar, hash)
      .query('UPDATE usuarios SET password = @hash WHERE id = @id')
    res.json({ mensaje: 'Contraseña actualizada correctamente' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al cambiar contraseña', error: err.message })
  }
})

// ══════════════════════════════════════════════════════════════
//  DIRECCIONES
// ══════════════════════════════════════════════════════════════

// GET /api/perfil/:id/direcciones
router.get('/:id/direcciones', async (req, res) => {
  try {
    const pool   = await sql.connect()
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM direcciones WHERE usuario_id = @id ORDER BY es_principal DESC, creado_en DESC')
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener direcciones', error: err.message })
  }
})

// POST /api/perfil/:id/direcciones   — crear nueva dirección
router.post('/:id/direcciones', async (req, res) => {
  const { pais, departamento, municipio, distrito, calle, info_adicional, destinatario } = req.body
  if (!departamento || !municipio || !calle || !destinatario)
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' })
  try {
    const pool = await sql.connect()

    // Si es la primera dirección del usuario → marcarla como principal automáticamente
    const cnt = await pool.request()
      .input('uid', sql.Int, req.params.id)
      .query('SELECT COUNT(*) AS total FROM direcciones WHERE usuario_id = @uid')
    const esPrincipal = cnt.recordset[0].total === 0 ? 1 : 0

    await pool.request()
      .input('usuario_id',    sql.Int,     req.params.id)
      .input('pais',          sql.VarChar, pais          || 'El Salvador')
      .input('departamento',  sql.VarChar, departamento)
      .input('municipio',     sql.VarChar, municipio)
      .input('distrito',      sql.VarChar, distrito      || null)
      .input('calle',         sql.VarChar, calle)
      .input('info_adicional',sql.VarChar, info_adicional || null)
      .input('destinatario',  sql.VarChar, destinatario)
      .input('es_principal',  sql.Bit,     esPrincipal)
      .query(`INSERT INTO direcciones
              (usuario_id, pais, departamento, municipio, distrito, calle, info_adicional, destinatario, es_principal)
              VALUES (@usuario_id, @pais, @departamento, @municipio, @distrito, @calle, @info_adicional, @destinatario, @es_principal)`)
    res.status(201).json({ mensaje: 'Dirección guardada correctamente' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al guardar dirección', error: err.message })
  }
})

// PUT /api/perfil/direcciones/:id   — editar dirección existente
router.put('/direcciones/:id', async (req, res) => {
  const { destinatario, departamento, municipio, distrito, calle, info_adicional } = req.body
  if (!destinatario || !departamento || !municipio || !calle)
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' })
  try {
    const pool = await sql.connect()
    await pool.request()
      .input('id',            sql.Int,     req.params.id)
      .input('destinatario',  sql.VarChar, destinatario)
      .input('departamento',  sql.VarChar, departamento)
      .input('municipio',     sql.VarChar, municipio)
      .input('distrito',      sql.VarChar, distrito      || null)
      .input('calle',         sql.VarChar, calle)
      .input('info_adicional',sql.VarChar, info_adicional || null)
      .query(`UPDATE direcciones
              SET destinatario=@destinatario, departamento=@departamento,
                  municipio=@municipio, distrito=@distrito,
                  calle=@calle, info_adicional=@info_adicional
              WHERE id = @id`)
    res.json({ mensaje: 'Dirección actualizada correctamente' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar dirección', error: err.message })
  }
})

// PATCH /api/perfil/direcciones/:id/principal   — marcar como principal
router.patch('/direcciones/:id/principal', async (req, res) => {
  const { usuario_id } = req.body
  if (!usuario_id) return res.status(400).json({ mensaje: 'usuario_id requerido' })
  try {
    const pool = await sql.connect()
    // Quitar principal de todas las del usuario
    await pool.request()
      .input('uid', sql.Int, usuario_id)
      .query('UPDATE direcciones SET es_principal = 0 WHERE usuario_id = @uid')
    // Marcar la nueva
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE direcciones SET es_principal = 1 WHERE id = @id')
    res.json({ mensaje: 'Dirección marcada como principal' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message })
  }
})

// PATCH /api/perfil/direcciones/:id/quitar-principal   — quitar principal sin asignar otra
router.patch('/direcciones/:id/quitar-principal', async (req, res) => {
  try {
    const pool = await sql.connect()
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE direcciones SET es_principal = 0 WHERE id = @id')
    res.json({ mensaje: 'Principal quitado correctamente' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message })
  }
})

// DELETE /api/perfil/direcciones/:id
router.delete('/direcciones/:id', async (req, res) => {
  try {
    const pool = await sql.connect()
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM direcciones WHERE id = @id')
    res.json({ mensaje: 'Dirección eliminada' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar dirección', error: err.message })
  }
})

// ══════════════════════════════════════════════════════════════
//  TARJETAS
// ══════════════════════════════════════════════════════════════

// GET /api/perfil/:id/tarjetas
router.get('/:id/tarjetas', async (req, res) => {
  try {
    const pool   = await sql.connect()
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, ultimos_cuatro, nombre_titular, expiracion, tipo, es_principal FROM tarjetas WHERE usuario_id = @id ORDER BY es_principal DESC')
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener tarjetas', error: err.message })
  }
})

// POST /api/perfil/:id/tarjetas
router.post('/:id/tarjetas', async (req, res) => {
  const { ultimos_cuatro, nombre_titular, expiracion, tipo, es_principal } = req.body
  if (!ultimos_cuatro || !nombre_titular || !expiracion)
    return res.status(400).json({ mensaje: 'Datos incompletos de la tarjeta' })
  try {
    const pool = await sql.connect()
    if (es_principal) {
      await pool.request()
        .input('uid', sql.Int, req.params.id)
        .query('UPDATE tarjetas SET es_principal = 0 WHERE usuario_id = @uid')
    }
    await pool.request()
      .input('usuario_id',     sql.Int,     req.params.id)
      .input('ultimos_cuatro', sql.VarChar, ultimos_cuatro)
      .input('nombre_titular', sql.VarChar, nombre_titular)
      .input('expiracion',     sql.VarChar, expiracion)
      .input('tipo',           sql.VarChar, tipo           || 'visa')
      .input('es_principal',   sql.Bit,     es_principal   ? 1 : 0)
      .query(`INSERT INTO tarjetas (usuario_id, ultimos_cuatro, nombre_titular, expiracion, tipo, es_principal)
              VALUES (@usuario_id, @ultimos_cuatro, @nombre_titular, @expiracion, @tipo, @es_principal)`)
    res.status(201).json({ mensaje: 'Tarjeta guardada' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al guardar tarjeta', error: err.message })
  }
})

// DELETE /api/perfil/tarjetas/:id
router.delete('/tarjetas/:id', async (req, res) => {
  try {
    const pool = await sql.connect()
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM tarjetas WHERE id = @id')
    res.json({ mensaje: 'Tarjeta eliminada' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar tarjeta', error: err.message })
  }
})

module.exports = router