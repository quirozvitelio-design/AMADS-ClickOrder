const express = require("express")
const router  = express.Router()
const { sql } = require("../config/db")

// ── queryBase ─────────────────────────────────────────────────
const queryBase = `
    SELECT p.id, u.nombre AS usuario, u.id AS usuario_id,
           pr.nombre AS producto, pr.precio, p.cantidad,
           (pr.precio * p.cantidad) AS total,
           p.estado, p.metodo_pago, p.fecha,
           p.pedido_grupo, p.fecha_estado_actualizado
    FROM pedidos p
    INNER JOIN usuarios u   ON p.usuario_id  = u.id
    INNER JOIN productos pr ON p.producto_id = pr.id
`

// ── GET todos ─────────────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const pool   = await sql.connect()
        const result = await pool.request()
            .query(queryBase + " ORDER BY p.fecha DESC")
        res.json(result.recordset)
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener pedidos", error: error.message })
    }
})

// ── GET por usuario ───────────────────────────────────────────
router.get("/usuario/:usuario_id", async (req, res) => {
    try {
        const pool   = await sql.connect()
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

// ── GET por id ────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const pool   = await sql.connect()
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

// ── POST individual ───────────────────────────────────────────
router.post("/", async (req, res) => {
    const { usuario_id, producto_id, metodo_pago } = req.body
    const cantidad = parseInt(req.body.cantidad) || 1
    try {
        const pool        = await sql.connect()
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
            .input("estado",       sql.VarChar, "Recibido")
            .input("metodo_pago",  sql.VarChar, metodo_pago || "")
            .query(`INSERT INTO pedidos (usuario_id, producto_id, cantidad, estado, metodo_pago)
                    VALUES (@usuario_id, @producto_id, @cantidad, @estado, @metodo_pago)`)

        await pool.request()
            .input("cantidad",    sql.Int, cantidad)
            .input("producto_id", sql.Int, producto_id)
            .query("UPDATE productos SET stock = stock - @cantidad WHERE id = @producto_id")

        res.status(201).json({ mensaje: "Pedido creado correctamente" })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear pedido", error: error.message })
    }
})

// ── POST /carrito — confirmar pedido + generar factura ────────
router.post("/carrito", async (req, res) => {
    const { usuario_id, items, metodo_pago } = req.body

    if (!items || items.length === 0)
        return res.status(400).json({ mensaje: "El carrito está vacío" })

    if (!metodo_pago || metodo_pago.trim() === "")
        return res.status(400).json({ mensaje: "Debes seleccionar un método de pago" })

    const pool        = await sql.connect()
    const transaction = new sql.Transaction(pool)

    try {
        await transaction.begin()

        const grupo    = `ORD-${Date.now()}-${usuario_id}`
        const fechaEst = new Date()

        // ── 1. Insertar cada item y descontar stock ───────────
        for (const item of items) {
            const { producto_id, cantidad } = item

            const stockResult = await new sql.Request(transaction)
                .input("producto_id", sql.Int, producto_id)
                .query("SELECT stock, nombre FROM productos WHERE id = @producto_id")

            if (stockResult.recordset.length === 0)
                throw new Error(`Producto no encontrado: ID ${producto_id}`)

            const { stock, nombre } = stockResult.recordset[0]
            if (stock < cantidad)
                throw new Error(`Stock insuficiente para "${nombre}". Disponible: ${stock}`)

            await new sql.Request(transaction)
                .input("usuario_id",   sql.Int,      usuario_id)
                .input("producto_id",  sql.Int,      producto_id)
                .input("cantidad",     sql.Int,      cantidad)
                .input("estado",       sql.VarChar,  "Recibido")
                .input("metodo_pago",  sql.VarChar,  metodo_pago)
                .input("pedido_grupo", sql.VarChar,  grupo)
                .input("fecha_estado", sql.DateTime, fechaEst)
                .query(`INSERT INTO pedidos
                        (usuario_id, producto_id, cantidad, estado, metodo_pago, pedido_grupo, fecha_estado_actualizado)
                        VALUES (@usuario_id, @producto_id, @cantidad, @estado, @metodo_pago, @pedido_grupo, @fecha_estado)`)

            await new sql.Request(transaction)
                .input("cantidad",    sql.Int, cantidad)
                .input("producto_id", sql.Int, producto_id)
                .query("UPDATE productos SET stock = stock - @cantidad WHERE id = @producto_id")
        }

        await transaction.commit()

        // ── 2. Generar factura automáticamente ────────────────
        let facturaInfo = null
        try {
            facturaInfo = await generarFacturaAutomatica(pool, grupo, usuario_id, metodo_pago)
        } catch (facturaErr) {
            // La factura falla silenciosamente — el pedido ya quedó guardado
            console.error("Factura no generada:", facturaErr.message)
        }

        res.status(201).json({
            mensaje:  "Pedido confirmado correctamente",
            grupo,
            factura:  facturaInfo
        })

    } catch (error) {
        await transaction.rollback()
        res.status(400).json({ mensaje: error.message })
    }
})

// ── PATCH estado — unidireccional 4 estados ───────────────────
router.patch("/:id/estado", async (req, res) => {
    const estadoRaw = req.body.estado || ""
    const estado    = estadoRaw.trim()

    const estadosValidos = [
        "Recibido",
        "Preparando",
        "En camino/Listo para retirar",
        "Entregado"
    ]

    const estadoNorm = estadosValidos.find(e =>
        estado === e || estado.endsWith(e)
    )

    if (!estadoNorm) {
        return res.status(400).json({
            mensaje:  "Estado no válido",
            recibido: estado,
            validos:  estadosValidos
        })
    }

    try {
        const pool   = await sql.connect()
        const actual = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("SELECT estado FROM pedidos WHERE id = @id")

        if (actual.recordset.length === 0)
            return res.status(404).json({ mensaje: "Pedido no encontrado" })

        const estadoActual = (actual.recordset[0].estado || "").trim()
        const idxActual    = estadosValidos.indexOf(estadoActual)
        const idxNuevo     = estadosValidos.indexOf(estadoNorm)

        if (idxNuevo < idxActual) {
            return res.status(400).json({
                mensaje: `No puedes retroceder el estado. Estado actual: ${estadoActual}`
            })
        }

        await pool.request()
            .input("estado", sql.VarChar,  estadoNorm)
            .input("fecha",  sql.DateTime, new Date())
            .input("id",     sql.Int,      req.params.id)
            .query(`UPDATE pedidos
                    SET estado = @estado, fecha_estado_actualizado = @fecha
                    WHERE id = @id`)

        res.json({ mensaje: "Estado actualizado correctamente" })
    } catch (err) {
        res.status(500).json({ mensaje: "Error al actualizar estado", error: err.message })
    }
})

// ── PUT actualizar pedido ─────────────────────────────────────
router.put("/:id", async (req, res) => {
    const { usuario_id, producto_id, cantidad, estado, metodo_pago } = req.body
    try {
        const pool = await sql.connect()
        await pool.request()
            .input("id",          sql.Int,     req.params.id)
            .input("usuario_id",  sql.Int,     usuario_id)
            .input("producto_id", sql.Int,     producto_id)
            .input("cantidad",    sql.Int,     cantidad)
            .input("estado",      sql.VarChar, estado || "Recibido")
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

// ── DELETE ────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════
// FUNCIÓN PRIVADA: genera la factura al confirmar el pedido
// ═══════════════════════════════════════════════════════════
async function generarFacturaAutomatica(pool, grupo, usuario_id, metodo_pago) {

    // Leer configuración del emisor
    const cfgResult = await pool.request()
        .query("SELECT TOP 1 * FROM configuracion_empresa ORDER BY id DESC")
    if (cfgResult.recordset.length === 0)
        throw new Error("Sin configuración de empresa")
    const cfg = cfgResult.recordset[0]

    // Leer items del pedido + datos del usuario (receptor)
    const pedidos = await pool.request()
        .input("grupo", sql.VarChar, grupo)
        .query(`
            SELECT p.cantidad, pr.nombre AS producto, pr.precio,
                   (pr.precio * p.cantidad) AS subtotal,
                   u.nombre AS cliente, u.correo,
                   u.nit, u.nrc, u.telefono, u.direccion,
                   u.departamento, u.municipio,
                   u.cod_actividad, u.desc_actividad, u.nombre_comercial
            FROM pedidos p
            INNER JOIN productos pr ON p.producto_id = pr.id
            INNER JOIN usuarios  u  ON p.usuario_id  = u.id
            WHERE p.pedido_grupo = @grupo
        `)

    if (pedidos.recordset.length === 0)
        throw new Error("No se encontraron items del pedido")

    const items    = pedidos.recordset
    const subtotal = items.reduce((s, i) => s + parseFloat(i.subtotal), 0)
    const iva      = parseFloat((subtotal * 0.13).toFixed(2))
    const total    = parseFloat((subtotal + iva).toFixed(2))
    const u        = items[0]

    // Número correlativo
    const contResult     = await pool.request().query("SELECT COUNT(*) AS total FROM facturas")
    const correlativo    = contResult.recordset[0].total + 1
    const numero_factura = `FAC-${String(correlativo).padStart(4, "0")}`

    // Código generación UUID
    const codigoGen = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16).toUpperCase()
    })
    const numControl    = `DTE-01-M001P001-${String(correlativo).padStart(15, "0")}`
    const selloRecibido = Array.from({ length: 40 }, () =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
    ).join("")

    const ahora = new Date()

    // ── Armar DTE estructura MH El Salvador ──────────────────
    const dte = {
        identificacion: {
            version:          1,
            ambiente:         "01",
            tipoDte:          "01",
            numeroControl:    numControl,
            codigoGeneracion: codigoGen,
            tipoModelo:       1,
            tipoOperacion:    1,
            tipoContingencia: null,
            motivoContin:     null,
            fecEmi:           ahora.toISOString().split("T")[0],
            horEmi:           ahora.toTimeString().slice(0, 8),
            tipoMoneda:       "USD"
        },
        documentoRelacionado: null,
        emisor: {
            nit:                 cfg.nit,
            nrc:                 cfg.nrc,
            nombre:              cfg.nombre,
            codActividad:        cfg.cod_actividad  || "47191",
            descActividad:       cfg.desc_actividad || "Comercio al por menor",
            nombreComercial:     cfg.nombre_comercial || cfg.nombre,
            tipoEstablecimiento: cfg.tipo_establecimiento || "01",
            direccion: {
                departamento: cfg.departamento || "12",
                municipio:    cfg.municipio    || "17",
                complemento:  cfg.direccion    || "El Salvador"
            },
            telefono:        cfg.telefono || "",
            correo:          cfg.correo   || "",
            codEstableMH:    cfg.cod_estable_mh     || "M001",
            codEstable:      null,
            codPuntoVentaMH: cfg.cod_punto_venta_mh || "P001",
            codPuntoVenta:   null
        },
        receptor: {
            tipoDocumento:   u.nit ? "36" : "13",
            numDocumento:    u.nit || "00000000-0",
            nrc:             u.nrc || null,
            nombre:          u.cliente,
            codActividad:    u.cod_actividad    || null,
            descActividad:   u.desc_actividad   || null,
            nombreComercial: u.nombre_comercial || null,
            direccion: {
                departamento: u.departamento || "12",
                municipio:    u.municipio    || "17",
                complemento:  u.direccion    || "El Salvador"
            },
            telefono: u.telefono || "-",
            correo:   u.correo
        },
        otrosDocumentos: null,
        ventaTercero:    null,
        cuerpoDocumento: items.map((item, idx) => ({
            numItem:         idx + 1,
            tipoItem:        2,
            numeroDocumento: null,
            codigo:          null,
            codTributo:      null,
            descripcion:     item.producto,
            cantidad:        item.cantidad,
            uniMedida:       59,
            precioUni:       parseFloat(item.precio),
            montoDescu:      0,
            ventaNoSuj:      0,
            ventaExenta:     0,
            ventaGravada:    parseFloat(item.subtotal),
            tributos:        ["20"],
            psv:             0,
            noGravado:       0
        })),
        resumen: {
            totalNoSuj:          0,
            totalExenta:         0,
            totalGravada:        subtotal,
            subTotalVentas:      subtotal,
            descuNoSuj:          0,
            descuExenta:         0,
            descuGravada:        0,
            porcentajeDescuento: 0,
            totalDescu:          0,
            tributos: [{
                codigo:      "20",
                descripcion: "Impuesto al Valor Agregado 13%",
                valor:       iva
            }],
            subTotal:            subtotal,
            ivaPerci1:           0,
            ivaRete1:            0,
            reteRenta:           0,
            montoTotalOperacion: total,
            totalNoGravado:      0,
            totalPagar:          total,
            totalLetras:         numberToWords(total),
            saldoFavor:          0,
            condicionOperacion:  1,
            pagos: [{
                codigo:     metodo_pago === "Efectivo" ? "01" : "02",
                montoPago:  total,
                plazo:      null,
                referencia: metodo_pago,
                periodo:    null
            }],
            numPagoElectronico: null
        },
        extension: {
            nombEntrega:   cfg.nombre,
            docuEntrega:   cfg.nit,
            nombRecibe:    u.cliente,
            docuRecibe:    u.nit || "00000000-0",
            observaciones: "PAGADO",
            placaVehiculo: null
        },
        apendice:       null,
        selloRecibido
    }

    // Guardar factura en BD
    await pool.request()
        .input("pedido_grupo",   sql.VarChar,      grupo)
        .input("numero_factura", sql.VarChar,       numero_factura)
        .input("usuario_id",     sql.Int,           usuario_id)
        .input("total",          sql.Decimal(10,2), total)
        .input("datos_json",     sql.NVarChar,      JSON.stringify(dte))
        .query(`INSERT INTO facturas (pedido_grupo, numero_factura, usuario_id, total, datos_json)
                VALUES (@pedido_grupo, @numero_factura, @usuario_id, @total, @datos_json)`)

    return { numero_factura, total: total.toFixed(2) }
}

// ── Helper: número a letras ───────────────────────────────────
function numberToWords(num) {
    const unidades = ["","UN","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE",
        "DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE"]
    const decenas  = ["","","VEINTE","TREINTA","CUARENTA","CINCUENTA","SESENTA","SETENTA","OCHENTA","NOVENTA"]
    const centenas = ["","CIEN","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
        "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"]
    function menorMil(n) {
        if (n === 0)   return ""
        if (n < 20)    return unidades[n]
        if (n < 100)   return decenas[Math.floor(n/10)] + (n%10 ? " Y " + unidades[n%10] : "")
        if (n === 100) return "CIEN"
        return centenas[Math.floor(n/100)] + (n%100 ? " " + menorMil(n%100) : "")
    }
    const entero  = Math.floor(num)
    const decimal = Math.round((num - entero) * 100)
    let texto = entero >= 1000
        ? (Math.floor(entero/1000) === 1 ? "MIL" : menorMil(Math.floor(entero/1000)) + " MIL") +
          (entero%1000 ? " " + menorMil(entero%1000) : "")
        : menorMil(entero)
    return `${texto.trim()} DÓLARES CON ${String(decimal).padStart(2,"0")}/100`
}

module.exports = router