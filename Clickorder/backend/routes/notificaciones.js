const express = require('express')
const router  = express.Router()
const { sql } = require('../config/db')

// GET /api/notificaciones/:usuario_id
router.get('/:usuario_id', async (req, res) => {
  try {
    const pool   = await sql.connect()
    const result = await pool.request()
      .input('uid', sql.Int, req.params.usuario_id)
      .query(`
        SELECT TOP 30 *
        FROM notificaciones
        WHERE usuario_id = @uid
        ORDER BY fecha DESC
      `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message })
  }
})

// PATCH /api/notificaciones/:id/leer
router.patch('/:id/leer', async (req, res) => {
  try {
    const pool = await sql.connect()
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE notificaciones SET leida = 1 WHERE id = @id')
    res.json({ mensaje: 'Marcada como leída' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message })
  }
})

// PATCH /api/notificaciones/leer-todas/:usuario_id
router.patch('/leer-todas/:usuario_id', async (req, res) => {
  try {
    const pool = await sql.connect()
    await pool.request()
      .input('uid', sql.Int, req.params.usuario_id)
      .query('UPDATE notificaciones SET leida = 1 WHERE usuario_id = @uid')
    res.json({ mensaje: 'Todas marcadas como leídas' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error', error: err.message })
  }
})

module.exports = router