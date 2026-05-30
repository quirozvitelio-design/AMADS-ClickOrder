const express = require("express")
const router  = express.Router()
const { sql } = require("../config/db")

// ── GET /api/dashboard/kpis ───────────────────────────────────
// Retorna 4 KPIs: ingresos del mes, pedidos activos, stock crítico, clientes
router.get("/kpis", async (req, res) => {
    try {
        const pool = await sql.connect()

        const [ingresos, activos, stockCritico, clientes, ingresosMes] = await Promise.all([

            // Ingresos totales del mes actual
            pool.request().query(`
                SELECT ISNULL(SUM(pr.precio * p.cantidad), 0) AS total
                FROM pedidos p
                INNER JOIN productos pr ON p.producto_id = pr.id
                WHERE MONTH(p.fecha) = MONTH(GETDATE())
                  AND YEAR(p.fecha)  = YEAR(GETDATE())
                  AND p.estado != 'Devuelto'
            `),

            // Pedidos activos (no entregados ni devueltos)
            pool.request().query(`
                SELECT COUNT(DISTINCT ISNULL(pedido_grupo, CAST(id AS VARCHAR))) AS total
                FROM pedidos
                WHERE estado NOT IN ('Entregado', 'Devuelto')
            `),

            // Productos con stock crítico (menor a 5)
            pool.request().query(`
                SELECT COUNT(*) AS total
                FROM productos
                WHERE stock < 5 AND stock >= 0
            `),

            // Total clientes registrados
            pool.request().query(`
                SELECT COUNT(*) AS total
                FROM usuarios u
                INNER JOIN roles r ON u.rol_id = r.id
                WHERE r.nombre = 'cliente'
            `),

            // Ingresos del mes anterior para comparar
            pool.request().query(`
                SELECT ISNULL(SUM(pr.precio * p.cantidad), 0) AS total
                FROM pedidos p
                INNER JOIN productos pr ON p.producto_id = pr.id
                WHERE MONTH(p.fecha) = MONTH(DATEADD(MONTH, -1, GETDATE()))
                  AND YEAR(p.fecha)  = YEAR(DATEADD(MONTH, -1, GETDATE()))
                  AND p.estado != 'Devuelto'
            `)
        ])

        const ingresosMesActual   = parseFloat(ingresos.recordset[0].total)
        const ingresosMesAnterior = parseFloat(ingresosMes.recordset[0].total)
        const variacion = ingresosMesAnterior > 0
            ? (((ingresosMesActual - ingresosMesAnterior) / ingresosMesAnterior) * 100).toFixed(1)
            : null

        res.json({
            ingresos_mes:     ingresosMesActual.toFixed(2),
            pedidos_activos:  activos.recordset[0].total,
            stock_critico:    stockCritico.recordset[0].total,
            total_clientes:   clientes.recordset[0].total,
            variacion_mes:    variacion   // % de cambio vs mes anterior, null si no hay datos
        })
    } catch (err) {
        res.status(500).json({ mensaje: "Error al obtener KPIs", error: err.message })
    }
})

// ── GET /api/dashboard/ingresos-semana ────────────────────────
// Retorna ingresos de los últimos 7 días para la gráfica de línea
router.get("/ingresos-semana", async (req, res) => {
    try {
        const pool   = await sql.connect()
        const result = await pool.request().query(`
            SELECT
                CONVERT(VARCHAR(10), p.fecha, 120)   AS fecha,
                DATENAME(WEEKDAY, p.fecha)            AS dia,
                ISNULL(SUM(pr.precio * p.cantidad), 0) AS ingresos,
                COUNT(DISTINCT ISNULL(p.pedido_grupo, CAST(p.id AS VARCHAR))) AS ordenes
            FROM pedidos p
            INNER JOIN productos pr ON p.producto_id = pr.id
            WHERE p.fecha >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
              AND p.fecha <  DATEADD(DAY,  1, CAST(GETDATE() AS DATE))
              AND p.estado != 'Devuelto'
            GROUP BY CONVERT(VARCHAR(10), p.fecha, 120), DATENAME(WEEKDAY, p.fecha)
            ORDER BY fecha ASC
        `)

        // Completar los 7 días aunque no haya pedidos
        const dias = []
        for (let i = 6; i >= 0; i--) {
            const d    = new Date()
            d.setDate(d.getDate() - i)
            const key  = d.toISOString().split("T")[0]
            const enc  = result.recordset.find(r => r.fecha === key)
            dias.push({
                fecha:    key,
                dia:      d.toLocaleDateString("es-SV", { weekday: "short" }),
                ingresos: enc ? parseFloat(enc.ingresos) : 0,
                ordenes:  enc ? enc.ordenes : 0
            })
        }

        res.json(dias)
    } catch (err) {
        res.status(500).json({ mensaje: "Error al obtener ingresos semana", error: err.message })
    }
})

// ── GET /api/dashboard/top-productos ─────────────────────────
// Top 5 productos más vendidos del mes
router.get("/top-productos", async (req, res) => {
    try {
        const pool   = await sql.connect()
        const result = await pool.request().query(`
            SELECT TOP 5
                pr.nombre                        AS producto,
                SUM(p.cantidad)                  AS total_vendido,
                SUM(pr.precio * p.cantidad)      AS ingresos
            FROM pedidos p
            INNER JOIN productos pr ON p.producto_id = pr.id
            WHERE MONTH(p.fecha) = MONTH(GETDATE())
              AND YEAR(p.fecha)  = YEAR(GETDATE())
              AND p.estado != 'Devuelto'
            GROUP BY pr.id, pr.nombre
            ORDER BY total_vendido DESC
        `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ mensaje: "Error al obtener top productos", error: err.message })
    }
})

// ── GET /api/dashboard/stock-critico ─────────────────────────
// Productos con stock menor a 5
router.get("/stock-critico", async (req, res) => {
    try {
        const pool   = await sql.connect()
        const result = await pool.request().query(`
            SELECT id, nombre, stock, precio
            FROM productos
            WHERE stock < 5 AND stock >= 0
            ORDER BY stock ASC
        `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ mensaje: "Error al obtener stock crítico", error: err.message })
    }
})

// ── GET /api/dashboard/pedidos-recientes ─────────────────────
// Últimos 5 pedidos confirmados
router.get("/pedidos-recientes", async (req, res) => {
    try {
        const pool   = await sql.connect()
        const result = await pool.request().query(`
            SELECT TOP 5
                p.pedido_grupo,
                u.nombre   AS cliente,
                p.estado,
                p.fecha,
                SUM(pr.precio * p.cantidad) AS total
            FROM pedidos p
            INNER JOIN usuarios  u  ON p.usuario_id  = u.id
            INNER JOIN productos pr ON p.producto_id = pr.id
            GROUP BY p.pedido_grupo, u.nombre, p.estado, p.fecha
            ORDER BY p.fecha DESC
        `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ mensaje: "Error al obtener pedidos recientes", error: err.message })
    }
})

module.exports = router