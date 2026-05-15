<template>
  <div class="page-root">
    <div class="bg-grid"></div>
    <div class="page-content">

      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogo</h1>
          <p class="page-sub">Explora nuestros productos disponibles</p>
        </div>
        <div class="header-actions">
          <button
            :class="['tab-btn', vistaActiva === 'pedidos' ? 'active' : '']"
            @click="vistaActiva = 'pedidos'; cargarMisPedidos()">
            📋 Mis pedidos
            <span v-if="pedidosActivos > 0" class="badge-alerta">{{ pedidosActivos }}</span>
          </button>
          <div class="carrito-badge" @click="verCarrito = !verCarrito">
            <span>🛒 Carrito</span>
            <span v-if="totalItems > 0" class="badge-num">{{ totalItems }}</span>
          </div>
        </div>
      </div>

      <div v-if="vistaActiva === 'resumen' && ordenConfirmada" class="resumen-orden">
  <div class="resumen-header">
    <span class="resumen-check">✅</span>
    <h2 class="resumen-titulo">¡Pedido confirmado!</h2>
    <p class="resumen-codigo">Orden: <strong>{{ ordenConfirmada.grupo }}</strong></p>
    <p class="resumen-fecha-txt">{{ ordenConfirmada.fecha }}</p>
  </div>
  <div class="resumen-items">
    <div v-for="item in ordenConfirmada.items" :key="item.id" class="resumen-item">
      <div class="ri-img">
        <img v-if="item.imagen" :src="item.imagen" :alt="item.nombre"
          class="ri-foto" @error="item.imagen = null" />
        <span v-else>📦</span>
      </div>
      <div class="ri-info">
        <span class="ri-nombre">{{ item.nombre }}</span>
        <span class="ri-detalle">{{ item.cantidad }} × ${{ item.precio }}</span>
      </div>
      <span class="ri-sub">${{ (item.precio * item.cantidad).toFixed(2) }}</span>
    </div>
  </div>
  <div class="resumen-footer">
    <div class="rf-row">
      <span>Método de pago</span>
      <strong>{{ ordenConfirmada.metodoPago }}</strong>
    </div>
    <div class="rf-row total">
      <span>Total pagado</span>
      <strong class="rf-total">${{ ordenConfirmada.total }}</strong>
    </div>
  </div>
  <div class="resumen-acciones">
    <button class="btn-primary"
      @click="vistaActiva = 'pedidos'; cargarMisPedidos()">
      📋 Ver estado del pedido
    </button>
    <button class="btn-secondary" @click="vistaActiva = 'catalogo'">
      🛒 Seguir comprando
    </button>
  </div>
</div>

      <!-- ===== VISTA: MIS PEDIDOS ===== -->
      <div v-if="vistaActiva === 'pedidos'">
        <div class="section-header">
          <h2 class="section-title">📋 Mis pedidos</h2>
          <button class="btn-volver" @click="vistaActiva = 'catalogo'">← Volver al catálogo</button>
        </div>

        <div v-if="cargandoPedidos" class="loading-state">
          <span>⏳</span>
          <p>Cargando pedidos...</p>
        </div>

        <div v-else-if="Object.keys(pedidosAgrupados).length === 0" class="empty-state">
          <span>🛍️</span>
          <p>Aún no tienes pedidos</p>
          <button class="btn-primary" @click="vistaActiva = 'catalogo'">Ir al catálogo</button>
        </div>

        <div v-else class="pedidos-lista">
          <div
            v-for="(grupo, key) in pedidosAgrupados"
            :key="key"
            class="grupo-card">

            <!-- Header del grupo -->
            <div class="grupo-header">
              <div class="grupo-id-wrap">
                <span class="grupo-icono">🛍️</span>
                <div>
                  <span class="grupo-label">Orden</span>
                  <span class="grupo-codigo">
                    {{ grupo[0].pedido_grupo ? grupo[0].pedido_grupo.slice(0,16) + '...' : '#' + grupo[0].id }}
                  </span>
                </div>
                <span class="grupo-fecha">{{ formatFecha(grupo[0].fecha) }}</span>
              </div>
              <div class="grupo-right">
                <span class="grupo-total">${{ totalGrupo(grupo) }}</span>
                <span :class="['estado-badge', estadoClase(grupo[0].estado)]">
                  {{ estadoIcono(grupo[0].estado) }} {{ grupo[0].estado }}
                </span>
              </div>
            </div>

            <!-- Items del grupo -->
            <div class="grupo-items">
              <div v-for="pedido in grupo" :key="pedido.id" class="grupo-item">
                <span class="item-emoji">📦</span>
                <div class="item-info">
                  <span class="item-nombre">{{ pedido.producto }}</span>
                  <span class="item-detalle">
                    {{ pedido.cantidad }} unidad{{ pedido.cantidad > 1 ? 'es' : '' }} × ${{ pedido.precio }}
                  </span>
                </div>
                <span class="item-subtotal">${{ parseFloat(pedido.total).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Barra de progreso -->
            <div class="progreso-wrap">
              <div class="progreso-bar">
                <div class="progreso-linea">
                  <div class="progreso-fill" :style="{ width: progresoWidth(grupo[0].estado) }"></div>
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

            <div v-if="grupo[0].metodo_pago" class="grupo-footer">
              <span class="grupo-pago">💳 {{ grupo[0].metodo_pago }}</span>
            </div>

          </div>
        </div>
      </div>

      <!-- ===== VISTA: CATÁLOGO ===== -->
      <div v-if="vistaActiva === 'catalogo'">

        <!-- CARRITO -->
        <transition name="slide">
          <div v-if="verCarrito" class="form-card">
            <h2 class="form-title">🛒 Tu carrito</h2>
            <div v-if="carrito.length === 0" class="empty-carrito">
              <span>🛍️</span>
              <p>El carrito está vacío</p>
            </div>
            <div v-else>
              <div v-for="item in carrito" :key="item.id" class="carrito-item">
                <div class="carrito-emoji">📦</div>
                <div class="carrito-info">
                  <span class="carrito-nombre">{{ item.nombre }}</span>
                  <span class="carrito-precio-unit">${{ item.precio }} c/u</span>
                </div>
                <div class="carrito-controles">
                  <button @click="restar(item)" class="ctrl-btn">−</button>
                  <span class="ctrl-num">{{ item.cantidad }}</span>
                  <button
                    @click="sumar(item)"
                    class="ctrl-btn"
                    :disabled="item.cantidad >= stockDisponible(item.id)">+</button>
                </div>
                <span class="carrito-subtotal">${{ (item.precio * item.cantidad).toFixed(2) }}</span>
                <button @click="quitarDelCarrito(item.id)" class="btn-quitar">✕</button>
              </div>

              <div class="carrito-resumen">
                <div class="resumen-row-item">
                  <span class="resumen-label">Subtotal ({{ totalItems }} productos)</span>
                  <span class="resumen-valor">${{ totalCarrito }}</span>
                </div>
                <div class="resumen-divider"></div>
                <div class="resumen-row-item total-final">
                  <span>Total a pagar</span>
                  <span class="total-grande">${{ totalCarrito }}</span>
                </div>
              </div>

            <div class="field-pago">
              <label class="pago-label">💳 Método de pago *</label>
              <select v-model="metodoPago" class="select-pago">
                <option value="" disabled>Selecciona método de pago</option>
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Transferencia">🏦 Transferencia</option>
              </select>
            </div>
            <p v-if="!metodoPago" class="pago-hint">
              ⚠️ Selecciona un método de pago para continuar
            </p>
            <div class="carrito-acciones">
              <button class="btn-vaciar" @click="vaciarCarrito">🗑 Vaciar</button>
                <button
                  class="btn-confirmar"
                  @click="confirmarPedido"
                  :disabled="confirmando || !metodoPago">
                  {{ confirmando ? 'Procesando...' : 'Confirmar pedido →' }}
                </button>
              </div>
            </div>
          </div>
        </transition>

        <!-- BANNERS -->
        <transition name="fade">
          <div v-if="errorMsg" class="error-banner">
            <span>⚠️</span>
            <p>{{ errorMsg }}</p>
          </div>
        </transition>

        <!-- FILTROS -->
        <div class="filtros-bar">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input v-model="busqueda" type="text" placeholder="Buscar producto..." class="search-input" />
          </div>
          <div class="filtro-btns">
            <button :class="['filtro-btn', filtro === 'todos' ? 'active' : '']" @click="filtro = 'todos'">Todos</button>
            <button :class="['filtro-btn', filtro === 'disponibles' ? 'active' : '']" @click="filtro = 'disponibles'">Disponibles</button>
            <button :class="['filtro-btn', filtro === 'agotados' ? 'active' : '']" @click="filtro = 'agotados'">Agotados</button>
          </div>
        </div>

        <!-- GRID -->
        <div v-if="productosFiltrados.length === 0" class="empty-state">
          <span>📭</span>
          <p>No hay productos que coincidan</p>
        </div>
        <div class="productos-grid">
          <div
            v-for="p in productosFiltrados"
            :key="p.id"
            class="producto-card"
            :class="{ agotado: p.stock === 0 }">

            <div class="producto-img" @click="p.stock > 0 && abrirModal(p)">
              <span class="producto-emoji">📦</span>
              <div v-if="p.stock === 0" class="agotado-overlay">AGOTADO</div>
              <div v-else class="hover-ver">Ver detalle</div>
            </div>

            <div class="producto-info">
              <div class="producto-tags">
                <span :class="['stock-badge', p.stock > 0 ? 'ok' : 'agotado']">
                  {{ p.stock > 0 ? '✓ ' + p.stock + ' disponibles' : '✗ Agotado' }}
                </span>
                <span v-if="enCarrito(p.id)" class="en-carrito-badge">En carrito ✓</span>
              </div>
              <h3 class="producto-nombre">{{ p.nombre }}</h3>
              <p class="producto-desc">{{ p.descripcion || 'Sin descripción' }}</p>
              <div class="producto-footer">
                <span class="producto-precio">${{ p.precio }}</span>
              </div>
            </div>

            <div class="producto-acciones">
              <button class="btn-detalle" @click="abrirModal(p)" :disabled="p.stock === 0">
                Ver detalle
              </button>
              <button
                class="btn-agregar"
                @click="agregarRapido(p)"
                :disabled="p.stock === 0 || stockAgotadoEnCarrito(p)">
                {{ p.stock === 0 ? 'Agotado' : stockAgotadoEnCarrito(p) ? 'Sin stock' : '+ Agregar' }}
              </button>
            </div>
          </div>
        </div>

      </div><!-- fin vista catalogo -->
    </div>

    <!-- MODAL DETALLE -->
    <transition name="modal">
      <div v-if="modalProducto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-card">
          <button class="modal-close" @click="cerrarModal">✕</button>
          <div class="modal-img">
            <span class="modal-emoji">📦</span>
            <span :class="['modal-stock-badge', modalProducto.stock > 0 ? 'ok' : 'agotado']">
              {{ modalProducto.stock > 0 ? modalProducto.stock + ' disponibles' : 'Agotado' }}
            </span>
          </div>
          <div class="modal-body">
            <h2 class="modal-nombre">{{ modalProducto.nombre }}</h2>
            <p class="modal-desc">{{ modalProducto.descripcion || 'Sin descripción disponible.' }}</p>
            <div class="modal-detalles">
              <div class="detalle-item">
                <span class="detalle-label">Precio unitario</span>
                <span class="detalle-valor precio">${{ modalProducto.precio }}</span>
              </div>
              <div class="detalle-item">
                <span class="detalle-label">Stock disponible</span>
                <span class="detalle-valor">{{ modalProducto.stock }} uds</span>
              </div>
              <div class="detalle-item">
                <span class="detalle-label">En tu carrito</span>
                <span class="detalle-valor">{{ cantidadEnCarrito(modalProducto.id) }} uds</span>
              </div>
            </div>
            <div class="modal-cantidad-row">
              <span class="detalle-label">Cantidad a agregar</span>
              <div class="cantidad-control">
                <button @click="modalCantidad > 1 ? modalCantidad-- : null" class="ctrl-btn-lg">−</button>
                <span class="cantidad-num">{{ modalCantidad }}</span>
                <button
                  @click="modalCantidad < maxModalCantidad ? modalCantidad++ : null"
                  class="ctrl-btn-lg"
                  :disabled="modalCantidad >= maxModalCantidad">+</button>
              </div>
              <span class="cantidad-subtotal">
                Subtotal: <strong>${{ (modalProducto.precio * modalCantidad).toFixed(2) }}</strong>
              </span>
            </div>
            <div v-if="maxModalCantidad === 0" class="sin-stock-msg">
              No hay más unidades disponibles para agregar al carrito.
            </div>
            <button
              class="btn-agregar-modal"
              @click="agregarDesdeModal"
              :disabled="maxModalCantidad === 0">
              🛒 Agregar {{ modalCantidad }} al carrito — ${{ (modalProducto.precio * modalCantidad).toFixed(2) }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue"
import api from "../api/axios"

const productos       = ref([])
const verCarrito      = ref(false)
const confirmado      = ref(false)
const confirmando     = ref(false)
const errorMsg        = ref("")
const busqueda        = ref("")
const filtro          = ref("todos")
const modalProducto   = ref(null)
const modalCantidad   = ref(1)
const vistaActiva     = ref("catalogo")
const misPedidos      = ref([])
const cargandoPedidos = ref(false)
const metodoPago = ref("")
const ordenConfirmada = ref(null)

const usuario     = JSON.parse(localStorage.getItem("usuario"))
const pasosPedido = ["Recibido", "Preparando", "En camino/Listo para retirar", "Entregado"]
const carritoGuardado = localStorage.getItem("clickorder_carrito")
const carrito = ref(carritoGuardado ? JSON.parse(carritoGuardado) : [])
watch(carrito, (nuevo) => {
  localStorage.setItem("clickorder_carrito", JSON.stringify(nuevo))
}, { deep: true })


// ── Computed ──────────────────────────────────────────────
const totalCarrito = computed(() =>
  carrito.value.reduce((s, i) => s + i.precio * i.cantidad, 0).toFixed(2)
)
const totalItems = computed(() =>
  carrito.value.reduce((s, i) => s + i.cantidad, 0)
)
const pedidosActivos = computed(() =>
  Object.values(pedidosAgrupados.value)
    .filter(g => g[0].estado !== "Entregado").length
)
const productosFiltrados = computed(() => {
  let lista = productos.value
  if (busqueda.value.trim())
    lista = lista.filter(p => p.nombre.toLowerCase().includes(busqueda.value.toLowerCase()))
  if (filtro.value === "disponibles") lista = lista.filter(p => p.stock > 0)
  if (filtro.value === "agotados")    lista = lista.filter(p => p.stock === 0)
  return lista
})
const maxModalCantidad = computed(() => {
  if (!modalProducto.value) return 0
  return Math.max(0, modalProducto.value.stock - cantidadEnCarrito(modalProducto.value.id))
})

// Agrupar pedidos por pedido_grupo — los del carrito juntos, los individuales solos
const pedidosAgrupados = computed(() => {
  const grupos = {}
  for (const pedido of misPedidos.value) {
    const key = pedido.pedido_grupo || `individual_${pedido.id}`
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(pedido)
  }
  return grupos
})

// ── Helpers de estado ─────────────────────────────────────
function estadoClase(estado) {
  if (estado === "Recibido")                     return "estado-recibido"
  if (estado === "Preparando")                   return "estado-preparando"
  if (estado === "En camino/Listo para retirar") return "estado-camino"
  if (estado === "Entregado")                    return "estado-entregado"
  return ""
}
function estadoIcono(estado) {
  if (estado === "Recibido")                     return "📥"
  if (estado === "Preparando")                   return "🔄"
  if (estado === "En camino/Listo para retirar") return "🚚"
  if (estado === "Entregado")                    return "✅"
  return "🕐"
}
function pasoActivo(estado, i) {
  return pasosPedido.indexOf(estado) === i
}
function pasoCompletado(estado, i) {
  return i < pasosPedido.indexOf(estado)
}
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
function totalGrupo(items) {
  return items.reduce((sum, p) => sum + parseFloat(p.total), 0).toFixed(2)
}

// ── Helpers de carrito ────────────────────────────────────
function enCarrito(id) { return carrito.value.some(i => i.id === id) }
function cantidadEnCarrito(id) {
  const item = carrito.value.find(i => i.id === id)
  return item ? item.cantidad : 0
}
function stockDisponible(id) {
  const prod = productos.value.find(p => p.id === id)
  return prod ? prod.stock : 0
}
function stockAgotadoEnCarrito(prod) {
  return cantidadEnCarrito(prod.id) >= prod.stock
}

// ── Carga de datos ────────────────────────────────────────
async function cargar() {
  const res = await api.get("/productos")
  productos.value = res.data
}
async function cargarMisPedidos() {
  cargandoPedidos.value = true
  try {
    const res = await api.get(`/pedidos/usuario/${usuario.id}`)
    misPedidos.value = res.data
  } catch {
    misPedidos.value = []
  } finally {
    cargandoPedidos.value = false
  }
}

// ── Acciones del carrito ──────────────────────────────────
function agregarRapido(producto) {
  const existe = carrito.value.find(i => i.id === producto.id)
  if (existe) {
    if (existe.cantidad < producto.stock) existe.cantidad++
  } else {
    carrito.value.push({ ...producto, cantidad: 1 })
  }
  verCarrito.value = true
}
function agregarDesdeModal() {
  if (!modalProducto.value || modalCantidad.value <= 0) return
  const existe = carrito.value.find(i => i.id === modalProducto.value.id)
  if (existe) {
    existe.cantidad = Math.min(existe.cantidad + modalCantidad.value, modalProducto.value.stock)
  } else {
    carrito.value.push({ ...modalProducto.value, cantidad: modalCantidad.value })
  }
  cerrarModal()
  verCarrito.value = true
}
function sumar(item) {
  const prod = productos.value.find(p => p.id === item.id)
  if (prod && item.cantidad < prod.stock) item.cantidad++
}
function restar(item) {
  if (item.cantidad > 1) item.cantidad--
  else quitarDelCarrito(item.id)
}
function quitarDelCarrito(id) {
  carrito.value = carrito.value.filter(i => i.id !== id)
}
function vaciarCarrito() {
  if (confirm("¿Vaciar el carrito?")) {
    carrito.value = []
    localStorage.removeItem("clickorder_carrito")
  }
}

// ── Modal ─────────────────────────────────────────────────
function abrirModal(producto) { modalProducto.value = producto; modalCantidad.value = 1 }
function cerrarModal()        { modalProducto.value = null;    modalCantidad.value = 1 }

// ── Confirmar pedido (un solo POST con todos los items) ───
async function confirmarPedido() {
  if (!metodoPago.value) {
    errorMsg.value = "Debes seleccionar un método de pago"
    setTimeout(() => { errorMsg.value = "" }, 3000)
    return
  }
  confirmando.value = true
  errorMsg.value    = ""
  try {
    const res = await api.post("/pedidos/carrito", {
      usuario_id:  usuario.id,
      metodo_pago: metodoPago.value,
      items: carrito.value.map(item => ({
        producto_id: item.id,
        cantidad:    item.cantidad
      }))
    })

    // HU-16: guardar resumen antes de limpiar el carrito
    ordenConfirmada.value = {
      grupo:      res.data?.grupo || `ORD-${Date.now()}`,
      fecha:      new Date().toLocaleString("es-SV", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      }),
      items:      [...carrito.value],
      total:      totalCarrito.value,
      metodoPago: metodoPago.value
    }

    carrito.value     = []
    metodoPago.value  = ""
    localStorage.removeItem("clickorder_carrito")
    verCarrito.value  = false
    vistaActiva.value = "resumen"   // redirige a pantalla de resumen

    await cargar()
    await cargarMisPedidos()
  } catch (err) {
    errorMsg.value = err.response?.data?.mensaje || "Error al confirmar el pedido"
    setTimeout(() => { errorMsg.value = "" }, 4000)
  } finally {
    confirmando.value = false
  }
}

onMounted(async () => {
  await cargar()
  await cargarMisPedidos()
})
onUnmounted(() => {
  if (typeof pollingInterval !== "undefined" && pollingInterval)
    clearInterval(pollingInterval)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

.page-root { min-height: 100vh; background: var(--bg-base); font-family: 'DM Sans', sans-serif; position: relative; }
.bg-grid { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 100%); }
.page-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 40px 24px; }

/* HEADER */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.page-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.header-actions { display: flex; align-items: center; gap: 10px; }
.tab-btn { display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 10px 16px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-secondary); font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
.tab-btn:hover, .tab-btn.active { background: rgba(55,138,221,0.12); border-color: rgba(55,138,221,0.35); color: #378ADD; }
.badge-alerta { background: #EF9F27; color: #fff; border-radius: 999px; font-size: 10px; font-weight: 700; padding: 1px 6px; }
.carrito-badge { display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 10px 18px; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--text-primary); transition: all 0.2s; }
.carrito-badge:hover { background: var(--bg-card-hover); }
.badge-num { background: linear-gradient(135deg, #378ADD, #1D9E75); color: #fff; border-radius: 999px; font-size: 11px; font-weight: 700; padding: 2px 8px; }

/* MIS PEDIDOS */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--text-primary); }
.btn-volver { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 8px 16px; font-size: 13px; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.btn-volver:hover { color: var(--text-primary); background: var(--bg-card-hover); }
.loading-state { text-align: center; padding: 60px; color: var(--text-muted); }
.loading-state span { font-size: 40px; display: block; margin-bottom: 10px; }
.pedidos-lista { display: flex; flex-direction: column; gap: 20px; }

/* GRUPO CARD */
.grupo-card { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 18px; padding: 22px; transition: all 0.2s; }
.grupo-card:hover { border-color: rgba(55,138,221,0.25); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.grupo-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.grupo-id-wrap { display: flex; align-items: center; gap: 12px; }
.grupo-icono { font-size: 26px; }
.grupo-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.grupo-codigo { display: block; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--text-primary); }
.grupo-fecha { font-size: 12px; color: var(--text-muted); margin-left: 4px; }
.grupo-right { display: flex; align-items: center; gap: 14px; }
.grupo-total { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #1D9E75; }
.estado-badge { font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 999px; }
.estado-recibido   { background: rgba(55,138,221,0.15);  color: #378ADD; border: 1px solid rgba(55,138,221,0.3); }
.estado-preparando { background: rgba(239,159,39,0.15);  color: #EF9F27; border: 1px solid rgba(239,159,39,0.3); }
.estado-camino     { background: rgba(124,58,237,0.15);  color: #7C3AED; border: 1px solid rgba(124,58,237,0.3); }
.estado-entregado  { background: rgba(29,158,117,0.15);  color: #1D9E75; border: 1px solid rgba(29,158,117,0.3); }

/* ITEMS DEL GRUPO */
.grupo-items { background: var(--bg-card-hover); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
.grupo-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--row-border); }
.grupo-item:last-child { border-bottom: none; }
.item-emoji { font-size: 24px; flex-shrink: 0; }
.item-info { flex: 1; }
.item-nombre { display: block; font-size: 14px; font-weight: 600; color: var(--text-primary); }
.item-detalle { font-size: 12px; color: var(--text-muted); }
.item-subtotal { font-size: 14px; font-weight: 700; color: #1D9E75; white-space: nowrap; }

/* BARRA DE PROGRESO */
.progreso-wrap { padding: 8px 0 4px; }
.progreso-bar { position: relative; display: flex; justify-content: space-between; align-items: flex-start; padding: 0 14px; }
.progreso-linea { position: absolute; top: 14px; left: 28px; right: 28px; height: 3px; background: var(--border); border-radius: 999px; z-index: 0; }
.progreso-fill { height: 100%; background: linear-gradient(90deg, #378ADD, #7C3AED, #1D9E75); border-radius: 999px; transition: width 0.6s ease; }
.paso { display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1; flex: 1; }
.paso-circulo { width: 30px; height: 30px; border-radius: 50%; background: var(--bg-card); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--text-muted); transition: all 0.3s; }
.paso.activo    .paso-circulo { border-color: #378ADD; background: rgba(55,138,221,0.15); color: #378ADD; }
.paso-0.activo .paso-circulo { border-color: #378ADD; background: rgba(55,138,221,0.15); color: #378ADD; }
.paso-1.activo .paso-circulo { border-color: #EF9F27; background: rgba(239,159,39,0.15); color: #EF9F27; }
.paso-2.activo .paso-circulo { border-color: #7C3AED; background: rgba(124,58,237,0.15); color: #7C3AED; }
.paso-3.activo .paso-circulo { border-color: #1D9E75; background: rgba(29,158,117,0.15); color: #1D9E75; }
.paso-0.activo .paso-label   { color: #378ADD; font-weight: 700; }
.paso-1.activo .paso-label   { color: #EF9F27; font-weight: 700; }
.paso-2.activo .paso-label   { color: #7C3AED; font-weight: 700; }
.paso-3.activo .paso-label   { color: #1D9E75; font-weight: 700; }
.paso.completado .paso-circulo { border-color: #1D9E75; background: #1D9E75; color: #fff; }
.paso-label { font-size: 11px; color: var(--text-muted); text-align: center; white-space: nowrap; font-weight: 500; }
.paso.activo    .paso-label { color: #378ADD; font-weight: 700; }
.paso.completado .paso-label { color: #1D9E75; }
.grupo-footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--row-border); }
.grupo-pago { font-size: 12px; color: var(--text-muted); }

/* FILTROS */
.filtros-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; }
.search-input { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 10px; padding: 10px 14px 10px 36px; font-size: 14px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
.search-input:focus { border-color: rgba(55,138,221,0.5); }
.filtro-btns { display: flex; gap: 8px; }
.filtro-btn { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px; font-size: 13px; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.filtro-btn.active { background: rgba(55,138,221,0.15); border-color: rgba(55,138,221,0.4); color: #378ADD; font-weight: 600; }

/* CARRITO */
.form-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
.form-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; }
.empty-carrito { text-align: center; padding: 32px; color: var(--text-muted); }
.empty-carrito span { font-size: 40px; display: block; margin-bottom: 8px; }
.carrito-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--row-border); }
.carrito-emoji { font-size: 28px; flex-shrink: 0; }
.carrito-info { flex: 1; }
.carrito-nombre { display: block; font-size: 14px; font-weight: 500; color: var(--text-primary); }
.carrito-precio-unit { font-size: 12px; color: var(--text-muted); }
.carrito-controles { display: flex; align-items: center; gap: 8px; }
.ctrl-btn { background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; font-size: 16px; cursor: pointer; color: var(--text-primary); }
.ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ctrl-num { font-size: 14px; font-weight: 600; color: var(--text-primary); min-width: 24px; text-align: center; }
.carrito-subtotal { font-size: 14px; font-weight: 700; color: #1D9E75; min-width: 64px; text-align: right; }
.btn-quitar { background: rgba(226,75,74,0.1); border: 1px solid rgba(226,75,74,0.2); border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #E24B4A; cursor: pointer; }
.carrito-resumen { background: var(--bg-card-hover); border-radius: 12px; padding: 16px; margin-top: 16px; }
.resumen-row-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 14px; color: var(--text-secondary); }
.resumen-label { color: var(--text-muted); }
.resumen-valor { font-weight: 500; }
.resumen-divider { height: 1px; background: var(--border); margin: 10px 0; }
.total-final { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.total-grande { font-family: 'Syne', sans-serif; font-size: 22px; color: #1D9E75; }
.carrito-acciones { display: flex; gap: 10px; margin-top: 16px; }
.btn-vaciar { flex: 1; background: rgba(226,75,74,0.1); border: 1px solid rgba(226,75,74,0.2); border-radius: 10px; padding: 11px; font-size: 13px; color: #E24B4A; cursor: pointer; font-family: 'DM Sans', sans-serif; }
.btn-confirmar { flex: 2; background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 10px; padding: 11px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; }
.btn-confirmar:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-confirmar:disabled { opacity: 0.45; cursor: not-allowed; }

/* BANNERS */
.error-banner { display: flex; align-items: center; gap: 12px; background: rgba(226,75,74,0.1); border: 1px solid rgba(226,75,74,0.25); border-radius: 12px; padding: 12px 20px; margin-bottom: 20px; font-size: 14px; color: #E24B4A; }

/* GRID PRODUCTOS */
.productos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 20px; }
.producto-card { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: all 0.2s; }
.producto-card:hover:not(.agotado) { border-color: rgba(55,138,221,0.35); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.producto-card.agotado { opacity: 0.65; }
.producto-img { background: var(--bg-card-hover); display: flex; align-items: center; justify-content: center; padding: 28px; cursor: pointer; position: relative; overflow: hidden; }
.producto-emoji { font-size: 52px; transition: transform 0.2s; }
.producto-img:hover .producto-emoji { transform: scale(1.1); }
.agotado-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #fff; letter-spacing: 0.1em; }
.hover-ver { position: absolute; inset: 0; background: rgba(55,138,221,0.15); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #378ADD; opacity: 0; transition: opacity 0.2s; }
.producto-img:hover .hover-ver { opacity: 1; }
.producto-info { padding: 14px 16px; flex: 1; }
.producto-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.stock-badge { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 999px; }
.stock-badge.ok      { background: rgba(29,158,117,0.15); color: #1D9E75; border: 1px solid rgba(29,158,117,0.3); }
.stock-badge.agotado { background: rgba(226,75,74,0.12);  color: #E24B4A; border: 1px solid rgba(226,75,74,0.25); }
.en-carrito-badge { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 999px; background: rgba(55,138,221,0.15); color: #378ADD; border: 1px solid rgba(55,138,221,0.3); }
.producto-nombre { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 5px; }
.producto-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 10px; line-height: 1.5; }
.producto-footer { display: flex; justify-content: space-between; align-items: center; }
.producto-precio { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #1D9E75; }
.producto-acciones { display: flex; gap: 8px; padding: 0 14px 14px; }
.btn-detalle { flex: 1; background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: 8px; padding: 9px; font-size: 12px; font-weight: 500; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.btn-detalle:hover:not(:disabled) { background: rgba(55,138,221,0.1); color: #378ADD; border-color: rgba(55,138,221,0.3); }
.btn-detalle:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-agregar { flex: 2; background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 8px; padding: 9px; font-size: 12px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; transition: opacity 0.2s; }
.btn-agregar:disabled { opacity: 0.4; cursor: not-allowed; background: var(--bg-card-hover); color: var(--text-muted); border: 1px solid var(--border); }
.empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
.empty-state span { font-size: 48px; display: block; margin-bottom: 12px; }
.btn-primary { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 10px; padding: 10px 24px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; margin-top: 12px; }

/* MODAL */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; width: 100%; max-width: 480px; position: relative; overflow: hidden; }
.modal-close { position: absolute; top: 14px; right: 14px; background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 14px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; z-index: 1; }
.modal-img { background: var(--bg-card-hover); display: flex; align-items: center; justify-content: center; padding: 36px; position: relative; }
.modal-emoji { font-size: 72px; }
.modal-stock-badge { position: absolute; bottom: 12px; right: 12px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
.modal-stock-badge.ok      { background: rgba(29,158,117,0.2); color: #1D9E75; border: 1px solid rgba(29,158,117,0.4); }
.modal-stock-badge.agotado { background: rgba(226,75,74,0.15); color: #E24B4A; border: 1px solid rgba(226,75,74,0.3); }
.modal-body { padding: 24px; }
.modal-nombre { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
.modal-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px; }
.modal-detalles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.detalle-item { background: var(--bg-card-hover); border-radius: 10px; padding: 12px; }
.detalle-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 4px; }
.detalle-valor { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.detalle-valor.precio { color: #1D9E75; font-family: 'Syne', sans-serif; font-size: 18px; }
.modal-cantidad-row { margin-bottom: 20px; }
.cantidad-control { display: flex; align-items: center; gap: 16px; margin: 10px 0 8px; }
.ctrl-btn-lg { background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: 8px; width: 36px; height: 36px; font-size: 20px; cursor: pointer; color: var(--text-primary); }
.ctrl-btn-lg:disabled { opacity: 0.4; cursor: not-allowed; }
.cantidad-num { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--text-primary); min-width: 32px; text-align: center; }
.cantidad-subtotal { font-size: 13px; color: var(--text-muted); }
.cantidad-subtotal strong { color: #1D9E75; }
.sin-stock-msg { background: rgba(226,75,74,0.1); border: 1px solid rgba(226,75,74,0.2); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #E24B4A; margin-bottom: 14px; }
.btn-agregar-modal { width: 100%; padding: 14px; background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 12px; font-size: 14px; font-weight: 700; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; }
.btn-agregar-modal:disabled { opacity: 0.4; cursor: not-allowed; background: var(--bg-card-hover); color: var(--text-muted); border: 1px solid var(--border); }

/* TRANSICIONES */
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

@media (max-width: 768px) {
  .productos-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; gap: 12px; }
  .header-actions { width: 100%; justify-content: space-between; }
  .modal-detalles { grid-template-columns: 1fr 1fr; }
  .grupo-header { flex-direction: column; gap: 12px; }
  .grupo-right { justify-content: space-between; width: 100%; }
}

.field-pago  { margin: 16px 0 8px; }
.pago-label  { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; }
.select-pago { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 10px; padding: 10px 14px; font-size: 14px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; cursor: pointer; }
.select-pago:focus { border-color: rgba(55,138,221,0.5); }
.pago-hint   { font-size: 12px; color: #EF9F27; margin-top: 6px; text-align: center; }

/* RESUMEN DE ORDEN */
.resumen-orden   { background: var(--bg-card); border: 1px solid rgba(29,158,117,0.3); border-radius: 20px; padding: 36px; max-width: 540px; margin: 0 auto 32px; }
.resumen-header  { text-align: center; margin-bottom: 28px; }
.resumen-check   { font-size: 52px; display: block; margin-bottom: 12px; }
.resumen-titulo  { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
.resumen-codigo  { font-size: 13px; color: var(--text-muted); margin-bottom: 4px; }
.resumen-fecha-txt { font-size: 12px; color: var(--text-muted); }
.resumen-items   { background: var(--bg-card-hover); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
.resumen-item    { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--row-border); }
.resumen-item:last-child { border-bottom: none; }
.ri-img    { width: 36px; height: 36px; border-radius: 6px; background: var(--bg-card); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; font-size: 20px; }
.ri-foto   { width: 100%; height: 100%; object-fit: contain; padding: 2px; }
.ri-info   { flex: 1; }
.ri-nombre { display: block; font-size: 14px; font-weight: 600; color: var(--text-primary); }
.ri-detalle{ font-size: 12px; color: var(--text-muted); }
.ri-sub    { font-size: 14px; font-weight: 700; color: #1D9E75; white-space: nowrap; }
.resumen-footer { margin-bottom: 24px; }
.rf-row    { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: var(--text-secondary); border-bottom: 1px solid var(--row-border); }
.rf-row.total { font-size: 16px; font-weight: 700; color: var(--text-primary); border-bottom: none; padding-top: 12px; }
.rf-total  { font-family: 'Syne', sans-serif; font-size: 24px; color: #1D9E75; }
.resumen-acciones { display: flex; gap: 12px; }
.btn-secondary { flex: 1; background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: 10px; padding: 11px; font-size: 13px; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; }
.btn-secondary:hover { color: var(--text-primary); }
</style>