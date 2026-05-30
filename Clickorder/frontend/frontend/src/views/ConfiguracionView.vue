<template>
  <div class="page-root">
    <div class="bg-grid"></div>
    <div class="page-content">

      <div class="page-header">
        <div>
          <h1 class="page-title">Configuración</h1>
          <p class="page-sub">Datos del emisor para facturas electrónicas (DTE)</p>
        </div>
        <div class="header-badge">
          <span>🏢 Datos del negocio</span>
        </div>
      </div>

      <!-- BANNER ÉXITO -->
      <transition name="fade">
        <div v-if="guardado" class="success-banner">
          ✅ Configuración guardada correctamente. Las nuevas facturas usarán estos datos.
        </div>
      </transition>

      <!-- BANNER ERROR -->
      <transition name="fade">
        <div v-if="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>
      </transition>

      <div class="form-grid">

        <!-- ── DATOS FISCALES ── -->
        <div class="seccion-card">
          <h2 class="seccion-titulo">🔐 Datos Fiscales</h2>
          <p class="seccion-sub">Aparecen en la sección EMISOR de cada factura</p>

          <div class="fields-col">
            <div class="field">
              <label>NIT del negocio *</label>
              <input v-model="form.nit" type="text" placeholder="06141806941027" />
              <span class="field-hint">Sin guiones ni espacios</span>
            </div>
            <div class="field">
              <label>NRC *</label>
              <input v-model="form.nrc" type="text" placeholder="123456-7" />
            </div>
            <div class="field">
              <label>Nombre o razón social *</label>
              <input v-model="form.nombre" type="text" placeholder="ClickOrder S.A. de C.V." />
            </div>
            <div class="field">
              <label>Nombre comercial</label>
              <input v-model="form.nombre_comercial" type="text" placeholder="ClickOrder — E-commerce Local" />
            </div>
            <div class="field">
              <label>Código de actividad económica</label>
              <input v-model="form.cod_actividad" type="text" placeholder="47191" />
            </div>
            <div class="field">
              <label>Descripción de actividad</label>
              <input v-model="form.desc_actividad" type="text" placeholder="Comercio al por menor de productos varios" />
            </div>
          </div>
        </div>

        <!-- ── DATOS DE CONTACTO ── -->
        <div class="seccion-card">
          <h2 class="seccion-titulo">📍 Contacto y Ubicación</h2>
          <p class="seccion-sub">Dirección y medios de contacto del emisor</p>

          <div class="fields-col">
            <div class="field">
              <label>Departamento (código MH)</label>
              <select v-model="form.departamento">
                <option value="01">01 — Ahuachapán</option>
                <option value="02">02 — Santa Ana</option>
                <option value="03">03 — Sonsonate</option>
                <option value="04">04 — Chalatenango</option>
                <option value="05">05 — La Libertad</option>
                <option value="06">06 — San Salvador</option>
                <option value="07">07 — Cuscatlán</option>
                <option value="08">08 — La Paz</option>
                <option value="09">09 — Cabañas</option>
                <option value="10">10 — San Vicente</option>
                <option value="11">11 — Usulután</option>
                <option value="12">12 — San Miguel</option>
                <option value="13">13 — Morazán</option>
                <option value="14">14 — La Unión</option>
              </select>
            </div>
            <div class="field">
              <label>Dirección completa</label>
              <input v-model="form.direccion" type="text" placeholder="7ª Av. Sur, 104, San Miguel" />
            </div>
            <div class="field">
              <label>Teléfono</label>
              <input v-model="form.telefono" type="text" placeholder="7000-0000" />
            </div>
            <div class="field">
              <label>Correo electrónico</label>
              <input v-model="form.correo" type="email" placeholder="facturacion@minegocio.com" />
            </div>
            <div class="field">
              <label>Código establecimiento MH</label>
              <input v-model="form.cod_estable_mh" type="text" placeholder="M001" />
              <span class="field-hint">Asignado por el Ministerio de Hacienda</span>
            </div>
            <div class="field">
              <label>Código punto de venta MH</label>
              <input v-model="form.cod_punto_venta_mh" type="text" placeholder="P001" />
            </div>
          </div>
        </div>

      </div>

      <!-- BOTÓN GUARDAR -->
      <div class="form-actions">
        <button class="btn-guardar" @click="guardar" :disabled="guardando">
          {{ guardando ? '⏳ Guardando...' : '💾 Guardar configuración' }}
        </button>
      </div>

      <!-- PREVIEW -->
      <div v-if="form.nit" class="preview-card">
        <h3 class="preview-titulo">👁 Vista previa — Emisor en la factura</h3>
        <div class="preview-grid">
          <div class="preview-row"><span class="pl">Nombre o razón social:</span><span class="pv">{{ form.nombre || '—' }}</span></div>
          <div class="preview-row"><span class="pl">Nombre Comercial:</span><span class="pv">{{ form.nombre_comercial || '—' }}</span></div>
          <div class="preview-row"><span class="pl">NIT:</span><span class="pv">{{ form.nit || '—' }}</span></div>
          <div class="preview-row"><span class="pl">NRC:</span><span class="pv">{{ form.nrc || '—' }}</span></div>
          <div class="preview-row"><span class="pl">Actividad económica:</span><span class="pv">{{ form.desc_actividad || '—' }}</span></div>
          <div class="preview-row"><span class="pl">Dirección:</span><span class="pv">{{ form.direccion || '—' }}</span></div>
          <div class="preview-row"><span class="pl">Teléfono:</span><span class="pv">{{ form.telefono || '—' }}</span></div>
          <div class="preview-row"><span class="pl">Correo:</span><span class="pv">{{ form.correo || '—' }}</span></div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../api/axios"

const guardando = ref(false)
const guardado  = ref(false)
const errorMsg  = ref("")

const form = ref({
  nit:                  "",
  nrc:                  "",
  nombre:               "",
  nombre_comercial:     "",
  cod_actividad:        "",
  desc_actividad:       "",
  tipo_establecimiento: "01",
  departamento:         "12",
  municipio:            "17",
  direccion:            "",
  telefono:             "",
  correo:               "",
  cod_estable_mh:       "M001",
  cod_punto_venta_mh:   "P001"
})

async function cargar() {
  try {
    const res = await api.get("/configuracion")
    if (res.data) {
      Object.keys(form.value).forEach(k => {
        if (res.data[k] !== undefined && res.data[k] !== null)
          form.value[k] = res.data[k]
      })
    }
  } catch { /* sin configuración previa, usar valores por defecto */ }
}

async function guardar() {
  if (!form.value.nit || !form.value.nrc || !form.value.nombre) {
    errorMsg.value = "NIT, NRC y nombre son obligatorios"
    setTimeout(() => { errorMsg.value = "" }, 3000)
    return
  }
  guardando.value = true
  try {
    await api.put("/configuracion", form.value)
    guardado.value = true
    setTimeout(() => { guardado.value = false }, 4000)
  } catch (err) {
    errorMsg.value = err.response?.data?.mensaje || "Error al guardar"
    setTimeout(() => { errorMsg.value = "" }, 3000)
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

.page-root    { min-height: 100vh; background: var(--bg-base); font-family: 'DM Sans', sans-serif; position: relative; }
.bg-grid      { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 100%); }
.page-content { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.page-header  { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title   { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.page-sub     { font-size: 14px; color: var(--text-muted); }
.header-badge { background: rgba(29,158,117,0.12); border: 1px solid rgba(29,158,117,0.3); border-radius: 12px; padding: 8px 16px; font-size: 13px; font-weight: 600; color: #1D9E75; }

.success-banner { background: rgba(29,158,117,0.12); border: 1px solid rgba(29,158,117,0.3); border-radius: 12px; padding: 12px 20px; margin-bottom: 20px; font-size: 14px; color: #1D9E75; font-weight: 500; }
.error-banner   { background: rgba(226,75,74,0.1); border: 1px solid rgba(226,75,74,0.25); border-radius: 12px; padding: 12px 20px; margin-bottom: 20px; font-size: 14px; color: #E24B4A; }

.form-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.seccion-card { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; padding: 24px; }
.seccion-titulo { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.seccion-sub    { font-size: 12px; color: var(--text-muted); margin-bottom: 18px; }

.fields-col { display: flex; flex-direction: column; gap: 14px; }
.field      { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.field input, .field select { background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 10px; padding: 9px 13px; font-size: 14px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
.field input:focus, .field select:focus { border-color: rgba(55,138,221,0.5); background: rgba(55,138,221,0.04); }
.field-hint { font-size: 11px; color: var(--text-muted); }

.form-actions { margin-bottom: 24px; }
.btn-guardar  { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 12px; padding: 12px 32px; font-size: 14px; font-weight: 700; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; transition: opacity 0.2s; }
.btn-guardar:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-guardar:hover:not(:disabled) { opacity: 0.9; }

.preview-card   { background: var(--bg-card); border: 1px solid rgba(29,158,117,0.3); border-radius: 16px; padding: 22px; }
.preview-titulo { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 14px; }
.preview-grid   { display: flex; flex-direction: column; gap: 6px; }
.preview-row    { display: flex; gap: 12px; font-size: 13px; padding: 5px 0; border-bottom: 1px solid var(--row-border); }
.preview-row:last-child { border-bottom: none; }
.pl { color: var(--text-muted); font-weight: 600; min-width: 170px; font-size: 12px; }
.pv { color: var(--text-primary); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from,   .fade-leave-to     { opacity: 0; }

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>