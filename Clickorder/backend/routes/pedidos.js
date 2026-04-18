const express = require("express")
const router = express.Router()
const { sql } = require("../config/db")

const queryBase = `
    SELECT p.id, u.nombre AS usuario, u.id AS usuario_id,
           pr.nombre AS producto, pr.precio, p.cantidad,
           (pr.precio * p.cantidad) AS total,
           p.estado, p.metodo_pago, p.fecha,
           p.pedido_grupo
    FROM pedidos p
    INNER JOIN usuarios u   ON p.usuario_id  = u.id
    INNER JOIN productos pr ON p.producto_id = pr.id
`

router.get("/", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request()
            .query(queryBase + " ORDER BY p.fecha DESC")
        res.json(result.recordset)
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener pedidos", error: error.message })
    }
})

router.get("/usuario/:usuario_id", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request()
            .input("usuario_id", sql.Int, req.params.usuario_id)
            .query(queryBase + `
                WHERE p.usuario_id = @usuario_id
                ORDER BY p.fecha DESC
            `)
        res.json(result.recordset)
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener pedidos del usuario", error: error.message })
    }
})

router.get("/:id", async (req, res) => {
    try {
        const pool = await sql.connect()
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(queryBase + " WHERE p.id = @id")
        if (result.recordset.length === 0)
            return res.status(404).json({ mensaje: "Pedido no encontrado" })
        res.json(result.recordset[0])
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener pedido", error: error.message })
    }
})

// POST individual (compatibilidad admin)
router.post("/", async (req, res) => {
    const { usuario_id, producto_id, metodo_pago } = req.body
    const cantidad = parseInt(req.body.cantidad) || 1
    try {
        const pool = await sql.connect()
        const stockResult = await pool.request()
            .input("producto_id", sql.Int, producto_id)
            .query("SELECT stock FROM productos WHERE id = @producto_id")

        if (stockResult.recordset.length === 0)
            return res.status(404).json({ mensaje: "Producto no encontrado" })

        const stockActual = stockResult.recordset[0].stock
        if (stockActual < cantidad)
            return res.status(400).json({
                mensaje: `Stock insuficiente. Solo hay ${stockActual} unidades disponibles.`
            })

        await pool.request()
            .input("usuario_id",   sql.Int,     usuario_id)
            .input("producto_id",  sql.Int,     producto_id)
            .input("cantidad",     sql.Int,     cantidad)
            .input("estado",       sql.VarChar, "Pendiente")
            .input("metodo_pago",  sql.VarChar, metodo_pago || "")
            .input("pedido_grupo", sql.VarChar, null)
            .query(`INSERT INTO pedidos (usuario_id, producto_id, cantidad, estado, metodo_pago, pedido_grupo)
                    VALUES (@usuario_id, @producto_id, @cantidad, @estado, @metodo_pago, @pedido_grupo)`)

        await pool.request()
            .input("cantidad",    sql.Int, cantidad)
            .input("producto_id", sql.Int, producto_id)
            .query("UPDATE productos SET stock = stock - @cantidad WHERE id = @producto_id")

        res.status(201).json({ mensaje: "Pedido creado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear pedido", error: error.message })
    }
})

// POST múltiple desde el carrito del cliente — todos los items como un solo pedido agrupado
router.post("/carrito", async (req, res) => {
    const { usuario_id, items, metodo_pago } = req.body
    // items = [{ producto_id, cantidad }, ...]

    if (!items || items.length === 0)
        return res.status(400).json({ mensaje: "El carrito está vacío" })

    const pool = await sql.connect()
    const transaction = new sql.Transaction(pool)

    try {
        await transaction.begin()

        // Generar un ID de grupo único para agrupar los items del mismo carrito
        const grupo = `ORD-${Date.now()}-${usuario_id}`

        for (const item of items) {
            const { producto_id, cantidad } = item

            // Verificar stock
            const stockResult = await new sql.Request(transaction)
                .input("producto_id", sql.Int, producto_id)
                .query("SELECT stock, nombre FROM productos WHERE id = @producto_id")

            if (stockResult.recordset.length === 0)
                throw new Error(`Producto no encontrado: ID ${producto_id}`)

            const { stock, nombre } = stockResult.recordset[0]
            if (stock < cantidad)
                throw new Error(`Stock insuficiente para "${nombre}". Disponible: ${stock}`)

            // Insertar pedido con el grupo
            await new sql.Request(transaction)
                .input("usuario_id",   sql.Int,     usuario_id)
                .input("producto_id",  sql.Int,     producto_id)
                .input("cantidad",     sql.Int,     cantidad)
                .input("estado",       sql.VarChar, "Pendiente")
                .input("metodo_pago",  sql.VarChar, metodo_pago || "")
                .input("pedido_grupo", sql.VarChar, grupo)
                .query(`INSERT INTO pedidos (usuario_id, producto_id, cantidad, estado, metodo_pago, pedido_grupo)
                        VALUES (@usuario_id, @producto_id, @cantidad, @estado, @metodo_pago, @pedido_grupo)`)

            // Descontar stock
            await new sql.Request(transaction)
                .input("cantidad",    sql.Int, cantidad)
                .input("producto_id", sql.Int, producto_id)
                .query("UPDATE productos SET stock = stock - @cantidad WHERE id = @producto_id")
        }

        await transaction.commit()
        res.status(201).json({ mensaje: "Pedido confirmado correctamente", grupo })

    } catch (error) {
        await transaction.rollback()
        res.status(400).json({ mensaje: error.message })
    }
})

// Actualizar estado
router.patch("/:id/estado", async (req, res) => {
    const { estado } = req.body
    const estadosValidos = ["Pendiente", "En proceso", "Entregado"]
    if (!estadosValidos.includes(estado))
        return res.status(400).json({ mensaje: "Estado no valido" })
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id",     sql.Int,     req.params.id)
            .input("estado", sql.VarChar, estado)
            .query("UPDATE pedidos SET estado = @estado WHERE id = @id")
        res.json({ mensaje: "Estado actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar estado", error: error.message })
    }
})

router.put("/:id", async (req, res) => {
    const { usuario_id, producto_id, cantidad, estado, metodo_pago } = req.body
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id",          sql.Int,     req.params.id)
            .input("usuario_id",  sql.Int,     usuario_id)
            .input("producto_id", sql.Int,     producto_id)
            .input("cantidad",    sql.Int,     cantidad)
            .input("estado",      sql.VarChar, estado || "Pendiente")
            .input("metodo_pago", sql.VarChar, metodo_pago || "")
            .query(`UPDATE pedidos
                    SET usuario_id=@usuario_id, producto_id=@producto_id,
                        cantidad=@cantidad, estado=@estado, metodo_pago=@metodo_pago
                    WHERE id=@id`)
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