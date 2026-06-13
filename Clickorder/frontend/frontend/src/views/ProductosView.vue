<template>
  <div class="page-root">
    <div class="bg-grid"></div>

    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Productos</h1>
          <p class="page-sub">Gestiona el catálogo e inventario del sistema</p>
        </div>
        <button v-if="esAdmin" @click="alternarFormulario" class="btn-primary">
          {{ mostrarForm ? 'Cancelar' : '+ Nuevo producto' }}
        </button>
      </div>

      <div class="search-container">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="filtroBusqueda" 
            type="text" 
            placeholder="Buscar por nombre de producto..." 
            class="search-input"
          />
          <button v-if="filtroBusqueda" @click="filtroBusqueda = ''" class="btn-clear-search">✕</button>
        </div>
      </div>

      <div v-if="esAdmin && mostrarForm" class="form-card animate-fade">
        <h2 class="form-title">{{ editando ? 'Editar producto' : 'Nuevo producto' }}</h2>

        <div class="form-row">
          <div class="field">
            <label>Nombre *</label>
            <input v-model="form.nombre" type="text" placeholder="Nombre del producto" />
          </div>
          <div class="field size-m">
            <label>Precio ($) *</label>
            <input v-model="form.precio" type="number" placeholder="0.00" min="0" step="0.01" />
          </div>
          <div class="field size-s">
            <label>Stock</label>
            <input v-model="form.stock" type="number" placeholder="0" min="0" />
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>URL de la Imagen o Emoji base</label>
            <div class="img-input-wrap">
              <input v-model="form.imagen_url" type="text" placeholder="https://ejemplo.com/imagen.jpg o un emoji como 🍕" />
              <button v-if="form.imagen_url" @click="form.imagen_url = ''" class="btn-clear-img" title="Limpiar">✕</button>
            </div>
            <p class="field-hint">Puedes pegar un enlace web de imagen directo o escribir un Emoji que sirva como ícono representativo.</p>
          </div>

          <div class="img-preview-wrap" v-if="form.imagen_url">
            <div class="img-preview">
              <img v-if="esUrl(form.imagen_url)" :src="form.imagen_url" alt="Preview" />
              <span v-else class="preview-emoji">{{ form.imagen_url }}</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="guardarProducto" :disabled="guardando" class="btn-submit">
            {{ guardando ? 'Guardando...' : (editando ? 'Actualizar cambios' : 'Crear Producto') }}
          </button>
        </div>
      </div>

      <div class="tabla-card">
        <div class="table-responsive">
          <table class="productos-table">
            <thead>
              <tr>
                <th class="center-col">Visual</th>
                <th>Nombre del Producto</th>
                <th>Precio Unitario</th>
                <th>Existencias</th>
                <th v-if="esAdmin" class="right-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in productosFiltrados" :key="p.id">
                <td class="center-col vert-align">
                  <div class="tabla-img-box" v-if="p.imagen_url && esUrl(p.imagen_url)">
                    <img :src="p.imagen_url" alt="Producto" />
                  </div>
                  <span v-else-if="p.imagen_url" class="tabla-emoji">{{ p.imagen_url }}</span>
                  <span v-else class="tabla-emoji">📦</span>
                </td>

                <td class="font-semibold text-primary vert-align">{{ p.nombre }}</td>

                <td class="font-mono text-secondary vert-align">${{ parseFloat(p.precio).toFixed(2) }}</td>

                <td class="vert-align">
                  <span :class="['stock-badge', p.stock === 0 ? 'agotado' : 'ok']">
                    {{ p.stock === 0 ? 'Agotado' : p.stock + ' unidades' }}
                  </span>
                </td>

                <td v-if="esAdmin" class="right-col vert-align">
                  <div class="actions-wrapper">
                    <button @click="prepararEdicion(p)" class="btn-edit" title="Editar">✏️ Editar</button>
                    <button @click="eliminarProducto(p.id)" class="btn-delete" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
              <tr v-if="productosFiltrados.length === 0">
                <td :colspan="esAdmin ? 5 : 4" class="empty-state">
                  <span>🔍</span>
                  <p>No se encontraron productos que coincidan con tu búsqueda.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue" // 🌟 Agregado computed
import clickOrderApi from "../api/axios"

const productos = ref([])
const esAdmin = ref(false)

// 🌟 NUEVO: Variable reactiva que guarda el texto de búsqueda del input
const filtroBusqueda = ref("")

const mostrarForm = ref(false)
const editando = ref(false)
const guardando = ref(false)

const form = ref({ id: null, nombre: "", precio: "", stock: 0, imagen_url: "" })

onMounted(() => {
  const usuario = JSON.parse(localStorage.getItem("usuario"))
  if (usuario && usuario.rol === "admin") {
    esAdmin.value = true
  }
  cargarProductos()
})

// 🌟 NUEVA PROPIEDAD COMPUTADA: Filtra de manera eficiente y en tiempo real sin llamar a la API
const productosFiltrados = computed(() => {
  if (!filtroBusqueda.value.trim()) {
    return productos.value
  }
  return productos.value.filter(producto => 
    producto.nombre.toLowerCase().includes(filtroBusqueda.value.toLowerCase())
  )
})

async function cargarProductos() {
  try {
    const res = await clickOrderApi.get("/productos")
    productos.value = res.data
  } catch (err) {
    console.error("Error al cargar productos:", err)
  }
}

// Lógica de formulario
function alternarFormulario() {
  mostrarForm.value = !mostrarForm.value
  if (!mostrarForm.value) resetForm()
}

function resetForm() {
  editando.value = false
  form.value = { id: null, nombre: "", precio: "", stock: 0, imagen_url: "" }
}

function esUrl(str) {
  if (!str) return false
  return str.startsWith("http://") || str.startsWith("https://")
}

function prepararEdicion(p) {
  editando.value = true
  form.value = { ...p }
  mostrarForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function guardarProducto() {
  if (!form.value.nombre || form.value.precio === "") {
    alert("Por favor completa los campos obligatorios (*)")
    return
  }

  try {
    guardando.value = true
    if (editando.value) {
      await clickOrderApi.put(`/productos/${form.value.id}`, form.value)
    } else {
      await clickOrderApi.post("/productos", form.value)
    }
    resetForm()
    mostrarForm.value = false
    cargarProductos()
  } catch (err) {
    console.error("Error al guardar producto:", err)
    alert("Hubo un error al procesar el producto.")
  } finally {
    guardando.value = false
  }
}

async function eliminarProducto(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar este producto permanentemente?")) return
  try {
    await clickOrderApi.delete(`/productos/${id}`)
    cargarProductos()
  } catch (err) {
    console.error("Error al eliminar producto:", err)
    alert("No se pudo eliminar el producto (puede estar asociado a un pedido activo).")
  }
}
</script>

<style scoped>
/* 🌟 NUEVOS ESTILOS PARA LA BARRA DE BÚSQUEDA */
.search-container {
  margin-bottom: 20px;
  width: 100%;
}
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 450px;
  width: 100%;
}
.search-icon {
  position: absolute;
  left: 14px;
  font-size: 14px;
  color: var(--text-muted);
}
.search-input {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  color: var(--text-primary);
  padding: 12px 40px 12px 40px;
  border-radius: 12px;
  font-size: 15px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: all 0.2s ease;
}
.search-input:focus {
  border-color: #378ADD;
  box-shadow: 0 0 0 3px rgba(55, 138, 221, 0.15);
  background: var(--bg-base);
}
.btn-clear-search {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
}
.btn-clear-search:hover {
  color: var(--text-primary);
}

/* ----- ESTILOS ORIGINALES CONSERVADOS ----- */
.btn-primary {
  background: linear-gradient(135deg, #378ADD, #1D9E75);
  border: none; color: #fff; padding: 10px 20px;
  border-radius: 10px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Syne', sans-serif; transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.9; }

.form-card {
  background: var(--bg-card); border: 1px solid var(--border-soft);
  border-radius: 16px; padding: 24px; margin-bottom: 24px;
}
.form-title {
  font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
  color: var(--text-primary); margin-bottom: 20px; text-transform: uppercase;
}
.form-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.field { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px; }
.field.size-m { max-width: 160px; }
.field.size-s { max-width: 120px; }

.field label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.field input {
  background: var(--bg-base); border: 1px solid var(--border);
  color: var(--text-primary); padding: 10px 14px; border-radius: 8px;
  font-size: 13px; outline: none; font-family: 'DM Sans', sans-serif;
}
.field input:focus { border-color: #378ADD; }

.img-input-wrap { position: relative; display: flex; align-items: center; }
.img-input-wrap input { width: 100%; padding-right: 36px; }
.btn-clear-img {
  position: absolute; right: 10px; background: rgba(226,75,74,0.12);
  border: none; border-radius: 50%; width: 20px; height: 20px;
  color: #E24B4A; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center;
}
.field-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; line-height: 1.4; }

.img-preview-wrap { display: flex; align-items: flex-start; }
.img-preview {
  width: 56px; height: 56px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--bg-card-hover); overflow: hidden; display: flex; align-items: center; justify-content: center;
}
.img-preview img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
.preview-emoji { font-size: 26px; }

.form-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
.btn-submit {
  background: var(--text-primary); color: var(--bg-base); border: none;
  padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-submit:disabled { opacity: 0.5; }

.tabla-card {
  background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 16px; overflow: hidden;
}
.table-responsive { overflow-x: auto; }
.productos-table { width: 100%; border-collapse: collapse; text-align: left; }
.productos-table th {
  padding: 14px 18px; font-size: 16px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-soft);
}
.productos-table td { padding: 14px 18px; font-size: 17px; border-bottom: 1px solid var(--border-soft); }
.vert-align { vertical-align: middle; }

.center-col { text-align: center; width: 80px; }
.right-col { text-align: right; }

.tabla-img-box {
  width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border);
  display: inline-flex; align-items: center; justify-content: center; background: #fff; overflow: hidden;
}
.tabla-img-box img { width: 100%; height: 100%; object-fit: contain; padding: 2px; }
.tabla-emoji { font-size: 20px; display: inline-block; }

.font-semibold { font-weight: 600; }
.font-mono { font-family: monospace; font-size: 14px; }
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }

.stock-badge { font-size: 15px; font-weight: 500; padding: 3px 10px; border-radius: 999px; }
.stock-badge.ok { background: rgba(29,158,117,0.12); color: #1D9E75; border: 1px solid rgba(29,158,117,0.25); }
.stock-badge.agotado { background: rgba(226,75,74,0.12); color: #E24B4A; border: 1px solid rgba(226,75,74,0.25); }

.actions-wrapper { display: flex; gap: 8px; justify-content: flex-end; }
.btn-edit {
  background: rgba(55,138,221,0.12); border: 1px solid rgba(55,138,221,0.25);
  border-radius: 6px; padding: 5px 12px; font-size: 15px; color: #378ADD; cursor: pointer; font-weight: 500;
}
.btn-edit:hover { background: rgba(55,138,221,0.2); }
.btn-delete {
  background: rgba(226,75,74,0.1); border: 1px solid rgba(226,75,74,0.2);
  border-radius: 6px; padding: 5px 10px; font-size: 12px; color: #E24B4A; cursor: pointer;
}
.btn-delete:hover { background: rgba(226,75,74,0.2); }

.empty-state { text-align: center; color: var(--text-muted); padding: 48px !important; }
.empty-state span { font-size: 32px; display: block; margin-bottom: 8px; }

.animate-fade { animation: fadeUp 0.2s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
</style>