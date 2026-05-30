<template>
  <div class="page-root">
    <div class="bg-grid"></div>
    <div class="page-content">

      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Resumen del negocio — {{ mesActual }}</p>
        </div>
        <button class="btn-refresh" @click="cargarTodo" :disabled="cargando">
          {{ cargando ? '⏳' : '🔄' }} Actualizar
        </button>
      </div>

      <!-- LOADING -->
      <div v-if="cargando" class="loading-state">
        <span>⏳</span>
        <p>Cargando datos...</p>
      </div>

      <template v-else>

        <!-- KPIs -->
        <div class="kpis-row">
          <div class="kpi-card verde">
            <div class="kpi-icon-wrap verde">💰</div>
            <div class="kpi-info">
              <span class="kpi-label">Ingresos del mes</span>
              <span class="kpi-valor">${{ kpis.ingresos_mes }}</span>
              <span v-if="kpis.variacion_mes !== null" :class="['kpi-var', parseFloat(kpis.variacion_mes) >= 0 ? 'up' : 'down']">
                {{ parseFloat(kpis.variacion_mes) >= 0 ? '▲' : '▼' }} {{ Math.abs(kpis.variacion_mes) }}% vs mes anterior
              </span>
            </div>
          </div>
          <div class="kpi-card azul">
            <div class="kpi-icon-wrap azul">📦</div>
            <div class="kpi-info">
              <span class="kpi-label">Pedidos activos</span>
              <span class="kpi-valor">{{ kpis.pedidos_activos }}</span>
              <span class="kpi-sub">Sin entregar</span>
            </div>
          </div>
          <div class="kpi-card" :class="kpis.stock_critico > 0 ? 'rojo' : 'verde'">
            <div class="kpi-icon-wrap" :class="kpis.stock_critico > 0 ? 'rojo' : 'verde'">⚠️</div>
            <div class="kpi-info">
              <span class="kpi-label">Stock crítico</span>
              <span class="kpi-valor">{{ kpis.stock_critico }}</span>
              <span class="kpi-sub">Productos bajo 5 unidades</span>
            </div>
          </div>
          <div class="kpi-card morado">
            <div class="kpi-icon-wrap morado">👥</div>
            <div class="kpi-info">
              <span class="kpi-label">Clientes</span>
              <span class="kpi-valor">{{ kpis.total_clientes }}</span>
              <span class="kpi-sub">Registrados</span>
            </div>
          </div>
        </div>

        <!-- GRÁFICA + PEDIDOS RECIENTES -->
        <div class="main-grid">

          <!-- Gráfica de línea: ingresos últimos 7 días -->
          <div class="grafica-card">
            <h3 class="card-titulo">📈 Ingresos últimos 7 días</h3>
            <div class="grafica-wrap">
              <canvas :key="'semana-' + chartKey" ref="canvasSemana"></canvas>
            </div>
          </div>

          <!-- Pedidos recientes -->
          <div class="lista-card">
            <h3 class="card-titulo">🕐 Pedidos recientes</h3>
            <div v-if="pedidosRecientes.length === 0" class="empty-mini">
              <span>📋</span>
              <p>Sin pedidos recientes</p>
            </div>
            <div v-else class="pedidos-mini">
              <div v-for="p in pedidosRecientes" :key="p.pedido_grupo" class="pedido-mini-row">
                <div class="pm-info">
                  <span class="pm-grupo">{{ p.pedido_grupo ? p.pedido_grupo.slice(0,18) + '...' : '—' }}</span>
                  <span class="pm-cliente">{{ p.cliente }}</span>
                </div>
                <div class="pm-right">
                  <span :class="['pm-estado', estadoClase(p.estado)]">{{ p.estado }}</span>
                  <span class="pm-total">${{ parseFloat(p.total).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- TOP PRODUCTOS + STOCK CRÍTICO -->
        <div class="bottom-grid">

          <!-- Top 5 productos del mes -->
          <div class="tabla-card">
            <h3 class="card-titulo">🏆 Top 5 productos del mes</h3>
            <div v-if="topProductos.length === 0" class="empty-mini">
              <span>📦</span>
              <p>Sin ventas este mes</p>
            </div>
            <table v-else>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Unidades</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in topProductos" :key="p.producto">
                  <td class="rank-col">
                    <span :class="['rank-badge', 'rank-' + (i+1)]">{{ i + 1 }}</span>
                  </td>
                  <td class="nombre-col">{{ p.producto }}</td>
                  <td class="num-col">{{ p.total_vendido }}</td>
                  <td class="dinero-col">${{ parseFloat(p.ingresos).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Stock crítico -->
          <div class="stock-card">
            <h3 class="card-titulo">
              ⚠️ Stock crítico
              <span v-if="stockCritico.length > 0" class="alerta-badge">{{ stockCritico.length }}</span>
            </h3>
            <div v-if="stockCritico.length === 0" class="empty-mini ok">
              <span>✅</span>
              <p>Todos los productos tienen stock suficiente</p>
            </div>
            <div v-else class="stock-lista">
              <div v-for="p in stockCritico" :key="p.id" class="stock-row">
                <div class="stock-info">
                  <span class="stock-nombre">{{ p.nombre }}</span>
                  <span class="stock-precio">${{ p.precio }}</span>
                </div>
                <div class="stock-right">
                  <span :class="['stock-badge', p.stock === 0 ? 'agotado' : 'critico']">
                    {{ p.stock === 0 ? 'AGOTADO' : p.stock + ' uds' }}
                  </span>
                  <router-link to="/productos" class="stock-link">Ver →</router-link>
                </div>
              </div>
            </div>
          </div>

        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue"
import { useRouter } from "vue-router"
import api from "../api/axios"
import {
  Chart,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineController,
  Filler
} from "chart.js"

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, LineController, Filler)

// ── Refs ──────────────────────────────────────────────────────
const canvasSemana = ref(null)
const cargando     = ref(false)
const chartKey     = ref(0)

const kpis           = ref({ ingresos_mes: "0.00", pedidos_activos: 0, stock_critico: 0, total_clientes: 0, variacion_mes: null })
const semana         = ref([])
const topProductos   = ref([])
const stockCritico   = ref([])
const pedidosRecientes = ref([])

let chartSemana = null

const mesActual = new Date().toLocaleDateString("es-SV", { month: "long", year: "numeric" })

// ── Helpers ───────────────────────────────────────────────────
function estadoClase(estado) {
  if (estado === "Recibido")                     return "estado-recibido"
  if (estado === "Preparando")                   return "estado-preparando"
  if (estado === "En camino/Listo para retirar") return "estado-camino"
  if (estado === "Entregado")                    return "estado-entregado"
  return ""
}

// ── Cargar todo ───────────────────────────────────────────────
async function cargarTodo() {
  cargando.value = true
  if (chartSemana) { chartSemana.destroy(); chartSemana = null }

  try {
    const [r1, r2, r3, r4, r5] = await Promise.all([
      api.get("/dashboard/kpis"),
      api.get("/dashboard/ingresos-semana"),
      api.get("/dashboard/top-productos"),
      api.get("/dashboard/stock-critico"),
      api.get("/dashboard/pedidos-recientes")
    ])

    kpis.value             = r1.data
    semana.value           = r2.data
    topProductos.value     = r3.data
    stockCritico.value     = r4.data
    pedidosRecientes.value = r5.data

    chartKey.value++
    await nextTick()
    await nextTick()

    setTimeout(() => { renderSemanaChart() }, 100)

  } catch (err) {
    console.error("Error al cargar dashboard:", err)
  } finally {
    cargando.value = false
  }
}

// ── Gráfica línea ─────────────────────────────────────────────
function renderSemanaChart() {
  const canvas = canvasSemana.value
  if (!canvas || semana.value.length === 0) return

  const labels   = semana.value.map(d => d.dia)
  const data     = semana.value.map(d => parseFloat(d.ingresos))
  const maxVal   = Math.max(...data)

  chartSemana = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label:           "Ingresos ($)",
        data,
        borderColor:     "#1D9E75",
        backgroundColor: "rgba(29,158,117,0.12)",
        borderWidth:     2.5,
        pointBackgroundColor: "#1D9E75",
        pointRadius:     5,
        pointHoverRadius: 7,
        tension:         0.4,
        fill:            true
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` $${ctx.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks:       { callback: v => `$${v}` },
          suggestedMax: maxVal > 0 ? maxVal * 1.2 : 10
        }
      }
    }
  })
}

onMounted(() => { cargarTodo() })
onBeforeUnmount(() => {
  if (chartSemana) { chartSemana.destroy(); chartSemana = null }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

.page-root    { min-height: 100vh; background: var(--bg-base); font-family: 'DM Sans', sans-serif; position: relative; }
.bg-grid      { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 100%); }
.page-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
.page-header  { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.page-title   { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.page-sub     { font-size: 14px; color: var(--text-muted); text-transform: capitalize; }
.btn-refresh  { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.btn-refresh:hover { background: var(--bg-card-hover); color: var(--text-primary); }
.loading-state { text-align: center; padding: 80px; color: var(--text-muted); }
.loading-state span { font-size: 40px; display: block; margin-bottom: 12px; }

/* KPIs */
.kpis-row      { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.kpi-card      { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; padding: 20px; display: flex; gap: 16px; align-items: flex-start; transition: all 0.2s; }
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
.kpi-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.kpi-icon-wrap.verde  { background: rgba(29,158,117,0.15); }
.kpi-icon-wrap.azul   { background: rgba(55,138,221,0.15); }
.kpi-icon-wrap.rojo   { background: rgba(226,75,74,0.15); }
.kpi-icon-wrap.morado { background: rgba(124,58,237,0.15); }
.kpi-card.verde  { border-color: rgba(29,158,117,0.25); }
.kpi-card.azul   { border-color: rgba(55,138,221,0.25); }
.kpi-card.rojo   { border-color: rgba(226,75,74,0.25); }
.kpi-card.morado { border-color: rgba(124,58,237,0.25); }
.kpi-info      { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.kpi-label     { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.kpi-valor     { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--text-primary); }
.kpi-sub       { font-size: 11px; color: var(--text-muted); }
.kpi-var       { font-size: 11px; font-weight: 600; }
.kpi-var.up    { color: #1D9E75; }
.kpi-var.down  { color: #E24B4A; }

/* MAIN GRID */
.main-grid  { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px; }
.grafica-card { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; padding: 22px; }
.grafica-wrap { height: 240px; position: relative; }
.card-titulo  { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.lista-card   { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; padding: 22px; }
.empty-mini   { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px; color: var(--text-muted); gap: 8px; text-align: center; }
.empty-mini.ok span { font-size: 32px; }
.empty-mini span { font-size: 32px; }
.empty-mini p    { font-size: 12px; }
.pedidos-mini    { display: flex; flex-direction: column; gap: 2px; }
.pedido-mini-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--row-border); gap: 10px; }
.pedido-mini-row:last-child { border-bottom: none; }
.pm-info    { flex: 1; min-width: 0; }
.pm-grupo   { display: block; font-size: 11px; font-weight: 600; color: var(--text-primary); font-family: monospace; }
.pm-cliente { font-size: 12px; color: var(--text-muted); }
.pm-right   { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.pm-total   { font-size: 13px; font-weight: 700; color: #1D9E75; }
.pm-estado  { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }

/* BOTTOM GRID */
.bottom-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.tabla-card   { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; overflow: hidden; padding-bottom: 4px; }
.tabla-card .card-titulo { padding: 18px 20px 0; }
table   { width: 100%; border-collapse: collapse; }
thead tr { background: var(--thead-bg); }
th      { padding: 9px 14px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
tbody tr { border-top: 1px solid var(--row-border); transition: background 0.15s; }
tbody tr:hover { background: var(--row-hover); }
td      { padding: 10px 14px; font-size: 13px; color: var(--text-secondary); }
.rank-col   { width: 40px; }
.rank-badge { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; font-size: 11px; font-weight: 800; }
.rank-1 { background: linear-gradient(135deg, #F59E0B, #D97706); color: #fff; }
.rank-2 { background: linear-gradient(135deg, #9CA3AF, #6B7280); color: #fff; }
.rank-3 { background: linear-gradient(135deg, #B45309, #92400E); color: #fff; }
.rank-4, .rank-5 { background: var(--bg-card-hover); color: var(--text-muted); border: 1px solid var(--border); }
.nombre-col { font-weight: 500; color: var(--text-primary); font-size: 12px; }
.num-col    { text-align: center; }
.dinero-col { color: #1D9E75; font-weight: 600; }

/* STOCK CRÍTICO */
.stock-card  { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; padding: 22px; }
.alerta-badge { background: #E24B4A; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
.stock-lista { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
.stock-row   { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--row-border); gap: 10px; }
.stock-row:last-child { border-bottom: none; }
.stock-info  { flex: 1; min-width: 0; }
.stock-nombre { display: block; font-size: 13px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stock-precio { font-size: 11px; color: var(--text-muted); }
.stock-right  { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.stock-badge  { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.stock-badge.agotado { background: rgba(226,75,74,0.15);  color: #E24B4A; border: 1px solid rgba(226,75,74,0.3); }
.stock-badge.critico { background: rgba(239,159,39,0.15); color: #EF9F27; border: 1px solid rgba(239,159,39,0.3); }
.stock-link  { font-size: 12px; color: #378ADD; text-decoration: none; font-weight: 600; }
.stock-link:hover { text-decoration: underline; }

/* ESTADO BADGES */
.estado-recibido   { background: rgba(55,138,221,0.15);  color: #378ADD; border: 1px solid rgba(55,138,221,0.3); }
.estado-preparando { background: rgba(239,159,39,0.15);  color: #EF9F27; border: 1px solid rgba(239,159,39,0.3); }
.estado-camino     { background: rgba(124,58,237,0.15);  color: #7C3AED; border: 1px solid rgba(124,58,237,0.3); }
.estado-entregado  { background: rgba(29,158,117,0.15);  color: #1D9E75; border: 1px solid rgba(29,158,117,0.3); }

@media (max-width: 1024px) {
  .kpis-row   { grid-template-columns: repeat(2, 1fr); }
  .main-grid  { grid-template-columns: 1fr; }
  .bottom-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .kpis-row { grid-template-columns: 1fr; }
}
</style>