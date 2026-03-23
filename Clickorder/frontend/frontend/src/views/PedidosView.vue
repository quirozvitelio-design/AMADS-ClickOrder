<template>
  <div class="page-root">
    <div class="bg-grid"></div>

    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Pedidos</h1>
          <p class="page-sub">Administra todos los pedidos del sistema</p>
        </div>
        <button @click="mostrarForm = !mostrarForm" class="btn-primary">
          {{ mostrarForm ? 'Cancelar' : '+ Nuevo pedido' }}
        </button>
      </div>

      <div v-if="mostrarForm" class="form-card">
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
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
          <div class="field" style="max-width:120px">
            <label>Cantidad</label>
            <input v-model="form.cantidad" type="number" min="1" placeholder="1" />
          </div>
          <button @click="guardar" class="btn-primary" style="align-self:flex-end">
            Crear pedido
          </button>
        </div>
      </div>

      <div class="resumen-row">
        <div class="resumen-card">
          <span class="resumen-label">Total pedidos</span>
          <span class="resumen-num">{{ pedidos.length }}</span>
        </div>
        <div class="resumen-card">
          <span class="resumen-label">Ingresos totales</span>
          <span class="resumen-num verde">${{ totalIngresos }}</span>
        </div>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pedidos.length === 0">
              <td colspan="7" class="empty">No hay pedidos registrados</td>
            </tr>
            <tr v-for="p in pedidos" :key="p.id">
              <td class="id-col">#{{ p.id }}</td>
              <td>{{ p.usuario }}</td>
              <td>{{ p.producto }}</td>
              <td class="muted">${{ p.precio }}</td>
              <td><span class="cantidad-badge">× {{ p.cantidad }}</span></td>
              <td class="total-col">${{ p.total }}</td>
              <td>
                <button @click="eliminar(p.id)" class="btn-delete">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import api from "../api/axios"

const pedidos    = ref([])
const usuarios   = ref([])
const productos  = ref([])
const mostrarForm = ref(false)
const form = ref({ usuario_id: "", producto_id: "", cantidad: 1 })

const totalIngresos = computed(() =>
  pedidos.value.reduce((sum, p) => sum + Number(p.total), 0).toFixed(2)
)

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

async function guardar() {
  await api.post("/pedidos", form.value)
  form.value        = { usuario_id: "", producto_id: "", cantidad: 1 }
  mostrarForm.value = false
  cargar()
}

async function eliminar(id) {
  if (confirm("¿Eliminar este pedido?")) {
    await api.delete(`/pedidos/${id}`)
    cargar()
  }
}

onMounted(cargar)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

.page-root {
  min-height: 100vh;
  background: var(--bg-base);
  font-family: 'DM Sans', sans-serif;
  position: relative;
}
.bg-grid {
  position: fixed; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 100%);
}
.page-content {
  position: relative; z-index: 1;
  max-width: 1100px; margin: 0 auto; padding: 40px 24px;
}
.page-header {
  display: flex; justify-content: space-between;
  align-items: flex-start; margin-bottom: 24px;
}
.page-title {
  font-family: 'Syne', sans-serif; font-size: 32px;
  font-weight: 800; color: var(--text-primary); margin-bottom: 4px;
}
.page-sub { font-size: 14px; color: var(--text-muted); }

.resumen-row { display: flex; gap: 16px; margin-bottom: 24px; }
.resumen-card {
  flex: 1; background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 12px; padding: 16px 20px;
  display: flex; flex-direction: column; gap: 4px;
}
.resumen-label {
  font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--text-muted);
}
.resumen-num {
  font-family: 'Syne', sans-serif; font-size: 26px;
  font-weight: 700; color: var(--text-primary);
}
.resumen-num.verde { color: #1D9E75; }

.form-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px; padding: 24px; margin-bottom: 24px;
  animation: fadeUp 0.3s ease both;
}
.form-title {
  font-family: 'Syne', sans-serif; font-size: 16px;
  font-weight: 600; color: var(--text-primary); margin-bottom: 16px;
}
.form-row { display: flex; gap: 12px; flex-wrap: wrap; }

.field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 160px; }
.field label {
  font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--text-muted);
}
.field input, .field select {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 10px; padding: 10px 14px;
  font-size: 14px; color: var(--text-primary);
  font-family: 'DM Sans', sans-serif; outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.field input::placeholder { color: var(--text-muted); }
.field input:focus, .field select:focus {
  border-color: rgba(55,138,221,0.5);
  background: rgba(55,138,221,0.07);
}
.field select option { background: var(--bg-base); color: var(--text-primary); }

.btn-primary {
  background: linear-gradient(135deg, #378ADD, #1D9E75);
  border: none; border-radius: 10px; padding: 10px 20px;
  font-size: 13px; font-weight: 600; color: #fff;
  cursor: pointer; font-family: 'Syne', sans-serif;
  white-space: nowrap; transition: opacity 0.2s, transform 0.1s;
}
.btn-primary:hover  { opacity: 0.9; }
.btn-primary:active { transform: scale(0.98); }

.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 16px; overflow: hidden;
}
table { width: 100%; border-collapse: collapse; }
thead tr { background: var(--thead-bg); }
th {
  padding: 14px 16px; text-align: left;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-muted);
}
tbody tr {
  border-top: 1px solid var(--row-border);
  transition: background 0.15s;
}
tbody tr:hover { background: var(--row-hover); }
td { padding: 13px 16px; font-size: 14px; color: var(--text-secondary); }
.id-col    { color: var(--text-muted); font-size: 12px; font-family: monospace; }
.muted     { color: var(--text-muted); }
.total-col { color: #1D9E75; font-weight: 600; }
.empty {
  text-align: center; color: var(--text-muted);
  padding: 40px !important;
}

.cantidad-badge {
  background: rgba(55,138,221,0.15); border: 1px solid rgba(55,138,221,0.25);
  border-radius: 6px; padding: 3px 8px; font-size: 12px; color: #378ADD;
}
.btn-delete {
  background: rgba(226,75,74,0.12); border: 1px solid rgba(226,75,74,0.25);
  border-radius: 6px; padding: 5px 12px; font-size: 12px; color: #E24B4A;
  cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
}
.btn-delete:hover { background: rgba(226,75,74,0.22); }

@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
</style>