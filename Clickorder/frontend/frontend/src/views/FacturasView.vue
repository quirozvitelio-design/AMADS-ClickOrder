<template>
  <div class="page-root">
    <div class="bg-grid"></div>
    <div class="page-content">

      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Facturas</h1>
          <p class="page-sub">{{ facturas.length }} factura{{ facturas.length !== 1 ? 's' : '' }} generada{{ facturas.length !== 1 ? 's' : '' }}</p>
        </div>
        <div class="header-actions">
          <div class="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input v-model="buscar" type="text" placeholder="Buscar por cliente, N° factura..." class="search-inp" />
          </div>
          <button class="btn-export" @click="exportarCSV" title="Exportar CSV">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      <!-- STATS CARDS -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-ico">🧾</div>
          <div>
            <p class="stat-val">{{ facturas.length }}</p>
            <p class="stat-label">Total facturas</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-ico">💵</div>
          <div>
            <p class="stat-val">${{ totalFacturado.toFixed(2) }}</p>
            <p class="stat-label">Total facturado</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-ico">📅</div>
          <div>
            <p class="stat-val">{{ facturaHoy }}</p>
            <p class="stat-label">Facturas hoy</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-ico">👥</div>
          <div>
            <p class="stat-val">{{ clientesUnicos }}</p>
            <p class="stat-label">Clientes únicos</p>
          </div>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="cargando" class="loading-wrap">
        <div class="spinner"></div>
        <p>Cargando facturas...</p>
      </div>

      <!-- EMPTY -->
      <div v-else-if="facturasFiltradas.length === 0" class="empty-state">
        <span>🧾</span>
        <p>{{ buscar ? 'No se encontraron resultados' : 'Aún no hay facturas generadas' }}</p>
        <small v-if="buscar" @click="buscar = ''" style="cursor:pointer;color:#378ADD">Limpiar búsqueda</small>
      </div>

      <!-- TABLA -->
      <div v-else class="table-wrap">
        <table class="fact-table">
          <thead>
            <tr>
              <th @click="ordenarPor('numero_factura')" class="th-sort">
                N° Factura <span class="sort-ico">{{ sortKey === 'numero_factura' ? (sortDir > 0 ? '↑' : '↓') : '↕' }}</span>
              </th>
              <th>Cliente</th>
              <th>Correo</th>
              <th @click="ordenarPor('fecha_emision')" class="th-sort">
                Fecha <span class="sort-ico">{{ sortKey === 'fecha_emision' ? (sortDir > 0 ? '↑' : '↓') : '↕' }}</span>
              </th>
              <th @click="ordenarPor('total')" class="th-sort" style="text-align:right">
                Total <span class="sort-ico">{{ sortKey === 'total' ? (sortDir > 0 ? '↑' : '↓') : '↕' }}</span>
              </th>
              <th style="text-align:center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in facturasFiltradas" :key="f.id" class="fact-row" @click="abrirDetalle(f)">
              <td>
                <span class="num-pill">{{ f.numero_factura }}</span>
              </td>
              <td>
                <div class="cliente-cell">
                  <div class="cliente-avatar">{{ f.cliente?.charAt(0).toUpperCase() || '?' }}</div>
                  <span>{{ f.cliente || '—' }}</span>
                </div>
              </td>
              <td class="text-muted-cell">{{ f.correo || '—' }}</td>
              <td class="text-muted-cell">{{ formatFecha(f.fecha_emision) }}</td>
              <td style="text-align:right">
                <span class="monto-val">${{ parseFloat(f.total).toFixed(2) }}</span>
              </td>
              <td style="text-align:center" @click.stop>
                <div class="action-btns">
                  <button class="btn-action eye" @click="abrirDetalle(f)" title="Ver detalle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button class="btn-action pdf" @click="verPDF(f.id)" title="Ver PDF">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </button>
                  <button class="btn-action dl" @click="descargarPDF(f.id, f.numero_factura)" title="Descargar PDF">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                  <button class="btn-action del" @click="eliminarFactura(f.id, f.numero_factura)" title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- MODAL DETALLE FACTURA -->
    <transition name="modal">
      <div v-if="modalDetalle.visible" class="modal-overlay" @click.self="modalDetalle.visible = false">
        <div class="detalle-modal">
          <div class="dm-header">
            <div>
              <p class="dm-num">🧾 {{ modalDetalle.factura?.numero_factura }}</p>
              <p class="dm-fecha">{{ formatFecha(modalDetalle.factura?.fecha_emision) }}</p>
            </div>
            <div class="dm-header-btns">
              <button class="btn-prim-sm" @click="verPDF(modalDetalle.factura?.id)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                Ver PDF
              </button>
              <button class="btn-sec-sm" @click="descargarPDF(modalDetalle.factura?.id, modalDetalle.factura?.numero_factura)">
                ⬇ Descargar
              </button>
              <button class="btn-close" @click="modalDetalle.visible = false">✕</button>
            </div>
          </div>

          <div v-if="modalDetalle.datos" class="dm-body">

            <!-- Emisor / Receptor -->
            <div class="dm-doble">
              <div class="dm-bloque">
                <p class="dm-bloque-title">📤 EMISOR</p>
                <p class="dm-field"><span>Nombre:</span><strong>{{ modalDetalle.datos.emisor?.nombre }}</strong></p>
                <p class="dm-field"><span>Comercial:</span><strong>{{ modalDetalle.datos.emisor?.nombreComercial }}</strong></p>
                <p class="dm-field"><span>NIT:</span><strong>{{ modalDetalle.datos.emisor?.nit }}</strong></p>
                <p class="dm-field"><span>NRC:</span><strong>{{ modalDetalle.datos.emisor?.nrc }}</strong></p>
                <p class="dm-field"><span>Actividad:</span><strong>{{ modalDetalle.datos.emisor?.descActividad }}</strong></p>
                <p class="dm-field"><span>Teléfono:</span><strong>{{ modalDetalle.datos.emisor?.telefono || '—' }}</strong></p>
                <p class="dm-field"><span>Correo:</span><strong>{{ modalDetalle.datos.emisor?.correo || '—' }}</strong></p>
                <p class="dm-field"><span>Dirección:</span><strong>{{ modalDetalle.datos.emisor?.direccion?.complemento }}</strong></p>
              </div>
              <div class="dm-bloque">
                <p class="dm-bloque-title">📥 RECEPTOR</p>
                <p class="dm-field"><span>Cliente:</span><strong>{{ modalDetalle.datos.receptor?.nombre }}</strong></p>
                <p class="dm-field"><span>Documento:</span><strong>{{ modalDetalle.datos.receptor?.numDocumento }}</strong></p>
                <p class="dm-field"><span>Correo:</span><strong>{{ modalDetalle.datos.receptor?.correo || '—' }}</strong></p>
                <p class="dm-field"><span>Teléfono:</span><strong>{{ modalDetalle.datos.receptor?.telefono || '—' }}</strong></p>
                <p class="dm-field"><span>Dirección:</span><strong>{{ modalDetalle.datos.receptor?.direccion?.complemento }}</strong></p>

                <div class="dm-sep"></div>
                <p class="dm-bloque-title" style="margin-top:8px">📋 IDENTIFICACIÓN</p>
                <p class="dm-field"><span>N° Control:</span><strong style="font-size:10px;word-break:break-all">{{ modalDetalle.datos.identificacion?.numeroControl }}</strong></p>
                <p class="dm-field"><span>Cód. Generación:</span><strong style="font-size:10px;word-break:break-all">{{ modalDetalle.datos.identificacion?.codigoGeneracion }}</strong></p>
                <p class="dm-field"><span>Ambiente:</span><strong>{{ modalDetalle.datos.identificacion?.ambiente === '01' ? 'Producción' : 'Pruebas' }}</strong></p>
                <p class="dm-field"><span>Fecha:</span><strong>{{ modalDetalle.datos.identificacion?.fecEmi }}</strong></p>
                <p class="dm-field"><span>Hora:</span><strong>{{ modalDetalle.datos.identificacion?.horEmi }}</strong></p>
              </div>
            </div>

            <!-- Productos -->
            <div class="dm-section">
              <p class="dm-section-title">🛒 Detalle de productos</p>
              <table class="dm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Descripción</th>
                    <th style="text-align:center">Cant.</th>
                    <th style="text-align:right">Precio Unit.</th>
                    <th style="text-align:right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in modalDetalle.datos.cuerpoDocumento" :key="item.numItem">
                    <td>{{ item.numItem }}</td>
                    <td>{{ item.descripcion }}</td>
                    <td style="text-align:center">{{ item.cantidad }}</td>
                    <td style="text-align:right">${{ Number(item.precioUni).toFixed(2) }}</td>
                    <td style="text-align:right">${{ Number(item.ventaGravada).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totales -->
            <div class="dm-totales">
              <div class="dm-tot-row">
                <span>Subtotal (sin IVA)</span>
                <span>${{ Number(modalDetalle.datos.resumen?.subTotalVentas).toFixed(2) }}</span>
              </div>
              <div class="dm-tot-row">
                <span>IVA (13%)</span>
                <span>${{ Number(modalDetalle.datos.resumen?.tributos?.[0]?.valor).toFixed(2) }}</span>
              </div>
              <div class="dm-tot-row dm-grand">
                <span>TOTAL A PAGAR</span>
                <span>${{ Number(modalDetalle.datos.resumen?.totalPagar).toFixed(2) }}</span>
              </div>
              <p class="dm-letras">{{ modalDetalle.datos.resumen?.totalLetras }}</p>
            </div>

            <!-- Pago -->
            <div class="dm-pago">
              <p class="dm-bloque-title">💳 FORMA DE PAGO</p>
              <div v-for="pago in modalDetalle.datos.resumen?.pagos" :key="pago.codigo" class="dm-field">
                <span>Método:</span><strong>{{ pago.referencia }}</strong>
                <span style="margin-left:16px">Monto:</span><strong>${{ Number(pago.montoPago).toFixed(2) }}</strong>
              </div>
              <p class="dm-field" style="margin-top:6px"><span>Observaciones:</span><strong>{{ modalDetalle.datos.extension?.observaciones }}</strong></p>
              <p class="dm-field"><span>Sello:</span><strong style="font-size:10px;word-break:break-all;color:var(--text-muted)">{{ modalDetalle.datos.selloRecibido }}</strong></p>
            </div>

          </div>
          <div v-else class="dm-loading">
            <div class="spinner"></div><p>Cargando datos...</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL PDF -->
    <transition name="modal">
      <div v-if="modalPDF.visible" class="modal-overlay" @click.self="modalPDF.visible = false">
        <div class="pdf-modal">
          <div class="pdf-header">
            <p class="pdf-title">🧾 {{ modalPDF.numero }}</p>
            <div class="pdf-header-btns">
              <button class="btn-prim-sm" @click="descargarPDF(modalPDF.id, modalPDF.numero)">⬇ Descargar</button>
              <button class="btn-close" @click="modalPDF.visible = false">✕</button>
            </div>
          </div>
          <iframe v-if="modalPDF.url" :src="modalPDF.url" class="pdf-iframe" title="Factura PDF"></iframe>
          <div v-else class="dm-loading"><div class="spinner"></div></div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api from '../api/axios'

const API_URL    = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const facturas   = ref([])
const cargando   = ref(true)
const buscar     = ref('')
const sortKey    = ref('fecha_emision')
const sortDir    = ref(-1) // -1 desc, 1 asc

const modalDetalle = reactive({ visible: false, factura: null, datos: null })
const modalPDF     = reactive({ visible: false, id: null, numero: '', url: null })

// ── Cargar facturas ────────────────────────────────────────────────
async function cargarFacturas() {
  cargando.value = true
  try {
    const r = await api.get('/facturas')
    facturas.value = r.data
  } catch(e) { console.error(e) }
  finally { cargando.value = false }
}

// ── Stats ──────────────────────────────────────────────────────────
const totalFacturado = computed(() =>
  facturas.value.reduce((s, f) => s + parseFloat(f.total || 0), 0)
)
const facturaHoy = computed(() => {
  const hoy = new Date().toDateString()
  return facturas.value.filter(f => new Date(f.fecha_emision).toDateString() === hoy).length
})
const clientesUnicos = computed(() =>
  new Set(facturas.value.map(f => f.cliente)).size
)

// ── Filtrado y ordenamiento ────────────────────────────────────────
function ordenarPor(key) {
  if (sortKey.value === key) { sortDir.value *= -1 }
  else { sortKey.value = key; sortDir.value = -1 }
}

const facturasFiltradas = computed(() => {
  const q = buscar.value.toLowerCase()
  let lista = facturas.value.filter(f =>
    !q
    || (f.numero_factura || '').toLowerCase().includes(q)
    || (f.cliente || '').toLowerCase().includes(q)
    || (f.correo || '').toLowerCase().includes(q)
    || (f.pedido_grupo || '').toLowerCase().includes(q)
  )
  return lista.slice().sort((a, b) => {
    const va = a[sortKey.value] ?? ''
    const vb = b[sortKey.value] ?? ''
    if (sortKey.value === 'total') return sortDir.value * (parseFloat(va) - parseFloat(vb))
    return sortDir.value * (String(va) < String(vb) ? -1 : String(va) > String(vb) ? 1 : 0)
  })
})

// ── Detalle modal ──────────────────────────────────────────────────
async function abrirDetalle(f) {
  modalDetalle.factura = f
  modalDetalle.datos   = null
  modalDetalle.visible = true
  try {
    // Fetch the JSON data to display all fields
    const r = await fetch(`${API_URL}/api/facturas/${f.id}/json`)
    const text = await r.text()
    modalDetalle.datos = JSON.parse(text)
  } catch(e) { console.error(e) }
}

// ── PDF ────────────────────────────────────────────────────────────
function verPDF(id) {
  const f = facturas.value.find(x => x.id === id)
  modalPDF.id      = id
  modalPDF.numero  = f?.numero_factura || ''
  modalPDF.url     = `${API_URL}/api/facturas/${id}/pdf`
  modalPDF.visible = true
}

function descargarPDF(id, numero) {
  const a = document.createElement('a')
  a.href = `${API_URL}/api/facturas/${id}/pdf`
  a.target = '_blank'
  a.download = `${numero}.pdf`
  a.click()
}

// ── Eliminar ───────────────────────────────────────────────────────
async function eliminarFactura(id, numero) {
  if (!confirm(`¿Eliminar la factura ${numero}? Esta acción no se puede deshacer.`)) return
  try {
    await api.delete(`/facturas/${id}`)
    facturas.value = facturas.value.filter(f => f.id !== id)
    if (modalDetalle.factura?.id === id) modalDetalle.visible = false
  } catch(e) { alert('Error al eliminar la factura') }
}

// ── Exportar CSV ───────────────────────────────────────────────────
function exportarCSV() {
  const headers = ['N° Factura', 'Cliente', 'Correo', 'Pedido Grupo', 'Fecha', 'Total']
  const rows = facturasFiltradas.value.map(f => [
    f.numero_factura,
    f.cliente || '',
    f.correo || '',
    f.pedido_grupo || '',
    formatFecha(f.fecha_emision),
    parseFloat(f.total).toFixed(2)
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'facturas.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ── Helpers ────────────────────────────────────────────────────────
function formatFecha(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(cargarFacturas)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.page-root    { min-height: 100vh; background: var(--bg-base); font-family: 'DM Sans', sans-serif; position: relative; }
.bg-grid      { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(var(--grid-color, rgba(0,0,0,0.04)) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color, rgba(0,0,0,0.04)) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 100%); }
.page-content { position: relative; z-index: 1; max-width: 1300px; margin: 0 auto; padding: 36px 24px; }

/* HEADER */
.page-header   { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 14px; }
.page-title    { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.page-sub      { font-size: 13px; color: var(--text-muted); }
.header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.search-wrap   { display: flex; align-items: center; gap: 8px; background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 8px; padding: 8px 14px; }
.search-inp    { background: transparent; border: none; outline: none; font-size: 13px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; width: 220px; }
.search-inp::placeholder { color: var(--text-muted); }
.btn-export    { display: flex; align-items: center; gap: 6px; background: var(--bg-card, #fff); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.btn-export:hover { background: var(--bg-card-hover); color: var(--text-primary); }

/* STATS */
.stats-row  { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px; }
.stat-card  { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 12px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
.stat-ico   { font-size: 28px; flex-shrink: 0; }
.stat-val   { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text-primary); }
.stat-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* LOADING */
.loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px; color: var(--text-muted); }
.spinner      { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: #378ADD; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* EMPTY */
.empty-state  { text-align: center; padding: 80px; color: var(--text-muted); }
.empty-state span { font-size: 52px; display: block; margin-bottom: 12px; }

/* TABLE */
.table-wrap { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 14px; overflow: hidden; }
.fact-table { width: 100%; border-collapse: collapse; }
.fact-table thead th {
  background: var(--bg-base, #f9fafb); padding: 11px 14px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);
  text-align: left; border-bottom: 1px solid var(--border);
}
.th-sort { cursor: pointer; user-select: none; }
.th-sort:hover { color: #378ADD; }
.sort-ico { font-size: 10px; opacity: 0.6; }
.fact-row { border-bottom: 1px solid var(--border-soft, #f0f0f0); cursor: pointer; transition: background 0.12s; }
.fact-row:last-child { border-bottom: none; }
.fact-row:hover { background: var(--bg-base, #f9fafb); }
.fact-table tbody td { padding: 12px 14px; font-size: 13px; color: var(--text-primary); vertical-align: middle; }
.text-muted-cell { color: var(--text-muted) !important; font-size: 12px !important; }

.num-pill      { background: rgba(55,138,221,0.1); color: #378ADD; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; white-space: nowrap; }
.cliente-cell  { display: flex; align-items: center; gap: 9px; }
.cliente-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #378ADD, #1D9E75); color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.monto-val     { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #1D9E75; }

/* ACTION BUTTONS */
.action-btns  { display: flex; justify-content: center; gap: 6px; }
.btn-action   { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-base); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.14s; color: var(--text-muted); }
.btn-action:hover { transform: translateY(-1px); }
.btn-action.eye:hover { background: rgba(55,138,221,0.1);  color: #378ADD; border-color: rgba(55,138,221,0.3); }
.btn-action.pdf:hover { background: rgba(29,158,117,0.1);  color: #1D9E75; border-color: rgba(29,158,117,0.3); }
.btn-action.dl:hover  { background: rgba(124,58,237,0.1);  color: #7C3AED; border-color: rgba(124,58,237,0.3); }
.btn-action.del:hover { background: rgba(226,75,74,0.1);   color: #E24B4A; border-color: rgba(226,75,74,0.3); }

/* MODAL OVERLAY */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.54); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-enter-active, .modal-leave-active { transition: all 0.22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }

/* DETALLE MODAL */
.detalle-modal { background: var(--bg-card, #fff); border-radius: 16px; width: 100%; max-width: 820px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.dm-header     { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; gap: 12px; flex-wrap: wrap; }
.dm-num        { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.dm-fecha      { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.dm-header-btns { display: flex; gap: 8px; align-items: center; }
.dm-body       { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 18px; }
.dm-loading    { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 50px; color: var(--text-muted); }

.dm-doble       { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.dm-bloque      { background: var(--bg-base, #f9fafb); border-radius: 10px; padding: 14px; border: 1px solid var(--border-soft, #f0f0f0); }
.dm-bloque-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #378ADD; margin-bottom: 10px; }
.dm-field       { display: flex; gap: 6px; font-size: 12px; margin-bottom: 5px; flex-wrap: wrap; }
.dm-field span  { color: var(--text-muted); flex-shrink: 0; }
.dm-field strong { color: var(--text-primary); font-weight: 600; }
.dm-sep         { height: 1px; background: var(--border-soft); margin: 10px 0; }

.dm-section      { background: var(--bg-base, #f9fafb); border-radius: 10px; border: 1px solid var(--border-soft); overflow: hidden; }
.dm-section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #378ADD; padding: 12px 14px 8px; }
.dm-table       { width: 100%; border-collapse: collapse; }
.dm-table th    { background: #1D4E89; color: #fff; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
.dm-table td    { padding: 9px 12px; font-size: 12px; color: var(--text-secondary); border-bottom: 1px solid var(--border-soft); }
.dm-table tr:last-child td { border-bottom: none; }
.dm-table tr:nth-child(even) td { background: rgba(55,138,221,0.03); }

.dm-totales     { background: var(--bg-base); border-radius: 10px; padding: 14px; border: 1px solid var(--border-soft); }
.dm-tot-row     { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); padding: 4px 0; }
.dm-grand       { font-size: 16px; font-weight: 800; color: #1D9E75; border-top: 2px solid var(--border); margin-top: 6px; padding-top: 10px; }
.dm-letras      { font-size: 10px; color: var(--text-muted); font-style: italic; margin-top: 8px; }

.dm-pago        { background: var(--bg-base); border-radius: 10px; padding: 14px; border: 1px solid var(--border-soft); }

/* BUTTONS */
.btn-prim-sm   { display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 7px; padding: 7px 14px; font-size: 12px; font-weight: 600; color: #fff; cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
.btn-prim-sm:hover { opacity: 0.9; }
.btn-sec-sm    { background: var(--bg-base); border: 1px solid var(--border); border-radius: 7px; padding: 7px 14px; font-size: 12px; color: var(--text-secondary); cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
.btn-sec-sm:hover { background: var(--bg-card-hover); }
.btn-close     { background: var(--bg-base); border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; color: var(--text-muted); }

/* PDF MODAL */
.pdf-modal   { background: var(--bg-card, #fff); border-radius: 14px; width: 96vw; max-width: 1100px; height: 94vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
.pdf-header  { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; gap: 12px; }
.pdf-title   { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary); flex: 1; }
.pdf-header-btns { display: flex; gap: 8px; align-items: center; }
.pdf-iframe  { flex: 1; width: 100%; border: none; background: #f0f0f0; display: block; min-height: 0; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .dm-doble { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .search-inp { width: 140px; }
  .page-title { font-size: 22px; }
}
</style>