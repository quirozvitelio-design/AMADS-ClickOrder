<template>
  <div class="page-root">
    <div class="bg-grid"></div>
    <div class="page-content">

      <div class="page-header">
        <div>
          <h1 class="page-title">Usuarios & Roles</h1>
          <p class="page-sub">Administra los accesos al sistema</p>
        </div>
      </div>

      <div class="tabs">
        <button :class="['tab-btn', tab === 'usuarios' ? 'active' : '']" @click="tab = 'usuarios'">
          Usuarios
        </button>
        <button :class="['tab-btn', tab === 'roles' ? 'active' : '']" @click="tab = 'roles'">
          Roles
        </button>
      </div>

      <!-- ===== USUARIOS ===== -->
      <div v-if="tab === 'usuarios'">
        <div class="section-header">
          <span class="section-count">{{ usuarios.length }} usuarios</span>
          <button @click="abrirFormUsuario()" class="btn-primary">+ Nuevo usuario</button>
        </div>

        <div v-if="formUsuario.visible" class="form-card">
          <h2 class="form-title">{{ formUsuario.editando ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
          <div class="form-grid">
            <div class="field">
              <label>Nombre</label>
              <input v-model="formUsuario.nombre" type="text" placeholder="Nombre completo" />
            </div>
            <div class="field">
              <label>Correo</label>
              <input v-model="formUsuario.correo" type="email" placeholder="correo@mail.com" />
            </div>
            <div class="field">
              <label>Contraseña</label>
              <input v-model="formUsuario.password" type="password" placeholder="••••••••" />
            </div>
            <div class="field">
              <label>Rol</label>
              <select v-model="formUsuario.rol_id">
                <option disabled value="">Selecciona rol</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.nombre }}</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button @click="guardarUsuario" class="btn-primary">
              {{ formUsuario.editando ? 'Actualizar' : 'Crear usuario' }}
            </button>
            <button @click="formUsuario.visible = false" class="btn-cancel">Cancelar</button>
          </div>
        </div>

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="usuarios.length === 0">
                <td colspan="5" class="empty">No hay usuarios registrados</td>
              </tr>
              <tr v-for="u in usuarios" :key="u.id">
                <td class="id-col">#{{ u.id }}</td>
                <td>{{ u.nombre }}</td>
                <td class="muted">{{ u.correo }}</td>
                <td>
                  <span :class="['rol-badge', u.rol === 'admin' ? 'admin' : 'cliente']">
                    {{ u.rol }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button @click="abrirFormUsuario(u)" class="btn-edit">Editar</button>
                    <button @click="eliminarUsuario(u.id)" class="btn-delete">Eliminar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== ROLES ===== -->
      <div v-if="tab === 'roles'">
        <div class="section-header">
          <span class="section-count">{{ roles.length }} roles</span>
          <button @click="abrirFormRol()" class="btn-primary">+ Nuevo rol</button>
        </div>

        <div v-if="formRol.visible" class="form-card">
          <h2 class="form-title">{{ formRol.editando ? 'Editar rol' : 'Nuevo rol' }}</h2>
          <div class="form-grid">
            <div class="field">
              <label>Nombre del rol</label>
              <input v-model="formRol.nombre" type="text" placeholder="Ej: supervisor" />
            </div>
          </div>
          <div class="form-actions">
            <button @click="guardarRol" class="btn-primary">
              {{ formRol.editando ? 'Actualizar' : 'Crear rol' }}
            </button>
            <button @click="formRol.visible = false" class="btn-cancel">Cancelar</button>
          </div>
        </div>

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Usuarios asignados</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="roles.length === 0">
                <td colspan="4" class="empty">No hay roles registrados</td>
              </tr>
              <tr v-for="r in roles" :key="r.id">
                <td class="id-col">#{{ r.id }}</td>
                <td>
                  <span :class="['rol-badge', r.nombre === 'admin' ? 'admin' : 'cliente']">
                    {{ r.nombre }}
                  </span>
                </td>
                <td class="muted">
                  {{ usuarios.filter(u => u.rol_id === r.id).length }} usuarios
                </td>
                <td>
                  <div class="actions">
                    <button @click="abrirFormRol(r)" class="btn-edit">Editar</button>
                    <button @click="eliminarRol(r.id)" class="btn-delete">Eliminar</button>
                  </div>
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
import { ref, onMounted } from "vue"
import api from "../api/axios"

const tab      = ref("usuarios")
const usuarios = ref([])
const roles    = ref([])

const formUsuario = ref({
  visible: false, editando: null,
  nombre: "", correo: "", password: "", rol_id: ""
})
const formRol = ref({
  visible: false, editando: null, nombre: ""
})

async function cargar() {
  const [u, r] = await Promise.all([api.get("/usuarios"), api.get("/roles")])
  usuarios.value = u.data
  roles.value    = r.data
}

function abrirFormUsuario(u = null) {
  formUsuario.value = u
    ? { visible: true, editando: u.id, nombre: u.nombre, correo: u.correo, password: u.password, rol_id: u.rol_id }
    : { visible: true, editando: null, nombre: "", correo: "", password: "", rol_id: "" }
}

async function guardarUsuario() {
  const { editando, nombre, correo, password, rol_id } = formUsuario.value
  if (editando) {
    await api.put(`/usuarios/${editando}`, { nombre, correo, password, rol_id })
  } else {
    await api.post("/usuarios", { nombre, correo, password, rol_id })
  }
  formUsuario.value.visible = false
  cargar()
}

async function eliminarUsuario(id) {
  if (confirm("¿Eliminar este usuario?")) {
    await api.delete(`/usuarios/${id}`)
    cargar()
  }
}

function abrirFormRol(r = null) {
  formRol.value = r
    ? { visible: true, editando: r.id, nombre: r.nombre }
    : { visible: true, editando: null, nombre: "" }
}

async function guardarRol() {
  const { editando, nombre } = formRol.value
  if (editando) {
    await api.put(`/roles/${editando}`, { nombre })
  } else {
    await api.post("/roles", { nombre })
  }
  formRol.value.visible = false
  cargar()
}

async function eliminarRol(id) {
  if (confirm("¿Eliminar este rol?")) {
    await api.delete(`/roles/${id}`)
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
.page-header { margin-bottom: 24px; }
.page-title {
  font-family: 'Syne', sans-serif; font-size: 32px;
  font-weight: 800; color: var(--text-primary); margin-bottom: 4px;
}
.page-sub { font-size: 14px; color: var(--text-muted); }

.tabs {
  display: flex; background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 12px; padding: 4px;
  margin-bottom: 24px; width: fit-content;
}
.tab-btn {
  padding: 8px 24px; background: none; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; color: var(--text-muted);
  border-radius: 9px; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
}
.tab-btn.active { background: rgba(55,138,221,0.2); color: #378ADD; }

.section-header {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 16px;
}
.section-count { font-size: 13px; color: var(--text-muted); }

.form-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; padding: 24px; margin-bottom: 20px;
  animation: fadeUp 0.3s ease both;
}
.form-title {
  font-family: 'Syne', sans-serif; font-size: 16px;
  font-weight: 600; color: var(--text-primary); margin-bottom: 16px;
}
.form-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px; margin-bottom: 16px;
}
.form-actions { display: flex; gap: 10px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--text-muted);
}
.field input, .field select {
  background: var(--input-bg); border: 1px solid var(--input-border);
  border-radius: 10px; padding: 10px 14px; font-size: 14px;
  color: var(--text-primary); font-family: 'DM Sans', sans-serif;
  outline: none; transition: border-color 0.2s, background 0.2s;
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
  font-size: 13px; font-weight: 600; color: #fff; cursor: pointer;
  font-family: 'Syne', sans-serif; transition: opacity 0.2s, transform 0.1s;
}
.btn-primary:hover  { opacity: 0.9; }
.btn-primary:active { transform: scale(0.98); }

.btn-cancel {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 10px; padding: 10px 20px; font-size: 13px;
  color: var(--text-secondary); cursor: pointer;
  font-family: 'DM Sans', sans-serif; transition: all 0.15s;
}
.btn-cancel:hover { color: var(--text-primary); background: var(--bg-card-hover); }

.table-card {
  background: var(--bg-card); border: 1px solid var(--border-soft);
  border-radius: 16px; overflow: hidden;
}
table { width: 100%; border-collapse: collapse; }
thead tr { background: var(--thead-bg); }
th {
  padding: 14px 18px; text-align: left; font-size: 11px;
  font-weight: 500; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--text-muted);
}
tbody tr { border-top: 1px solid var(--row-border); transition: background 0.15s; }
tbody tr:hover { background: var(--row-hover); }
td { padding: 14px 18px; font-size: 14px; color: var(--text-secondary); }
.id-col { color: var(--text-muted); font-size: 12px; font-family: monospace; }
.muted  { color: var(--text-muted); }
.empty  { text-align: center; color: var(--text-muted); padding: 40px !important; }

.rol-badge {
  font-size: 11px; font-weight: 500; padding: 3px 10px;
  border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em;
}
.rol-badge.admin   { background: rgba(55,138,221,0.15); color: #378ADD; border: 1px solid rgba(55,138,221,0.3); }
.rol-badge.cliente { background: rgba(29,158,117,0.15); color: #1D9E75; border: 1px solid rgba(29,158,117,0.3); }

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