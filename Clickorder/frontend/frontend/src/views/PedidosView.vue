<template>
  <div class="page-root">
    <div class="bg-grid"></div>
    <div class="page-content">

      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Pedidos</h1>
          <p class="page-sub">Administra todos los pedidos del sistema</p>
        </div>
        <button v-if="esAdmin" @click="mostrarForm = !mostrarForm" class="btn-primary">
          {{ mostrarForm ? 'Cancelar' : '+ Nuevo pedido' }}
        </button>
      </div>

      <!-- FORMULARIO NUEVO PEDIDO -->
      <div v-if="mostrarForm && esAdmin" class="form-card">
        <h2 class="form-title">Nuevo pedido</h2>
        <div class="form-row">
          <div class="field">
            <label>Usuario</label>
            <select v-model="form.usuario_id">
              <option disabled value="">Selecciona usuario</option>
              <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }}</option>
            </select>
          </div>
          <div class="field">
            <label>Producto</label>
            <select v-model="form.producto_id">
              <option disabled value="">Selecciona producto</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">
                {{ p.nombre }} — ${{ p.precio }}
              </option>
            </select>
          </div>
          <div class="field" style="max-width:120px">
            <label>Cantidad</label>
            <input v-model="form.cantidad" type="number" min="1" placeholder="1" />
          </div>
          <div class="field" style="max-width:160px">
            <label>Método de pago</label>
            <select v-model="form.metodo_pago">
              <option value="">Sin especificar</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          <button @click="guardar" class="btn-primary" style="align-self:flex-end">
            Crear pedido
          </button>
        </div>
      </div>

      <!-- RESUMEN -->
      <div class="resumen-row">
        <div class="resumen-card">
          <span class="resumen-label">Total órdenes</span>
          <span class="resumen-num">{{ Object.keys(pedidosAgrupados).length }}</span>
        </div>
        <div class="resumen-card">
          <span class="resumen-label">Ingresos totales</span>
          <span class="resumen-num verde">${{ totalIngresos }}</span>
        </div>
        <div class="resumen-card">
          <span class="resumen-label">Recibidos</span>
          <span class="resumen-num azul">{{ contarEstado('Recibido') }}</span>
        </div>
        <div class="resumen-card">
          <span class="resumen-label">Preparando</span>
          <span class="resumen-num naranja">{{ contarEstado('Preparando') }}</span>
        </div>
        <div class="resumen-card">
          <span class="resumen-label">En camino</span>
          <span class="resumen-num morado">{{ contarEstado('En camino/Listo para retirar') }}</span>
        </div>
        <div class="resumen-card">
          <span class="resumen-label">Entregados</span>
          <span class="resumen-num verde">{{ contarEstado('Entregado') }}</span>
        </div>
      </div>

      <!-- LISTA AGRUPADA -->
      <div v-if="Object.keys(pedidosAgrupados).length === 0" class="empty-state">
        <span>📋</span>
        <p>No hay pedidos registrados</p>
      </div>

      <div class="pedidos-lista">
        <div
          v-for="(grupo, key) in pedidosAgrupados"
          :key="key"
          class="grupo-card">

          <div class="grupo-header">
            <div class="grupo-id-wrap">
              <span class="grupo-icono">🛍️</span>
              <div>
                <span class="grupo-label">Orden</span>
                <span class="grupo-codigo">
                  {{ grupo[0].pedido_grupo ? grupo[0].pedido_grupo : '#' + grupo[0].id }}
                </span>
              </div>
              <div class="grupo-meta">
                <span class="grupo-usuario">👤 {{ grupo[0].usuario }}</span>
                <span class="grupo-fecha">{{ formatFecha(grupo[0].fecha) }}</span>
              </div>
            </div>
            <div class="grupo-right">
              <span class="grupo-total">${{ totalGrupo(grupo) }}</span>
              <select
                :value="grupo[0].estado"
                @change="cambiarEstadoGrupo(grupo, $event.target.value)"
                :class="['estado-select', estadoClase(grupo[0].estado)]">
                <option value="Recibido">📥 Recibido</option>
                <option value="Preparando">🔄 Preparando</option>
                <option value="En camino/Listo para retirar">🚚 En camino/Listo</option>
                <option value="Entregado">✅ Entregado</option>
              </select>
            </div>
          </div>

          <div class="grupo-items">
            <div v-for="pedido in grupo" :key="pedido.id" class="grupo-item">
              <span class="item-emoji">📦</span>
              <div class="item-info">
                <span class="item-nombre">{{ pedido.producto }}</span>
                <span class="item-detalle">
                  {{ pedido.cantidad }} unidad{{ pedido.cantidad > 1 ? 'es' : '' }}
                  × ${{ pedido.precio }}
                </span>
              </div>
              <span class="item-subtotal">${{ parseFloat(pedido.total).toFixed(2) }}</span>
              <button
                v-if="esAdmin"
                @click="eliminar(pedido.id)"
                class="btn-delete-item">✕</button>
            </div>
          </div>

          <!-- Barra de progreso 4 pasos -->
          <div class="progreso-wrap">
            <div class="progreso-bar">
              <div class="progreso-linea">
                <div class="progreso-fill"
                  :style="{ width: progresoWidth(grupo[0].estado) }"></div>
              </div>
              <div
                v-for="(paso, i) in pasosPedido"
                :key="paso"
                :class="[
                  'paso', 'paso-' + i,
                  pasoActivo(grupo[0].estado, i)     ? 'activo'    : '',
                  pasoCompletado(grupo[0].estado, i) ? 'completado' : ''
                ]">
                <div class="paso-circulo">
                  <span v-if="pasoCompletado(grupo[0].estado, i)">✓</span>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span class="paso-label">{{ paso }}</span>
              </div>
            </div>
          </div>

          <div class="grupo-footer">
            <span v-if="grupo[0].metodo_pago" class="grupo-pago">
              💳 {{ grupo[0].metodo_pago }}
            </span>
            <span class="grupo-items-count">
              📦 {{ grupo.length }} producto{{ grupo.length > 1 ? 's' : '' }}
            </span>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import api from "../api/axios"

const pedidos     = ref([])
const usuarios    = ref([])
const productos   = ref([])
const mostrarForm = ref(false)
const form        = ref({ usuario_id: "", producto_id: "", cantidad: 1, metodo_pago: "" })

const usuario        = JSON.parse(localStorage.getItem("usuario"))
const esAdmin        = computed(() => usuario?.rol === "admin")
const puedeDespachar = computed(() => ["admin", "logistica"].includes(usuario?.rol))

// 4 pasos del pedido
const pasosPedido = [
  "Recibido",
  "Preparando",
  "En camino/Listo para retirar",
  "Entregado"
]

// ── Computed ──────────────────────────────────────────────────
const totalIngresos = computed(() =>
  pedidos.value.reduce((sum, p) => sum + Number(p.total), 0).toFixed(2)
)

const pedidosAgrupados = computed(() => {
  const grupos = {}
  for (const pedido of pedidos.value) {
    const key = pedido.pedido_grupo || `individual_${pedido.id}`
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(pedido)
  }
  return grupos
})

// ── Helpers ───────────────────────────────────────────────────
function contarEstado(estado) {
  return Object.values(pedidosAgrupados.value)
    .filter(g => g[0].estado === estado).length
}
function totalGrupo(items) {
  return items.reduce((sum, p) => sum + parseFloat(p.total), 0).toFixed(2)
}
function estadoClase(estado) {
  if (estado === "Recibido")                     return "estado-recibido"
  if (estado === "Preparando")                   return "estado-preparando"
  if (estado === "En camino/Listo para retirar") return "estado-camino"
  if (estado === "Entregado")                    return "estado-entregado"
  return ""
}
function pasoActivo(estado, i)     { return pasosPedido.indexOf(estado) === i }
function pasoCompletado(estado, i) { return i < pasosPedido.indexOf(estado) }
function progresoWidth(estado) {
  if (estado === "Recibido")                     return "0%"
  if (estado === "Preparando")                   return "33%"
  if (estado === "En camino/Listo para retirar") return "66%"
  if (estado === "Entregado")                    return "100%"
  return "0%"
}
function formatFecha(fecha) {
  if (!fecha) return ""
  return new Date(fecha).toLocaleDateString("es-SV", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  })
}

// ── Carga ─────────────────────────────────────────────────────
async function cargar() {
  const [p, u, pr] = await Promise.all([
    api.get("/pedidos"),
    api.get("/usuarios"),
    api.get("/productos")
  ])
  pedidos.value   = p.data
  usuarios.value  = u.data
  productos.value = pr.data
}

// ── Acciones ──────────────────────────────────────────────────
async function guardar() {
  await api.post("/pedidos", form.value)
  form.value        = { usuario_id: "", producto_id: "", cantidad: 1, metodo_pago: "" }
  mostrarForm.value = false
  cargar()
}

async function cambiarEstadoGrupo(grupo, nuevoEstado) {
  try {
    const promesas = grupo.map(p =>
      api.patch(`/pedidos/${p.id}/estado`, { estado: nuevoEstado })
    )
    await Promise.all(promesas)
    cargar()
  } catch (err) {
    alert(err.response?.data?.mensaje || "Error al cambiar estado")
    cargar()
  }
}

async function eliminar(id) {
  if (confirm("¿Eliminar este item del pedido?")) {
    await api.delete(`/pedidos/${id}`)
    cargar()
  }
}

onMounted(cargar)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

.page-root    { min-height: 100vh; background: var(--bg-base); font-family: 'DM Sans', sans-serif; position: relative; }
.bg-grid      { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 100%); }
.page-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
.page-header  { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title   { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.page-sub     { font-size: 14px; color: var(--text-muted); }
.btn-primary  { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; white-space: nowrap; transition: opacity 0.2s; }
.btn-primary:hover { opacity: 0.9; }
.form-card  { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 24px; animation: fadeUp 0.3s ease both; }
.form-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
.form-row   { display: flex; gap: 12px; flex-wrap: wrap; }
.field      { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 140px; }
.field label { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }
.field input, .field select { background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 10px; padding: 10px 14px; font-size: 14px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
.field input:focus, .field select:focus { border-color: rgba(55,138,221,0.5); }
.resumen-row  { display: flex; gap: 14px; margin-bottom: 28px; flex-wrap: wrap; }
.resumen-card { flex: 1; min-width: 120px; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
.resumen-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.resumen-num   { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; color: var(--text-primary); }
.resumen-num.verde   { color: #1D9E75; }
.resumen-num.naranja { color: #EF9F27; }
.resumen-num.azul    { color: #378ADD; }
.resumen-num.morado  { color: #7C3AED; }
.empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
.empty-state span { font-size: 48px; display: block; margin-bottom: 12px; }
.pedidos-lista { display: flex; flex-direction: column; gap: 20px; }
.grupo-card  { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 18px; padding: 22px; transition: all 0.2s; }
.grupo-card:hover { border-color: rgba(55,138,221,0.25); box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
.grupo-header  { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.grupo-id-wrap { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.grupo-icono   { font-size: 26px; flex-shrink: 0; }
.grupo-label   { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.grupo-codigo  { display: block; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--text-primary); word-break: break-all; max-width: 280px; }
.grupo-meta    { display: flex; flex-direction: column; gap: 2px; margin-left: 4px; }
.grupo-usuario { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.grupo-fecha   { font-size: 11px; color: var(--text-muted); }
.grupo-right   { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.grupo-total   { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #1D9E75; }
.estado-select { border: 1px solid transparent; border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; }
.estado-recibido   { background: rgba(55,138,221,0.15);  color: #378ADD; border-color: rgba(55,138,221,0.3); }
.estado-preparando { background: rgba(239,159,39,0.15);  color: #EF9F27; border-color: rgba(239,159,39,0.3); }
.estado-camino     { background: rgba(124,58,237,0.15);  color: #7C3AED; border-color: rgba(124,58,237,0.3); }
.estado-entregado  { background: rgba(29,158,117,0.15);  color: #1D9E75; border-color: rgba(29,158,117,0.3); }
.grupo-items   { background: var(--bg-card-hover); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
.grupo-item    { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--row-border); }
.grupo-item:last-child { border-bottom: none; }
.item-emoji    { font-size: 24px; flex-shrink: 0; }
.item-info     { flex: 1; }
.item-nombre   { display: block; font-size: 14px; font-weight: 600; color: var(--text-primary); }
.item-detalle  { font-size: 12px; color: var(--text-muted); }
.item-subtotal { font-size: 14px; font-weight: 700; color: #1D9E75; white-space: nowrap; margin-right: 8px; }
.btn-delete-item { background: rgba(226,75,74,0.1); border: 1px solid rgba(226,75,74,0.2); border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #E24B4A; cursor: pointer; flex-shrink: 0; }
.btn-delete-item:hover { background: rgba(226,75,74,0.22); }
.progreso-wrap  { padding: 8px 0 4px; }
.progreso-bar   { position: relative; display: flex; justify-content: space-between; align-items: flex-start; padding: 0 14px; }
.progreso-linea { position: absolute; top: 14px; left: 28px; right: 28px; height: 3px; background: var(--border); border-radius: 999px; z-index: 0; }
.progreso-fill  { height: 100%; background: linear-gradient(90deg, #378ADD, #7C3AED, #1D9E75); border-radius: 999px; transition: width 0.6s ease; }
.paso           { display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1; flex: 1; }
.paso-circulo   { width: 30px; height: 30px; border-radius: 50%; background: var(--bg-card); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--text-muted); transition: all 0.3s; }
.paso.completado .paso-circulo  { border-color: #1D9E75; background: #1D9E75; color: #fff; }
.paso-0.activo  .paso-circulo   { border-color: #378ADD; background: rgba(55,138,221,0.15); color: #378ADD; }
.paso-1.activo  .paso-circulo   { border-color: #EF9F27; background: rgba(239,159,39,0.15); color: #EF9F27; }
.paso-2.activo  .paso-circulo   { border-color: #7C3AED; background: rgba(124,58,237,0.15); color: #7C3AED; }
.paso-3.activo  .paso-circulo   { border-color: #1D9E75; background: rgba(29,158,117,0.15); color: #1D9E75; }
.paso-label     { font-size: 10px; color: var(--text-muted); text-align: center; font-weight: 500; max-width: 80px; line-height: 1.3; }
.paso.completado .paso-label    { color: #1D9E75; }
.paso-0.activo  .paso-label     { color: #378ADD; font-weight: 700; }
.paso-1.activo  .paso-label     { color: #EF9F27; font-weight: 700; }
.paso-2.activo  .paso-label     { color: #7C3AED; font-weight: 700; }
.paso-3.activo  .paso-label     { color: #1D9E75; font-weight: 700; }
.grupo-footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--row-border); display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.grupo-pago        { font-size: 12px; color: var(--text-muted); }
.grupo-items-count { font-size: 11px; color: var(--text-muted); margin-left: auto; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (max-width: 768px) {
  .grupo-header { flex-direction: column; }
  .grupo-right  { justify-content: space-between; width: 100%; }
  .resumen-row  { gap: 10px; }
  .paso-label   { font-size: 9px; max-width: 60px; }
}
</style>