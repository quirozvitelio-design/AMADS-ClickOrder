const express = require("express")
const router  = express.Router()
const { sql } = require("../config/db")

// GET /api/configuracion — obtener datos de la empresa
router.get("/", async (req, res) => {
  try {
    const pool   = await sql.connect()
    const result = await pool.request()
      .query("SELECT TOP 1 * FROM configuracion_empresa ORDER BY id DESC")
    if (result.recordset.length === 0)
      return res.status(404).json({ mensaje: "No hay configuración registrada" })
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener configuración", error: err.message })
  }
})

// PUT /api/configuracion — actualizar datos de la empresa
router.put("/", async (req, res) => {
  const {
    nit, nrc, nombre, nombre_comercial,
    cod_actividad, desc_actividad,
    tipo_establecimiento, departamento, municipio,
    direccion, telefono, correo,
    cod_estable_mh, cod_punto_venta_mh
  } = req.body

  if (!nit || !nrc || !nombre)
    return res.status(400).json({ mensaje: "NIT, NRC y nombre son obligatorios" })

  try {
    const pool   = await sql.connect()
    const existe = await pool.request()
      .query("SELECT TOP 1 id FROM configuracion_empresa")

    if (existe.recordset.length > 0) {
      // Actualizar registro existente
      await pool.request()
        .input("nit",                  sql.VarChar, nit)
        .input("nrc",                  sql.VarChar, nrc)
        .input("nombre",               sql.VarChar, nombre)
        .input("nombre_comercial",     sql.VarChar, nombre_comercial || null)
        .input("cod_actividad",        sql.VarChar, cod_actividad || null)
        .input("desc_actividad",       sql.VarChar, desc_actividad || null)
        .input("tipo_establecimiento", sql.VarChar, tipo_establecimiento || "01")
        .input("departamento",         sql.VarChar, departamento || "12")
        .input("municipio",            sql.VarChar, municipio || "17")
        .input("direccion",            sql.VarChar, direccion || null)
        .input("telefono",             sql.VarChar, telefono || null)
        .input("correo",               sql.VarChar, correo || null)
        .input("cod_estable_mh",       sql.VarChar, cod_estable_mh || "M001")
        .input("cod_punto_venta_mh",   sql.VarChar, cod_punto_venta_mh || "P001")
        .input("fecha",                sql.DateTime, new Date())
        .query(`UPDATE configuracion_empresa
                SET nit                  = @nit,
                    nrc                  = @nrc,
                    nombre               = @nombre,
                    nombre_comercial     = @nombre_comercial,
                    cod_actividad        = @cod_actividad,
                    desc_actividad       = @desc_actividad,
                    tipo_establecimiento = @tipo_establecimiento,
                    departamento         = @departamento,
                    municipio            = @municipio,
                    direccion            = @direccion,
                    telefono             = @telefono,
                    correo               = @correo,
                    cod_estable_mh       = @cod_estable_mh,
                    cod_punto_venta_mh   = @cod_punto_venta_mh,
                    actualizado_en       = @fecha`)
    } else {
      // Crear primer registro
      await pool.request()
        .input("nit",                  sql.VarChar, nit)
        .input("nrc",                  sql.VarChar, nrc)
        .input("nombre",               sql.VarChar, nombre)
        .input("nombre_comercial",     sql.VarChar, nombre_comercial || null)
        .input("cod_actividad",        sql.VarChar, cod_actividad || null)
        .input("desc_actividad",       sql.VarChar, desc_actividad || null)
        .input("tipo_establecimiento", sql.VarChar, tipo_establecimiento || "01")
        .input("departamento",         sql.VarChar, departamento || "12")
        .input("municipio",            sql.VarChar, municipio || "17")
        .input("direccion",            sql.VarChar, direccion || null)
        .input("telefono",             sql.VarChar, telefono || null)
        .input("correo",               sql.VarChar, correo || null)
        .input("cod_estable_mh",       sql.VarChar, cod_estable_mh || "M001")
        .input("cod_punto_venta_mh",   sql.VarChar, cod_punto_venta_mh || "P001")
        .query(`INSERT INTO configuracion_empresa
                (nit, nrc, nombre, nombre_comercial, cod_actividad, desc_actividad,
                 tipo_establecimiento, departamento, municipio, direccion,
                 telefono, correo, cod_estable_mh, cod_punto_venta_mh)
                VALUES
                (@nit, @nrc, @nombre, @nombre_comercial, @cod_actividad, @desc_actividad,
                 @tipo_establecimiento, @departamento, @municipio, @direccion,
                 @telefono, @correo, @cod_estable_mh, @cod_punto_venta_mh)`)
    }

    res.json({ mensaje: "Configuración guardada correctamente" })
  } catch (err) {
    res.status(500).json({ mensaje: "Error al guardar configuración", error: err.message })
  }
})

module.exports = router