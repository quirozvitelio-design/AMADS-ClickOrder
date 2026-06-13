<template>
  <div class="page-root">
    <div class="bg-grid"></div>
    
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Resumen del negocio — {{ mesActual }}</p>
        </div>
        <button class="btn-refresh" @click="cargarTodo" :disabled="cargando">
          {{ cargando ? '⏳' : '🔄' }} Actualizar
        </button>
      </div>

      <div v-if="cargando" class="loading-state">
        <span class="spinner-icon">⏳</span>
        <p>Cargando datos del sistema...</p>
      </div>

      <template v-else>
        <div class="kpis-row">
          <div class="kpi-card kpi-verde">
            <div class="kpi-icon-wrap">💰</div>
            <div class="kpi-info">
              <span class="kpi-label">Ingresos del mes</span>
              <span class="kpi-valor">${{ kpis.ingresos_mes }}</span>
              <span v-if="kpis.variacion_mes !== null" :class="['kpi-var', parseFloat(kpis.variacion_mes) >= 0 ? 'up' : 'down']">
                {{ parseFloat(kpis.variacion_mes) >= 0 ? '▲' : '▼' }} {{ kpis.variacion_mes }}%
              </span>
            </div>
          </div>


        </div>

        <div class="dashboard-grid">
          <div class="dashboard-card main-chart-card">
            <h2 class="card-title">Tendencia de Ingresos Semanales</h2>
            <div class="grafica-wrap">
              <canvas ref="canvasSemana" :key="chartKey"></canvas>
            </div>
          </div>

          <div class="dashboard-card text-card">
            <div class="card-header-flex">
              <h2 class="card-title">⚠️ Stock Crítico / Agotado</h2>
              <router-link to="/productos" class="stock-link">Ver todo</router-link>
            </div>
            <div class="stock-list" v-if="stockCritico.length > 0">
              <div v-for="p in stockCritico" :key="p.id" class="stock-item">
                <div class="stock-left">
                  <p class="stock-nombre">{{ p.nombre }}</p>
                  <p class="stock-precio">Precio: ${{ p.precio }}</p>
                </div>
                <div class="stock-right">
                  <span :class="['stock-badge', p.stock === 0 ? 'agotado' : 'critico']">
                    {{ p.stock === 0 ? 'Agotado' : p.stock + ' u.' }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state-card">
              <span>✅</span>
              <p>Todo el inventario se encuentra en niveles óptimos.</p>
            </div>
          </div>
        </div>

        <div class="dashboard-grid col-3">

          
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from "vue"
import clickOrderApi from "../api/axios"
import Chart from "chart.js/auto"
import { useDarkMode } from "../composables/useDarkMode"

const { isDark } = useDarkMode()

const mesActual = ref("")
const cargando = ref(true)
const chartKey = ref(0)

const kpis = ref({ ingresos_mes: "0.00", pedidos_completados: 0, pedidos_pendientes: 0, variacion_mes: null })
const semana = ref([])
const topProductos = ref([])
const stockCritico = ref([])
const pedidosRecientes = ref([])

const canvasSemana = ref(null)
let chartSemana = null

watch(isDark, () => {
  if (chartSemana) { chartSemana.destroy(); renderSemanaChart() }
})

onMounted(() => {
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
  mesActual.value = meses[new Date().getMonth()] + " " + new Date().getFullYear()
  cargarTodo()
})

async function cargarTodo() {
  try {
    cargando.value = true
    if (chartSemana) { chartSemana.destroy(); chartSemana = null }
    const [r1, r2, r3, r4, r5] = await Promise.all([
      clickOrderApi.get("/dashboard/kpis"),
      clickOrderApi.get("/dashboard/ingresos-semana"),
      clickOrderApi.get("/dashboard/top-productos"),
      clickOrderApi.get("/dashboard/stock-critico"),
      clickOrderApi.get("/dashboard/pedidos-recientes")
    ])
    kpis.value          = r1.data
    semana.value        = r2.data
    topProductos.value  = r3.data
    stockCritico.value  = r4.data
    pedidosRecientes.value = r5.data
    chartKey.value++
    await nextTick()
    setTimeout(() => renderSemanaChart(), 100)
  } catch (err) { console.error("Error al cargar dashboard:", err) }
  finally { cargando.value = false }
}

function renderSemanaChart() {
  const canvas = canvasSemana.value
  if (!canvas || semana.value.length === 0) return
  const labels = semana.value.map(d => d.dia)
  const data   = semana.value.map(d => parseFloat(d.ingresos))
  const colorLinea = isDark.value ? "#378ADD" : "#1e6bb8"
  const colorFondo = isDark.value ? "rgba(55,138,221,0.08)" : "rgba(55,138,221,0.04)"
  const colorGrid  = isDark.value ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"
  const colorTexto = isDark.value ? "#888888" : "#666666"
  chartSemana = new Chart(canvas, {
    type: "line",
    data: { labels, datasets: [{ label: "Ingresos ($)", data, borderColor: colorLinea, backgroundColor: colorFondo, borderWidth: 2, pointBackgroundColor: colorLinea, pointRadius: 4, tension: 0.3, fill: true }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: colorGrid }, ticks: { color: colorTexto } }, x: { grid: { display: false }, ticks: { color: colorTexto } } } }
  })
}
</script>

<style scoped>
.page-root {
  background-color: var(--bg-base);
  color: var(--text-primary);
  min-height: 100vh;
  width: 100%;
}

/* ── HEADER ── */
.page-content  { max-width: 1300px; margin: 0 auto; padding: 36px 24px; }
.page-header   { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.page-title    { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.page-sub      { font-size: 14px; color: var(--text-muted); }

.btn-refresh { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-refresh:hover:not(:disabled) { background: var(--bg-card-hover); }

/* ── LOADING ── */
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; color: var(--text-muted); gap: 12px; }
.spinner-icon  { font-size: 32px; animation: spin 2s linear infinite; }

/* ── KPI CARDS ── */
.kpis-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px; }

.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  /* ✅ FIX: forzar herencia de color en toda la card */
  color: var(--text-primary);
}

.kpi-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.kpi-verde  .kpi-icon-wrap { background: rgba(29,158,117,0.12); }
.kpi-azul   .kpi-icon-wrap { background: rgba(55,138,221,0.12); }
.kpi-naranja .kpi-icon-wrap { background: rgba(239,159,39,0.12); }

.kpi-info    { display: flex; flex-direction: column; flex: 1; gap: 2px; }

/* ✅ FIX: colores explícitos con !important para evitar que la transición global los tape */
.kpi-label   { font-size: 12px; color: var(--text-muted) !important; font-weight: 500; }
.kpi-valor   { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--text-primary) !important; line-height: 1.1; }
.kpi-subtext { font-size: 11px; color: var(--text-muted) !important; margin: 0; }
.kpi-var     { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; width: max-content; }
.kpi-var.up  { background: rgba(29,158,117,0.12); color: #1D9E75 !important; }
.kpi-var.down { background: rgba(226,75,74,0.12);  color: #E24B4A !important; }

/* ── GRID ── */
.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 24px; }
.dashboard-grid.col-3 { grid-template-columns: 2fr 1fr; }
@media (max-width: 992px) { .dashboard-grid.col-3 { grid-template-columns: 1fr; } }

.dashboard-card { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; padding: 20px; color: var(--text-primary); }
.col-span-2 { grid-column: span 2; }
@media (max-width: 992px) { .col-span-2 { grid-column: span 1; } }

/* ✅ FIX: card-title explícito */
.card-title        { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary) !important; margin-bottom: 16px; text-transform: uppercase; }
.card-header-flex  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

/* ── GRÁFICA ── */
.grafica-wrap { height: 260px; position: relative; }

/* ── STOCK ── */
.stock-list, .top-list { display: flex; flex-direction: column; gap: 8px; }
.stock-item, .top-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-base); border: 1px solid var(--border-soft); border-radius: 10px; }

/* ✅ FIX: colores explícitos */
.stock-nombre { font-size: 13px; font-weight: 600; color: var(--text-primary) !important; margin: 0; }
.stock-precio { font-size: 11px; color: var(--text-muted) !important; margin: 0; }
.stock-link   { font-size: 12px; color: #378ADD; text-decoration: none; font-weight: 600; }

.stock-badge  { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.stock-badge.agotado { background: rgba(226,75,74,0.12); color: #E24B4A !important; border: 1px solid rgba(226,75,74,0.25); }
.stock-badge.critico { background: rgba(239,159,39,0.12); color: #EF9F27 !important; border: 1px solid rgba(239,159,39,0.25); }

/* ── TOP VENDIDOS ── */
.top-rank  { width: 28px; height: 28px; background: rgba(55,138,221,0.12); color: #378ADD; font-weight: 700; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.top-info  { flex: 1; padding-left: 12px; }
.top-name  { font-size: 13px; font-weight: 600; color: var(--text-primary) !important; margin: 0; }
.top-sales { font-size: 11px; color: var(--text-muted) !important; margin: 0; }

/* ── TABLA ── */
.table-responsive { overflow-x: auto; }
.dashboard-table  { width: 100%; border-collapse: collapse; text-align: left; }
.dashboard-table th { padding: 10px 12px; font-size: 11px; font-weight: 600; color: var(--text-muted) !important; text-transform: uppercase; border-bottom: 1px solid var(--border-soft); }
.dashboard-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid var(--border-soft); color: var(--text-secondary) !important; }
.id-cell    { font-family: monospace; color: var(--text-muted) !important; }
.font-bold  { font-weight: 700; color: var(--text-primary) !important; }

/* ── ESTADOS ── */
.estado-badge            { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 6px; text-transform: capitalize; white-space: nowrap; }
.estado-recibido         { background: rgba(55,138,221,0.12);  color: #378ADD !important; }
.estado-completado       { background: rgba(29,158,117,0.12);  color: #1D9E75 !important; }
.estado-pendiente        { background: rgba(239,159,39,0.12);  color: #EF9F27 !important; }
.estado-preparando       { background: rgba(239,159,39,0.12);  color: #EF9F27 !important; }
.estado-en-camino-listo-para-retirar { background: rgba(124,58,237,0.12); color: #7C3AED !important; }
.estado-entregado        { background: rgba(29,158,117,0.12);  color: #1D9E75 !important; }
.estado-devuelto         { background: rgba(226,75,74,0.12);   color: #E24B4A !important; }

/* ── EMPTY ── */
.empty-state-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; color: var(--text-muted) !important; font-size: 13px; text-align: center; gap: 8px; }
.empty-state-card span { font-size: 24px; }
.empty-state-card p { color: var(--text-muted) !important; margin: 0; }

/* ── ANIMACIÓN ── */
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .page-content { padding: 20px 14px; }
  .page-title { font-size: 22px; }
  .kpis-row { grid-template-columns: 1fr; }
  .kpi-valor { font-size: 20px; }
}
</style>
