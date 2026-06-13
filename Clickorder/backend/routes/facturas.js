const express     = require("express")
const router      = express.Router()
const { sql }     = require("../config/db")
const PDFDocument = require("pdfkit")
const IVA = 0.13

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function generarCodigo() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16).toUpperCase()
  })
}

function generarNumeroControl(correlativo) {
  return `DTE-01-M001P001-${String(correlativo).padStart(15, "0")}`
}

function generarSello() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length: 40 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("")
}

function numberToWords(num) {
  const unidades = [
    "", "UN", "DOS", "TRES", "CUATRO", "CINCO",
    "SEIS", "SIETE", "OCHO", "NUEVE",
    "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE",
    "QUINCE", "DIECISÉIS", "DIECISIETE",
    "DIECIOCHO", "DIECINUEVE"
  ]
  const decenas = [
    "", "", "VEINTE", "TREINTA", "CUARENTA",
    "CINCUENTA", "SESENTA", "SETENTA",
    "OCHENTA", "NOVENTA"
  ]
  const centenas = [
    "", "CIEN", "DOSCIENTOS", "TRESCIENTOS",
    "CUATROCIENTOS", "QUINIENTOS",
    "SEISCIENTOS", "SETECIENTOS",
    "OCHOCIENTOS", "NOVECIENTOS"
  ]
  function menorMil(n) {
    if (n === 0) return ""
    if (n < 20)  return unidades[n]
    if (n < 100) return decenas[Math.floor(n/10)] + (n%10 ? " Y " + unidades[n%10] : "")
    if (n === 100) return "CIEN"
    return centenas[Math.floor(n/100)] + (n%100 ? " " + menorMil(n%100) : "")
  }
  const entero  = Math.floor(num)
  const decimal = Math.round((num - entero) * 100)
  let texto = ""
  if (entero >= 1000) {
    const miles = Math.floor(entero / 1000)
    texto += miles === 1 ? "MIL" : menorMil(miles) + " MIL"
    if (entero % 1000) texto += " " + menorMil(entero % 1000)
  } else {
    texto = menorMil(entero)
  }
  return `${texto.trim()} DÓLARES CON ${String(decimal).padStart(2, "0")}/100`
}

// ─────────────────────────────────────────────
// GET /api/facturas
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const pool   = await sql.connect()
    const result = await pool.request().query(`
      SELECT f.id, f.pedido_grupo, f.numero_factura,
             f.fecha_emision, f.total,
             u.nombre AS cliente, u.correo
      FROM facturas f
      INNER JOIN usuarios u ON f.usuario_id = u.id
      ORDER BY f.fecha_emision DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener facturas", error: err.message })
  }
})

// ─────────────────────────────────────────────
// GET /api/facturas/pedido/:pedido_grupo
// ─────────────────────────────────────────────
router.get("/pedido/:pedido_grupo", async (req, res) => {
  try {
    const pool   = await sql.connect()
    const result = await pool.request()
      .input("grupo", sql.VarChar, req.params.pedido_grupo)
      .query("SELECT id, numero_factura, fecha_emision, total FROM facturas WHERE pedido_grupo = @grupo")
    res.json(result.recordset.length ? result.recordset[0] : null)
  } catch (err) {
    res.status(500).json({ mensaje: "Error al buscar factura", error: err.message })
  }
})

// ─────────────────────────────────────────────
// POST /api/facturas/:pedido_grupo
// CORRECCIÓN: query de usuarios solo pide columnas que existen
// ─────────────────────────────────────────────
router.post("/:pedido_grupo", async (req, res) => {
  const { pedido_grupo } = req.params

  try {
    const pool = await sql.connect()

    // Verificar duplicado
    const existe = await pool.request()
      .input("grupo", sql.VarChar, pedido_grupo)
      .query("SELECT id FROM facturas WHERE pedido_grupo = @grupo")

    if (existe.recordset.length > 0)
      return res.status(400).json({ mensaje: "Ya existe una factura para esta orden" })

    // Configuración empresa
    const cfgResult = await pool.request()
      .query("SELECT TOP 1 * FROM configuracion_empresa ORDER BY id DESC")

    if (!cfgResult.recordset.length)
      return res.status(400).json({ mensaje: "Configure primero los datos de empresa en Configuración" })

    const cfg = cfgResult.recordset[0]

    // CORRECCIÓN: solo columnas que existen en la tabla usuarios
    const pedidos = await pool.request()
      .input("grupo", sql.VarChar, pedido_grupo)
      .query(`
        SELECT
          p.id,
          p.usuario_id,
          p.cantidad,
          p.metodo_pago,
          p.fecha,
          pr.nombre  AS producto,
          pr.precio,
          u.nombre   AS cliente,
          u.correo
        FROM pedidos p
        INNER JOIN productos pr ON p.producto_id = pr.id
        INNER JOIN usuarios  u  ON p.usuario_id  = u.id
        WHERE p.pedido_grupo = @grupo
      `)

    if (!pedidos.recordset.length)
      return res.status(404).json({ mensaje: "Pedido no encontrado" })

    const items    = pedidos.recordset
    const total = Number(items.reduce((sum, item) => sum + Number(item.precio) * Number(item.cantidad), 0).toFixed(2))
    const subtotal = Number((total - (total * IVA)).toFixed(2))
    const iva = Number((total - subtotal).toFixed(2))
    const usuario_id = items[0].usuario_id

    // Correlativo
    const contResult     = await pool.request().query("SELECT COUNT(*) AS total FROM facturas")
    const correlativo    = contResult.recordset[0].total + 1
    const numero_factura = `FAC-${String(correlativo).padStart(4, "0")}`
    const codigoGeneracion = generarCodigo()
    const numeroControl    = generarNumeroControl(correlativo)
    const selloRecibido    = generarSello()
    const ahora            = new Date()

    const dte = {
      identificacion: {
        version: 1, ambiente: "01", tipoDte: "01",
        numeroControl, codigoGeneracion,
        tipoModelo: 1, tipoOperacion: 1,
        fecEmi: ahora.toISOString().split("T")[0],
        horEmi: ahora.toTimeString().slice(0, 8),
        tipoMoneda: "USD"
      },
      emisor: {
        nit:                 cfg.nit,
        nrc:                 cfg.nrc,
        nombre:              cfg.nombre,
        nombreComercial:     cfg.nombre_comercial || cfg.nombre,
        codActividad:        cfg.cod_actividad    || "47191",
        descActividad:       cfg.desc_actividad   || "Comercio al por menor",
        telefono:            cfg.telefono         || "",
        correo:              cfg.correo           || "",
        tipoEstablecimiento: cfg.tipo_establecimiento || "01",
        direccion: {
          departamento: cfg.departamento || "12",
          municipio:    cfg.municipio    || "17",
          complemento:  cfg.direccion    || "El Salvador"
        },
        codEstableMH:    cfg.cod_estable_mh     || "M001",
        codPuntoVentaMH: cfg.cod_punto_venta_mh || "P001"
      },
      receptor: {
        tipoDocumento: "13",
        numDocumento:  "00000000-0",
        nombre:        items[0].cliente,
        correo:        items[0].correo || "",
        telefono:      "-",
        direccion: {
          departamento: "12",
          municipio:    "17",
          complemento:  "El Salvador"
        }
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
        cantidad:        Number(item.cantidad),
        uniMedida:       59,
        precioUni:       Number(item.precio),
        montoDescu:      0,
        ventaNoSuj:      0,
        ventaExenta:     0,
        ventaGravada:    Number(((Number(item.precio) * Number(item.cantidad)) / 1.13).toFixed(2)),        
        tributos:        ["20"],
        psv:             0,
        noGravado:       0
      })),
      resumen: {
        totalNoSuj: 0, totalExenta: 0,
        totalGravada:   subtotal,
        subTotalVentas: subtotal,
        descuNoSuj: 0, descuExenta: 0, descuGravada: 0,
        porcentajeDescuento: 0, totalDescu: 0,
        tributos: [{ codigo: "20", descripcion: "Impuesto al Valor Agregado 13%", valor: iva }],
        subTotal: subtotal,
        ivaPerci1: 0, ivaRete1: 0, reteRenta: 0,
        montoTotalOperacion: total,
        totalNoGravado: 0,
        totalPagar:     total,
        totalLetras:    numberToWords(total),
        saldoFavor:     0,
        condicionOperacion: 1,
        pagos: [{
          codigo:     items[0].metodo_pago === "Efectivo" ? "01" : "02",
          montoPago:  total,
          referencia: items[0].metodo_pago || "Efectivo",
          plazo: null, periodo: null
        }],
        numPagoElectronico: null
      },
      extension: {
        nombEntrega:   cfg.nombre,
        docuEntrega:   cfg.nit,
        nombRecibe:    items[0].cliente,
        docuRecibe:    "00000000-0",
        observaciones: "PAGADO",
        placaVehiculo: null
      },
      apendice:       null,
      selloRecibido
    }

    await pool.request()
      .input("pedido_grupo",   sql.VarChar,      pedido_grupo)
      .input("numero_factura", sql.VarChar,       numero_factura)
      .input("usuario_id",     sql.Int,           usuario_id)
      .input("total",          sql.Decimal(10,2), total)
      .input("datos_json",     sql.NVarChar,      JSON.stringify(dte))
      .query(`INSERT INTO facturas (pedido_grupo, numero_factura, usuario_id, total, datos_json)
              VALUES (@pedido_grupo, @numero_factura, @usuario_id, @total, @datos_json)`)

    res.status(201).json({ mensaje: "Factura generada correctamente", numero_factura, total: total.toFixed(2) })

  } catch (err) {
    res.status(500).json({ mensaje: "Error al generar factura", error: err.message })
  }
})

// ─────────────────────────────────────────────
// GET /api/facturas/:id/pdf
// ─────────────────────────────────────────────
router.get("/:id/pdf", async (req, res) => {
  try {
    const pool   = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM facturas WHERE id = @id")

    if (result.recordset.length === 0)
      return res.status(404).json({ mensaje: "Factura no encontrada" })

    const factura = result.recordset[0]
    const dte     = JSON.parse(factura.datos_json)
    const { identificacion, emisor, receptor, cuerpoDocumento, resumen, extension } = dte

    const doc = new PDFDocument({ margin: 30, size: "A4" })
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `inline; filename="${factura.numero_factura}.pdf"`)
    doc.pipe(res)

    const W = 535
    const L = 30

    // Header azul
    doc.rect(L, 30, W, 18).fill("#1D4E89")
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#FFFFFF")
       .text("DOCUMENTO TRIBUTARIO ELECTRÓNICO", L, 35, { width: W, align: "center" })
    doc.rect(L, 48, W, 2).fill("#1D9E75")

    doc.fontSize(7).font("Helvetica").fillColor("#333333")
    doc.text("Número de Control:",  L,       58)
    doc.text(identificacion.numeroControl, L + 90, 58)
    doc.text("Código Generación:",  L,       68)
    doc.text(identificacion.codigoGeneracion, L + 90, 68)
    doc.text("Fecha y Hora:",       L + 310, 58)
    doc.text(`${identificacion.fecEmi} ${identificacion.horEmi}`, L + 390, 58)
    doc.text("Sello Recepción:",    L + 310, 68)
    doc.text(dte.selloRecibido || "-", L + 390, 68)

    doc.rect(L, 84, W, 1).fill("#D9D9D9")

    // EMISOR / RECEPTOR
    const mitad = W / 2
    doc.rect(L, 92, mitad - 2, 14).fill("#EAF2FB")
    doc.rect(L + mitad + 2, 92, mitad - 2, 14).fill("#EAF2FB")
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#1D4E89")
       .text("EMISOR",   L,          97, { width: mitad, align: "center" })
       .text("RECEPTOR", L + mitad,  97, { width: mitad, align: "center" })

    const eY = 115
    const datosEmisor = [
      ["Razón Social",     emisor.nombre],
      ["Nombre Comercial", emisor.nombreComercial || "-"],
      ["NIT",              emisor.nit],
      ["NRC",              emisor.nrc],
      ["Actividad",        emisor.descActividad],
      ["Dirección",        emisor.direccion?.complemento || "-"],
      ["Correo",           emisor.correo || "-"],
      ["Teléfono",         emisor.telefono || "-"]
    ]
    datosEmisor.forEach(([label, value], i) => {
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#000").text(`${label}:`, L, eY + i * 10)
      doc.font("Helvetica").text(value, L + 65, eY + i * 10, { width: 170 })
    })

    const rX = L + mitad + 8
    const datosReceptor = [
      ["Cliente",    receptor.nombre],
      ["Documento",  receptor.numDocumento],
      ["Correo",     receptor.correo    || "-"],
      ["Teléfono",   receptor.telefono  || "-"],
      ["Dirección",  receptor.direccion?.complemento || "-"]
    ]
    datosReceptor.forEach(([label, value], i) => {
      doc.fontSize(7).font("Helvetica-Bold").text(`${label}:`, rX, eY + i * 10)
      doc.font("Helvetica").text(value, rX + 60, eY + i * 10, { width: 160 })
    })

    // TABLA PRODUCTOS
    let y = eY + 95
    doc.rect(L, y, W, 18).fill("#1D4E89")
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFF")
    doc.text("#",           L + 5,   y + 6)
    doc.text("DESCRIPCIÓN", L + 35,  y + 6)
    doc.text("CANTIDAD",    L + 255, y + 6)
    doc.text("PRECIO",      L + 335, y + 6)
    doc.text("SUBTOTAL",    L + 425, y + 6)
    y += 18

    cuerpoDocumento.forEach((item, index) => {
      doc.rect(L, y, W, 18).fill(index % 2 === 0 ? "#F7FBFF" : "#FFFFFF")
      doc.fillColor("#000").font("Helvetica").fontSize(7)
      doc.text(item.numItem.toString(),                          L + 8,   y + 5)
      doc.text(item.descripcion,                                 L + 35,  y + 5, { width: 190 })
      doc.text(item.cantidad.toString(),                         L + 265, y + 5)
      doc.text(`$${Number(item.precioUni).toFixed(2)}`,          L + 335, y + 5)
      doc.text(`$${Number(item.ventaGravada).toFixed(2)}`,       L + 430, y + 5)
      y += 18
    })

    // TOTALES
    y += 12
    const totalX = 340
    const filasTotales = [
      ["Subtotal:", resumen.subTotalVentas],
      ["IVA (13%):", resumen.tributos[0]?.valor || 0],
      ["TOTAL:", resumen.totalPagar]
    ]
    filasTotales.forEach(([label, value], i) => {
      const bold = label === "TOTAL:"
      doc.font(bold ? "Helvetica-Bold" : "Helvetica")
         .fontSize(bold ? 9 : 8)
         .fillColor(bold ? "#1D4E89" : "#000")
      doc.text(label, totalX, y + i * 15)
      doc.text(`$${Number(value).toFixed(2)}`, totalX + 95, y + i * 15, { width: 80, align: "right" })
    })

    y += 60
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#000").text("SON:", L, y)
    doc.font("Helvetica").text(resumen.totalLetras, L + 35, y, { width: 430 })
    y += 18
    doc.font("Helvetica-Bold").text("Observación:", L, y)
    doc.font("Helvetica").text(extension?.observaciones || "PAGADO", L + 70, y)
    y += 20
    doc.rect(L, y, W, 2).fill("#1D9E75")
    y += 8
    doc.fontSize(6).fillColor("#666")
       .text(`${emisor.nombre} | ${factura.numero_factura}`, L, y, { width: W, align: "center" })

    doc.end()

  } catch (err) {
    res.status(500).json({ mensaje: "Error al generar PDF", error: err.message })
  }
})

// ─────────────────────────────────────────────
// GET /api/facturas/:id/json
// ─────────────────────────────────────────────
router.get("/:id/json", async (req, res) => {
  try {
    const pool   = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM facturas WHERE id = @id")

    if (result.recordset.length === 0)
      return res.status(404).json({ mensaje: "Factura no encontrada" })

    const factura = result.recordset[0]
    res.setHeader("Content-Type", "application/json")
    res.setHeader("Content-Disposition", `attachment; filename="${factura.numero_factura}.json"`)
    res.send(JSON.stringify(JSON.parse(factura.datos_json), null, 2))

  } catch (err) {
    res.status(500).json({ mensaje: "Error al descargar JSON", error: err.message })
  }
})

// ─────────────────────────────────────────────
// DELETE /api/facturas/:id
// ─────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const pool = await sql.connect()
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM facturas WHERE id = @id")
    res.json({ mensaje: "Factura eliminada correctamente" })
  } catch (err) {
    res.status(500).json({ mensaje: "Error al eliminar factura", error: err.message })
  }
})

module.exports = router