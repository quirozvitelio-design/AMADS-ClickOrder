<template>
  <div class="page-root">
    <div class="bg-grid"></div>

    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Productos</h1>
          <p class="page-sub">Gestiona el catálogo de productos</p>
        </div>
        <button v-if="esAdmin" @click="mostrarForm = !mostrarForm" class="btn-primary">
          {{ mostrarForm ? 'Cancelar' : '+ Nuevo producto' }}
        </button>
      </div>

      <div v-if="esAdmin && mostrarForm" class="form-card">
        <h2 class="form-title">{{ editando ? 'Editar producto' : 'Nuevo producto' }}</h2>
        <div class="form-row">
          <div class="field">
            <label>Nombre</label>
            <input v-model="form.nombre" type="text" placeholder="Nombre del producto" />
          </div>
          <div class="field">
            <label>Precio ($)</label>
            <input v-model="form.precio" type="number" placeholder="0.00" />
          </div>
          <button @click="guardar" class="btn-primary" style="align-self:flex-end">
            {{ editando ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th v-if="esAdmin">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="productos.length === 0">
              <td :colspan="esAdmin ? 4 : 3" class="empty">No hay productos registrados</td>
            </tr>
            <tr v-for="p in productos" :key="p.id">
              <td class="id-col">#{{ p.id }}</td>
              <td>{{ p.nombre }}</td>
              <td class="precio-col">${{ p.precio }}</td>
              <td v-if="esAdmin">
                <div class="actions">
                  <button @click="editar(p)" class="btn-edit">Editar</button>
                  <button @click="eliminar(p.id)" class="btn-delete">Eliminar</button>
                </div>
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

const productos   = ref([])
const form        = ref({ nombre: "", precio: "" })
const editando    = ref(null)
const mostrarForm = ref(false)

const usuario = JSON.parse(localStorage.getItem("usuario"))
const esAdmin = computed(() => usuario?.rol === "admin")

async function cargar() {
  const res = await api.get("/productos")
  productos.value = res.data
}

async function guardar() {
  if (editando.value) {
    await api.put(`/productos/${editando.value}`, form.value)
  } else {
    await api.post("/productos", form.value)
  }
  form.value        = { nombre: "", precio: "" }
  editando.value    = null
  mostrarForm.value = false
  cargar()
}

function editar(p) {
  form.value        = { nombre: p.nombre, precio: p.precio }
  editando.value    = p.id
  mostrarForm.value = true
}

async function eliminar(id) {
  if (confirm("¿Eliminar este producto?")) {
    await api.delete(`/productos/${id}`)
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
  max-width: 960px; margin: 0 auto; padding: 40px 24px;
}
.page-header {
  display: flex; justify-content: space-between;
  align-items: flex-start; margin-bottom: 32px;
}
.page-title {
  font-family: 'Syne', sans-serif; font-size: 32px;
  font-weight: 800; color: var(--text-primary); margin-bottom: 4px;
}
.page-sub { font-size: 14px; color: var(--text-muted); }

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

.field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px; }
.field label {
  font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--text-muted);
}
.field input {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 10px; padding: 10px 14px;
  font-size: 14px; color: var(--text-primary);
  font-family: 'DM Sans', sans-serif; outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.field input::placeholder { color: var(--text-muted); }
.field input:focus {
  border-color: rgba(55,138,221,0.5);
  background: rgba(55,138,221,0.07);
}

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
  padding: 14px 18px; text-align: left;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-muted);
}
tbody tr {
  border-top: 1px solid var(--row-border);
  transition: background 0.15s;
}
tbody tr:hover { background: var(--row-hover); }
td { padding: 14px 18px; font-size: 14px; color: var(--text-secondary); }
.id-col    { color: var(--text-muted); font-size: 12px; font-family: monospace; }
.precio-col { color: #1D9E75; font-weight: 500; }
.empty {
  text-align: center; color: var(--text-muted);
  padding: 40px !important;
}

.actions { display: flex; gap: 8px; }
.btn-edit {
  background: rgba(55,138,221,0.15); border: 1px solid rgba(55,138,221,0.3);
  border-radius: 6px; padding: 5px 12px; font-size: 12px; color: #378ADD;
  cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
}
.btn-edit:hover { background: rgba(55,138,221,0.25); }
.btn-delete {
  background: rgba(226,75,74,0.12); border: 1px solid rgba(226,75,74,0.25);
  border-radius: 6px; padding: 5px 12px; font-size: 12px; color: #E24B4A;
  cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
}
.btn-delete:hover { background: rgba(226,75,74,0.22); }

@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
</style>