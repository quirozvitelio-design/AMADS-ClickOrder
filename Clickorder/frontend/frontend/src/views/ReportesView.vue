<template>
  <div class="page-root">
    <div class="bg-grid"></div>
    <div class="page-content">

      <div class="page-header">
        <div>
          <h1 class="page-title">Reportes</h1>
          <p class="page-sub">Análisis de ventas e ingresos del negocio</p>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="filtros-card">
        <div class="filtros-row">
          <div class="field">
            <label>Período rápido</label>
            <div class="periodo-btns">
              <button
                v-for="p in periodos"
                :key="p.valor"
                :class="['periodo-btn', periodoActivo === p.valor ? 'active' : '']"
                @click="seleccionarPeriodo(p.valor)">
                {{ p.label }}
              </button>
              <button
                :class="['periodo-btn', periodoActivo === 'todo' ? 'active' : '']"
                @click="seleccionarTodo()">
                Todo
              </button>
            </div>
          </div>
          <div class="field">
            <label>Desde</label>
            <input v-model="filtro.desde" type="date" class="date-input" />
          </div>
          <div class="field">
            <label>Hasta</label>
            <input v-model="filtro.hasta" type="date" class="date-input" />
          </div>
          <button class="btn-aplicar" @click="cargarDatos" :disabled="cargando">
            {{ cargando ? '⏳ Cargando...' : '🔍 Aplicar' }}
          </button>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="cargando" class="loading-state">
        <span>⏳</span>
        <p>Cargando datos...</p>
      </div>

      <template v-else>

        <!-- KPIs -->
        <div class="kpis-row">
          <div class="kpi-card">
            <span class="kpi-icon">📦</span>
            <div class="kpi-info">
              <span class="kpi-label">Total órdenes</span>
              <span class="kpi-valor azul">{{ resumen.total_ordenes }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-icon">💰</span>
            <div class="kpi-info">
              <span class="kpi-label">Ingresos totales</span>
              <span class="kpi-valor verde">${{ resumen.total_ingresos }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-icon">🧾</span>
            <div class="kpi-info">
              <span class="kpi-label">Ticket promedio</span>
              <span class="kpi-valor naranja">${{ resumen.ticket_promedio }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-icon">🛒</span>
            <div class="kpi-info">
              <span class="kpi-label">Productos distintos</span>
              <span class="kpi-valor morado">{{ datosProductos.length }}</span>
            </div>
          </div>
        </div>

        <!-- GRÁFICAS — solo se muestran si hay datos -->
        <div class="graficas-grid">

          <div class="grafica-card grande">
            <h3 class="grafica-titulo">📈 Ingresos por día</h3>
            <div v-if="datosIngresos.length === 0" class="grafica-empty">
              <span>📊</span>
              <p>No hay datos para el período seleccionado</p>
            </div>
            <!-- key fuerza re-render del canvas cuando cambian los datos -->
            <div v-else class="grafica-wrap">
              <canvas :key="'ingresos-' + chartKey" ref="canvasIngresos"></canvas>
            </div>
          </div>

          <div class="grafica-card">
            <h3 class="grafica-titulo">🏆 Top 5 productos más vendidos</h3>
            <div v-if="datosProductos.length === 0" class="grafica-empty">
              <span>📦</span>
              <p>No hay datos para el período seleccionado</p>
            </div>
            <div v-else class="grafica-wrap">
              <canvas :key="'productos-' + chartKey" ref="canvasProductos"></canvas>
            </div>
          </div>

        </div>

        <!-- TABLA -->
        <div class="tabla-card" v-if="datosProductos.length > 0">
          <h3 class="tabla-titulo">📋 Detalle productos más vendidos</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Unidades</th>
                <th>Órdenes</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in datosProductos" :key="p.producto">
                <td class="rank-col">{{ i + 1 }}</td>
                <td class="nombre-col">{{ p.producto }}</td>
                <td class="num-col">{{ p.total_vendido }}</td>
                <td class="num-col">{{ p.ordenes }}</td>
                <td class="dinero-col">${{ parseFloat(p.ingresos).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from "vue"
import api from "../api/axios"
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  BarController
} from "chart.js"

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController)

// ── Refs ──────────────────────────────────────────────────────
const canvasIngresos  = ref(null)
const canvasProductos = ref(null)
const cargando        = ref(false)
const periodoActivo   = ref("todo")
const chartKey        = ref(0)   // fuerza re-render del canvas

const resumen        = ref({ total_ordenes: 0, total_ingresos: "0.00", ticket_promedio: "0.00" })
const datosIngresos  = ref([])
const datosProductos = ref([])

let chartIngresos  = null
let chartProductos = null

const periodos = [
  { label: "Hoy",     valor: "1d"   },
  { label: "7 días",  valor: "7d"   },
  { label: "30 días", valor: "30d"  },
  { label: "3 meses", valor: "90d"  },
  { label: "1 año",   valor: "365d" },
]

const hoy    = new Date().toISOString().split("T")[0]
const filtro = ref({ desde: "", hasta: "" })

function seleccionarPeriodo(valor) {
  periodoActivo.value = valor
  const dias = parseInt(valor)
  filtro.value.hasta = hoy
  filtro.value.desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0]
  cargarDatos()
}

function seleccionarTodo() {
  periodoActivo.value = "todo"
  filtro.value.desde  = ""
  filtro.value.hasta  = ""
  cargarDatos()
}

// ── Destruir charts antes de redibujar ────────────────────────
function destruirCharts() {
  if (chartIngresos) {
    chartIngresos.destroy()
    chartIngresos = null
  }
  if (chartProductos) {
    chartProductos.destroy()
    chartProductos = null
  }
}

// ── Cargar datos ──────────────────────────────────────────────
async function cargarDatos() {
  cargando.value = true
  destruirCharts()

  try {
    const params = filtro.value.desde && filtro.value.hasta
      ? `desde=${filtro.value.desde}&hasta=${filtro.value.hasta}`
      : ""

    const url1 = params ? `/reportes/ingresos?${params}`          : "/reportes/ingresos"
    const url2 = params ? `/reportes/productos-top?${params}&limit=5` : "/reportes/productos-top?limit=5"
    const url3 = params ? `/reportes/resumen?${params}`            : "/reportes/resumen"

    const [res1, res2, res3] = await Promise.all([
      api.get(url1),
      api.get(url2),
      api.get(url3)
    ])

    datosIngresos.value  = res1.data || []
    datosProductos.value = res2.data || []
    resumen.value        = res3.data || { total_ordenes: 0, total_ingresos: "0.00", ticket_promedio: "0.00" }

    // Incrementar key para forzar que Vue recree los <canvas>
    chartKey.value++

    // Esperar a que Vue cree los canvas en el DOM
    await nextTick()
    await nextTick()

    // Dibujar con pequeño delay para garantizar que el canvas existe
    setTimeout(() => {
      if (datosIngresos.value.length > 0)  renderIngresosChart()
      if (datosProductos.value.length > 0) renderProductosChart()
    }, 100)

  } catch (err) {
    console.error("Error al cargar reportes:", err)
  } finally {
    cargando.value = false
  }
}

// ── Gráfica ingresos ──────────────────────────────────────────
function renderIngresosChart() {
  const canvas = canvasIngresos.value
  if (!canvas) {
    console.warn("Canvas ingresos no disponible")
    return
  }

  const labels = datosIngresos.value.map(d => {
    const partes = d.fecha.split("-")
    return `${partes[2]}/${partes[1]}`
  })
  const data = datosIngresos.value.map(d => parseFloat(d.ingresos))

  chartIngresos = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label:           "Ingresos ($)",
        data,
        backgroundColor: "rgba(55,138,221,0.7)",
        borderColor:     "#378ADD",
        borderWidth:     1,
        borderRadius:    6,
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` $${ctx.parsed.y.toFixed(2)}` } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => `$${v}` } }
      }
    }
  })
}

// ── Gráfica productos ─────────────────────────────────────────
function renderProductosChart() {
  const canvas = canvasProductos.value
  if (!canvas) {
    console.warn("Canvas productos no disponible")
    return
  }

  const labels = datosProductos.value.map(d =>
    d.producto.length > 22 ? d.producto.slice(0, 22) + "…" : d.producto
  )
  const data = datosProductos.value.map(d => Number(d.total_vendido))

  const colores = [
    "rgba(29,158,117,0.75)",
    "rgba(55,138,221,0.75)",
    "rgba(239,159,39,0.75)",
    "rgba(124,58,237,0.75)",
    "rgba(226,75,74,0.75)",
  ]

  chartProductos = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label:           "Unidades vendidas",
        data,
        backgroundColor: colores.slice(0, data.length),
        borderColor:     colores.slice(0, data.length).map(c => c.replace("0.75","1")),
        borderWidth:     1,
        borderRadius:    6,
      }]
    },
    options: {
      indexAxis:           "y",
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} unidades` } }
      },
      scales: { x: { beginAtZero: true } }
    }
  })
}

onMounted(() => { cargarDatos() })

onBeforeUnmount(() => { destruirCharts() })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

.page-root    { min-height: 100vh; background: var(--bg-base); font-family: 'DM Sans', sans-serif; position: relative; }
.bg-grid      { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 100%); }
.page-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
.page-header  { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title   { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.page-sub     { font-size: 14px; color: var(--text-muted); }
.loading-state { text-align: center; padding: 80px; color: var(--text-muted); }
.loading-state span { font-size: 40px; display: block; margin-bottom: 12px; }
.filtros-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; }
.filtros-row  { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
.field        { display: flex; flex-direction: column; gap: 6px; }
.field label  { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.periodo-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.periodo-btn  { background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: 8px; padding: 6px 14px; font-size: 12px; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.periodo-btn.active { background: rgba(55,138,221,0.15); border-color: rgba(55,138,221,0.4); color: #378ADD; font-weight: 600; }
.date-input   { background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 10px; padding: 8px 12px; font-size: 14px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; outline: none; }
.date-input:focus { border-color: rgba(55,138,221,0.5); }
.btn-aplicar  { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 10px; padding: 9px 20px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; white-space: nowrap; }
.btn-aplicar:disabled { opacity: 0.6; cursor: not-allowed; }
.kpis-row  { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.kpi-card  { flex: 1; min-width: 160px; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 16px; }
.kpi-icon  { font-size: 32px; flex-shrink: 0; }
.kpi-info  { display: flex; flex-direction: column; gap: 4px; }
.kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.kpi-valor { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; }
.kpi-valor.azul    { color: #378ADD; }
.kpi-valor.verde   { color: #1D9E75; }
.kpi-valor.naranja { color: #EF9F27; }
.kpi-valor.morado  { color: #7C3AED; }
.graficas-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 24px; }
.grafica-card  { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; padding: 22px; }
.grafica-titulo { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; }
.grafica-wrap   { height: 260px; position: relative; }
.grafica-empty  { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--text-muted); gap: 10px; }
.grafica-empty span { font-size: 40px; }
.grafica-empty p    { font-size: 13px; }
.tabla-card   { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; overflow: hidden; }
.tabla-titulo { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); padding: 18px 20px 10px; }
table   { width: 100%; border-collapse: collapse; }
thead tr { background: var(--thead-bg); }
th      { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
tbody tr { border-top: 1px solid var(--row-border); transition: background 0.15s; }
tbody tr:hover { background: var(--row-hover); }
td      { padding: 12px 16px; font-size: 13px; color: var(--text-secondary); }
.rank-col   { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--text-muted); width: 40px; }
.nombre-col { font-weight: 500; color: var(--text-primary); }
.num-col    { text-align: center; }
.dinero-col { color: #1D9E75; font-weight: 600; }
@media (max-width: 900px) {
  .graficas-grid { grid-template-columns: 1fr; }
  .kpis-row { gap: 10px; }
}
</style>