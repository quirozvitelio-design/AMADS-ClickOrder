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
            <label>Nombre *</label>
            <input v-model="form.nombre" type="text" placeholder="Nombre del producto" />
          </div>
          <div class="field">
            <label>Precio ($) *</label>
            <input v-model="form.precio" type="number" placeholder="0.00" min="0" step="0.01" />
          </div>
          <div class="field">
            <label>Stock</label>
            <input v-model="form.stock" type="number" placeholder="0" min="0" />
          </div>
        </div>
        <div class="form-row" style="margin-top:12px">
          <div class="field" style="flex:1">
            <label>Descripción</label>
            <input v-model="form.descripcion" type="text" placeholder="Descripción del producto (opcional)" />
          </div>
          <button @click="guardar" class="btn-primary" style="align-self:flex-end" :disabled="!form.nombre || !form.precio">
            {{ editando ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
        <div class="form-row" style="margin-top:12px">
  <div class="field" style="flex:1">
    <label>
      URL de imagen
      <span class="label-opt">(opcional)</span>
    </label>
    <div class="img-input-wrap">
      <input
        v-model="form.imagen"
        type="text"
        placeholder="https://ejemplo.com/imagen.jpg" />
      <button
        v-if="form.imagen"
        type="button"
        @click="form.imagen = ''"
        class="btn-clear-img">✕</button>
    </div>
    <p class="field-hint">
      Clic derecho en Google Imágenes → Copiar dirección de imagen
    </p>
  </div>
  <div class="img-preview-wrap">
    <div class="img-preview" :class="{ 'img-placeholder': !form.imagen || !imagenValida }">
      <img
        v-if="form.imagen && imagenValida"
        :src="form.imagen"
        alt="Preview" />
      <span v-else style="font-size:28px">📦</span>
      <span class="preview-label">Preview</span>
    </div>
  </div>
</div>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Imagen</th>
              <th v-if="esAdmin">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="productos.length === 0">
              <td :colspan="esAdmin ? 6 : 5" class="empty">No hay productos registrados</td>
            </tr>
            <tr v-for="p in productos" :key="p.id">
              <td class="id-col">#{{ p.id }}</td>
              <td>{{ p.nombre }}</td>
              <td class="muted">{{ p.descripcion || '—' }}</td>
              <td class="precio-col">${{ p.precio }}</td>
              <td>
                <span :class="['stock-badge', p.stock > 0 ? 'ok' : 'agotado']">
                  {{ p.stock > 0 ? p.stock + ' uds' : 'Agotado' }}
                </span>
              </td>
              <td class="img-col">
                <div class="tabla-img">
                  <img
                  v-if="p.imagen"
                  :src="p.imagen"
                  :alt="p.nombre"
                  @error="$event.target.style.display = 'none'" />
                  <span v-else class="tabla-emoji">📦</span>
                </div>
              </td>
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
import { ref, onMounted, computed, watch } from "vue"
import api from "../api/axios"

const productos   = ref([])
const form = ref({ nombre: "", descripcion: "", precio: "", stock: 0, imagen: "" })
const editando    = ref(null)
const mostrarForm = ref(false)
const error       = ref("")
const imagenValida = ref(false)

watch(() => form.value.imagen, (nueva) => {
  if (!nueva) { imagenValida.value = false; return }
  const img   = new Image()
  img.onload  = () => { imagenValida.value = true }
  img.onerror = () => { imagenValida.value = false }
  img.src = nueva
})

const usuario = JSON.parse(localStorage.getItem("usuario"))
const esAdmin = computed(() => usuario?.rol === "admin")

async function cargar() {
  const res = await api.get("/productos")
  productos.value = res.data
}

async function guardar() {
  error.value = ""
  if (!form.value.nombre || !form.value.precio) {
    error.value = "Nombre y precio son obligatorios"
    return
  }
  try {
    // Forzar tipos correctos antes de enviar
    const payload = {
      nombre:      form.value.nombre,
      descripcion: form.value.descripcion || "",
      precio:      parseFloat(form.value.precio),
      stock:       parseInt(form.value.stock) || 0,
      imagen:      form.value.imagen || null
    }
    if (editando.value) {
      await api.put(`/productos/${editando.value}`, payload)
    } else {
      await api.post("/productos", payload)
    }
    form.value        = { nombre: "", descripcion: "", precio: "", stock: 0, imagen: "" }
    editando.value    = null
    mostrarForm.value = false
    cargar()
  } catch {
    error.value = "Error al guardar el producto"
  }
}

function editar(p) {
  form.value = {
    nombre:      p.nombre,
    descripcion: p.descripcion || "",
    precio:      parseFloat(p.precio),
    stock:       parseInt(p.stock) || 0,
    imagen:      p.imagen || ""
  }
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

.page-root { min-height: 100vh; background: var(--bg-base); font-family: 'DM Sans', sans-serif; position: relative; }
.bg-grid { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 100%); }
.page-content { position: relative; z-index: 1; max-width: 960px; margin: 0 auto; padding: 40px 24px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
.page-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.page-sub { font-size: 14px; color: var(--text-muted); }
.form-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 24px; animation: fadeUp 0.3s ease both; }
.form-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
.form-row { display: flex; gap: 12px; flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 160px; }
.field label { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }
.field input { background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 10px; padding: 10px 14px; font-size: 14px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
.field input::placeholder { color: var(--text-muted); }
.field input:focus { border-color: rgba(55,138,221,0.5); background: rgba(55,138,221,0.07); }
.error-msg { color: #E24B4A; font-size: 13px; margin-top: 10px; }
.btn-primary { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; white-space: nowrap; transition: opacity 0.2s, transform 0.1s; }
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.table-card { background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
thead tr { background: var(--thead-bg); }
th { padding: 14px 18px; text-align: left; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }
tbody tr { border-top: 1px solid var(--row-border); transition: background 0.15s; }
tbody tr:hover { background: var(--row-hover); }
td { padding: 14px 18px; font-size: 14px; color: var(--text-secondary); }
.id-col { color: var(--text-muted); font-size: 12px; font-family: monospace; }
.muted { color: var(--text-muted); font-size: 13px; }
.precio-col { color: #1D9E75; font-weight: 500; }
.empty { text-align: center; color: var(--text-muted); padding: 40px !important; }
.stock-badge { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 999px; }
.stock-badge.ok { background: rgba(29,158,117,0.15); color: #1D9E75; border: 1px solid rgba(29,158,117,0.3); }
.stock-badge.agotado { background: rgba(226,75,74,0.12); color: #E24B4A; border: 1px solid rgba(226,75,74,0.25); }
.actions { display: flex; gap: 8px; }
.btn-edit { background: rgba(55,138,221,0.15); border: 1px solid rgba(55,138,221,0.3); border-radius: 6px; padding: 5px 12px; font-size: 12px; color: #378ADD; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.btn-edit:hover { background: rgba(55,138,221,0.25); }
.btn-delete { background: rgba(226,75,74,0.12); border: 1px solid rgba(226,75,74,0.25); border-radius: 6px; padding: 5px 12px; font-size: 12px; color: #E24B4A; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.btn-delete:hover { background: rgba(226,75,74,0.22); }
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
/* CAMPO IMAGEN */
.label-opt       { font-size: 10px; text-transform: none; letter-spacing: 0; font-weight: 400; color: var(--text-muted); margin-left: 4px; }
.img-input-wrap  { position: relative; display: flex; align-items: center; }
.img-input-wrap input { width: 100%; padding-right: 36px; }
.btn-clear-img   { position: absolute; right: 10px; background: rgba(226,75,74,0.15); border: none; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #E24B4A; cursor: pointer; }
.field-hint      { font-size: 11px; color: var(--text-muted); margin-top: 4px; line-height: 1.5; }
.img-preview-wrap{ display: flex; align-items: flex-start; padding-top: 20px; }
.img-preview     { width: 90px; height: 90px; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-card-hover); flex-shrink: 0; }
.img-preview img { width: 100%; height: 72px; object-fit: contain; padding: 4px; }
.img-placeholder { gap: 4px; }
.preview-label   { font-size: 9px; color: var(--text-muted); text-align: center; }

/* THUMBNAIL EN TABLA */
.img-col   { width: 60px; }
.tabla-img { width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: var(--bg-card-hover); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; }
.tabla-img img { width: 100%; height: 100%; object-fit: contain; padding: 3px; }
.tabla-emoji   { font-size: 22px; }
</style>