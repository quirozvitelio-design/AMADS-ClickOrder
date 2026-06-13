const express = require("express")
const router  = require("express").Router()
const { sql } = require("../config/db")

// ── GET /api/reportes/ingresos ────────────────────────────────
router.get("/ingresos", async (req, res) => {
  try {
    const pool = await sql.connect()

    // Sin fechas: traer todo
    if (!req.query.desde && !req.query.hasta) {
      const result = await pool.request().query(`
        SELECT
          CONVERT(VARCHAR(10), p.fecha, 23) AS fecha,
          SUM(pr.precio * p.cantidad)       AS ingresos,
          COUNT(DISTINCT ISNULL(p.pedido_grupo, CAST(p.id AS VARCHAR))) AS ordenes
        FROM pedidos p
        INNER JOIN productos pr ON p.producto_id = pr.id
        WHERE p.estado != 'Devuelto'
        GROUP BY CONVERT(VARCHAR(10), p.fecha, 23)
        ORDER BY fecha ASC
      `)
      return res.json(result.recordset)
    }

    // Con fechas
    const desde = req.query.desde + " 00:00:00"
    const hasta = req.query.hasta + " 23:59:59"

    const result = await pool.request()
      .input("desde", sql.VarChar, desde)
      .input("hasta", sql.VarChar, hasta)
      .query(`
        SELECT
          CONVERT(VARCHAR(10), p.fecha, 23) AS fecha,
          SUM(pr.precio * p.cantidad)       AS ingresos,
          COUNT(DISTINCT ISNULL(p.pedido_grupo, CAST(p.id AS VARCHAR))) AS ordenes
        FROM pedidos p
        INNER JOIN productos pr ON p.producto_id = pr.id
        WHERE p.fecha >= CAST(@desde AS DATETIME)
          AND p.fecha <= CAST(@hasta AS DATETIME)
          AND p.estado != 'Devuelto'
        GROUP BY CONVERT(VARCHAR(10), p.fecha, 23)
        ORDER BY fecha ASC
      `)
    res.json(result.recordset)

  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener ingresos", error: err.message })
  }
})

// ── GET /api/reportes/productos-top ───────────────────────────
router.get("/productos-top", async (req, res) => {
  const limit = parseInt(req.query.limit) || 5

  try {
    const pool = await sql.connect()

    // Sin fechas: traer todo
    if (!req.query.desde && !req.query.hasta) {
      const result = await pool.request()
        .input("limit", sql.Int, limit)
        .query(`
          SELECT TOP (@limit)
            pr.nombre                        AS producto,
            SUM(p.cantidad)                  AS total_vendido,
            SUM(pr.precio * p.cantidad)      AS ingresos,
            COUNT(DISTINCT ISNULL(p.pedido_grupo, CAST(p.id AS VARCHAR))) AS ordenes
          FROM pedidos p
          INNER JOIN productos pr ON p.producto_id = pr.id
          WHERE p.estado != 'Devuelto'
          GROUP BY pr.id, pr.nombre
          ORDER BY total_vendido DESC
        `)
      return res.json(result.recordset)
    }

    // Con fechas
    const desde = req.query.desde + " 00:00:00"
    const hasta = req.query.hasta + " 23:59:59"

    const result = await pool.request()
      .input("desde", sql.VarChar, desde)
      .input("hasta", sql.VarChar, hasta)
      .input("limit", sql.Int,     limit)
      .query(`
        SELECT TOP (@limit)
          pr.nombre                        AS producto,
          SUM(p.cantidad)                  AS total_vendido,
          SUM(pr.precio * p.cantidad)      AS ingresos,
          COUNT(DISTINCT ISNULL(p.pedido_grupo, CAST(p.id AS VARCHAR))) AS ordenes
        FROM pedidos p
        INNER JOIN productos pr ON p.producto_id = pr.id
        WHERE p.fecha >= CAST(@desde AS DATETIME)
          AND p.fecha <= CAST(@hasta AS DATETIME)
          AND p.estado != 'Devuelto'
        GROUP BY pr.id, pr.nombre
        ORDER BY total_vendido DESC
      `)
    res.json(result.recordset)

  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener productos top", error: err.message })
  }
})

// ── GET /api/reportes/resumen ─────────────────────────────────
router.get("/resumen", async (req, res) => {
  try {
    const pool = await sql.connect()
    let queryOrdenes, queryIngresos

    // Sin fechas: traer todo
    if (!req.query.desde && !req.query.hasta) {
      queryOrdenes = await pool.request().query(`
        SELECT COUNT(DISTINCT ISNULL(pedido_grupo, CAST(id AS VARCHAR))) AS total_ordenes
        FROM pedidos
        WHERE estado != 'Devuelto'
      `)
      queryIngresos = await pool.request().query(`
        SELECT ISNULL(SUM(pr.precio * p.cantidad), 0) AS total_ingresos
        FROM pedidos p
        INNER JOIN productos pr ON p.producto_id = pr.id
        WHERE p.estado != 'Devuelto'
      `)
    } else {
      // Con fechas
      const desde = req.query.desde + " 00:00:00"
      const hasta = req.query.hasta + " 23:59:59"

      queryOrdenes = await pool.request()
        .input("desde", sql.VarChar, desde)
        .input("hasta", sql.VarChar, hasta)
        .query(`
          SELECT COUNT(DISTINCT ISNULL(pedido_grupo, CAST(id AS VARCHAR))) AS total_ordenes
          FROM pedidos
          WHERE fecha >= CAST(@desde AS DATETIME)
            AND fecha <= CAST(@hasta AS DATETIME)
            AND estado != 'Devuelto'
        `)
      queryIngresos = await pool.request()
        .input("desde", sql.VarChar, desde)
        .input("hasta", sql.VarChar, hasta)
        .query(`
          SELECT ISNULL(SUM(pr.precio * p.cantidad), 0) AS total_ingresos
          FROM pedidos p
          INNER JOIN productos pr ON p.producto_id = pr.id
          WHERE p.fecha >= CAST(@desde AS DATETIME)
            AND p.fecha <= CAST(@hasta AS DATETIME)
            AND p.estado != 'Devuelto'
        `)
    }

    const totalOrdenes   = queryOrdenes.recordset[0].total_ordenes || 0
    const totalIngresos  = parseFloat(queryIngresos.recordset[0].total_ingresos) || 0
    const ticketPromedio = totalOrdenes > 0
      ? (totalIngresos / totalOrdenes).toFixed(2)
      : "0.00"

    res.json({
      total_ordenes:   totalOrdenes,
      total_ingresos:  totalIngresos.toFixed(2),
      ticket_promedio: ticketPromedio
    })

  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener resumen", error: err.message })
  }
})

// ── Mantener compatibilidad con endpoint anterior ─────────────
router.get("/dashboard-resumen", async (req, res) => {
  try {
    const pool = await sql.connect()
    const queryOrdenes = await pool.request().query(`
      SELECT COUNT(DISTINCT ISNULL(pedido_grupo, CAST(id AS VARCHAR))) AS total_ordenes
      FROM pedidos WHERE estado != 'Devuelto'
    `)
    const queryIngresos = await pool.request().query(`
      SELECT ISNULL(SUM(pr.precio * p.cantidad), 0) AS total_ingresos
      FROM pedidos p
      INNER JOIN productos pr ON p.producto_id = pr.id
      WHERE p.estado != 'Devuelto'
    `)
    const totalOrdenes  = queryOrdenes.recordset[0].total_ordenes || 0
    const totalIngresos = parseFloat(queryIngresos.recordset[0].total_ingresos) || 0
    res.json({
      totalOrdenes,
      totalIngresos,
      ticketPromedio: totalOrdenes > 0 ? totalIngresos / totalOrdenes : 0
    })
  } catch (err) {
    res.status(500).json({ mensaje: "Error", error: err.message })
  }
})

module.exports = router