<template>
  <div class="page-root">
    <!-- Cuadrícula de fondo decorativa -->
    <div class="bg-grid"></div>

    <div class="page-content">
      <!-- ENCABEZADO DE LA PÁGINA -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <p class="page-sub">Administra las cuentas, roles y accesos del personal</p>
        </div>
      </div>

      <!-- SECCIÓN PRINCIPAL DE GESTIÓN -->
      <div class="dashboard-grid">
        
        <!-- Tabla de Usuarios Registrados -->
        <div class="dashboard-card col-span-2">
          <h2 class="card-title">Cuentas del Sistema</h2>
          
          <div class="table-responsive">
            <table class="usuarios-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre completo</th>
                  <th>Correo Electrónico</th>
                  <th>Rol / Permisos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in usuarios" :key="u.id">
                  <td class="id-cell">#{{ u.id }}</td>
                  <td class="font-semibold text-primary">👤 {{ u.nombre }}</td>
                  <td class="text-secondary">{{ u.correo }}</td>
                  <td>
                    <span :class="['role-badge', 'role-' + u.rol.toLowerCase()]">
                      {{ u.rol }}
                    </span>
                  </td>
                  <td class="right-col actions-cell">
  <button
    @click="seleccionarUsuario(u)"
    class="btn-edit-role"
    title="Cambiar Rol"
  >
    🔑 Editar Rol
  </button>

  <button
    @click="eliminarUsuario(u)"
    class="btn-delete-user"
    title="Eliminar Usuario"
  >
    🗑 Eliminar
  </button>
</td>
                </tr>
                <tr v-if="usuarios.length === 0">
                  <td colspan="5" class="empty-state">
                    <p>No se encontraron usuarios registrados en la base de datos.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Panel Lateral de Edición de Rol (Solo si hay uno seleccionado) -->
        <div class="dashboard-card">
          <h2 class="card-title">Modificar Permisos</h2>
          
          <div v-if="usuarioSeleccionado" class="edit-role-panel animate-fade">
            <div class="user-preview-box">
              <span class="avatar-large">👤</span>
              <p class="preview-name">{{ usuarioSeleccionado.nombre }}</p>
              <p class="preview-email">{{ usuarioSeleccionado.correo }}</p>
            </div>

            <div class="field">
              <label>Asignar Nuevo Rol *</label>
              <select v-model="nuevoRol">
                <option value="admin">Administrador (Acceso Total)</option>
                <option value="logistica">Logística (Gestión de Pedidos)</option>
                <option value="cliente">Cliente (Consultas Básicas)</option>
              </select>
              <p class="field-hint">El cambio de rol alterará los módulos y vistas a los que este usuario tiene acceso de forma inmediata.</p>
            </div>

            <div class="panel-actions">
              <button @click="usuarioSeleccionado = null" class="btn-cancel">Cancelar</button>
              <button @click="actualizarRol" :disabled="guardando" class="btn-submit-role">
                {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </div>

          <div v-else class="empty-side-panel">
            <span>🔑</span>
            <p>Selecciona un usuario de la lista para gestionar sus niveles de acceso y roles operativos.</p>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import clickOrderApi from "../api/axios"

const usuarios = ref([])
const usuarioSeleccionado = ref(null)
const nuevoRol = ref("")
const guardando = ref(false)

onMounted(() => {
  cargarUsuarios()
})

async function cargarUsuarios() {
  try {
    const res = await clickOrderApi.get("/usuarios")
    usuarios.value = res.data
  } catch (err) {
    console.error("Error al cargar usuarios:", err)
  }
}

function seleccionarUsuario(u) {
  usuarioSeleccionado.value = u
  nuevoRol.value = u.role || u.rol || "cliente"
}

async function actualizarRol() {
  if (!usuarioSeleccionado.value) return

  try {
    guardando.value = true
    // Hacemos el envío de actualización del rol al endpoint correspondiente
    await clickOrderApi.put(`/usuarios/${usuarioSeleccionado.value.id}/rol`, { 
      rol: nuevoRol.value 
    })
    
    alert(`¡Rol de ${usuarioSeleccionado.value.nombre} actualizado correctamente!`)
    usuarioSeleccionado.value = null
    cargarUsuarios()
  } catch (err) {
    console.error("Error al actualizar el rol:", err)
    alert("Hubo un error al intentar cambiar el rol del usuario.")
  } finally {
    guardando.value = false
  }
}
async function eliminarUsuario(usuario) {
  const confirmar = confirm(
    `¿Deseas eliminar al usuario "${usuario.nombre}"?\n\nEsta acción no se puede deshacer.`
  )

  if (!confirmar) return

  try {
    await clickOrderApi.delete(`/usuarios/${usuario.id}`)

    alert("Usuario eliminado correctamente")

    if (
      usuarioSeleccionado.value &&
      usuarioSeleccionado.value.id === usuario.id
    ) {
      usuarioSeleccionado.value = null
    }

    cargarUsuarios()
  } catch (err) {
    console.error("Error al eliminar usuario:", err)
    alert("No se pudo eliminar el usuario")
  }
}
</script>

<style scoped>
/* REJILLA INTEGRADA */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}
@media (max-width: 992px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}

.dashboard-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 24px;
}
.col-span-2 { grid-column: span 1; }
@style-fix { .col-span-2 { grid-column: span 2; } }
@media (max-width: 992px) { .col-span-2 { grid-column: span 1; } }

.card-title {
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
  color: var(--text-primary); margin-bottom: 20px; text-transform: uppercase;
}

/* ESTRUCTURA DE LA TABLA */
.table-responsive { overflow-x: auto; }
.usuarios-table { width: 100%; border-collapse: collapse; text-align: left; }
.usuarios-table th {
  padding: 12px 14px; font-size: 11px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; border-bottom: 1px solid var(--border-soft);
}
.usuarios-table td { padding: 14px 14px; font-size: 13px; border-bottom: 1px solid var(--border-soft); }

.id-cell { font-family: monospace; color: var(--text-muted); }
.font-semibold { font-weight: 600; }
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.right-col { text-align: right; }

/* BADGES DE ROLES */
.role-badge {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px;
  text-transform: uppercase; display: inline-block;
}
.role-admin { background: rgba(226,75,74,0.12); color: #E24B4A; border: 1px solid rgba(226,75,74,0.2); }
.role-logistica { background: rgba(124,58,237,0.12); color: #7C3AED; border: 1px solid rgba(124,58,237,0.2); }
.role-cliente { background: rgba(55,138,221,0.12); color: #378ADD; border: 1px solid rgba(55,138,221,0.2); }

.btn-edit-role {
  background: var(--bg-base); border: 1px solid var(--border);
  color: var(--text-secondary); border-radius: 6px; padding: 6px 12px;
  font-size: 12px; cursor: pointer; font-weight: 500; transition: all 0.15s;
}
.btn-edit-role:hover { background: var(--bg-card-hover); color: var(--text-primary); border-color: var(--text-muted); }

/* PANEL DE ACCESO/EDICIÓN LATERAL */
.user-preview-box {
  background: var(--bg-base); border: 1px solid var(--border-soft);
  border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px;
}
.avatar-large { font-size: 32px; display: block; margin-bottom: 8px; }
.preview-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.preview-email { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
.field label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.field select {
  background: var(--bg-base); border: 1px solid var(--border);
  color: var(--text-primary); padding: 10px 14px; border-radius: 8px;
  font-size: 13px; outline: none; font-family: 'DM Sans', sans-serif;
}
.field select:focus { border-color: #378ADD; }
.field-hint { font-size: 11px; color: var(--text-muted); line-height: 1.4; }

.panel-actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn-cancel {
  background: transparent; border: 1px solid var(--border);
  color: var(--text-muted); padding: 10px 16px; border-radius: 8px;
  font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-submit-role {
  background: var(--text-primary); color: var(--bg-base); border: none;
  padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-submit-role:disabled { opacity: 0.5; }

/* PANEL VACÍO */
.empty-side-panel {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 16px; text-align: center; color: var(--text-muted); gap: 10px;
  border: 1px dashed var(--border); border-radius: 12px; min-height: 250px;
}
.empty-side-panel span { font-size: 28px; }
.empty-side-panel p { font-size: 12px; line-height: 1.5; }

.empty-state { text-align: center; color: var(--text-muted); padding: 32px !important; font-size: 13px; }

.animate-fade { animation: fadeUp 0.15s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

.actions-cell {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-delete-user {
  background: rgba(226, 75, 74, 0.12);
  border: 1px solid rgba(226, 75, 74, 0.25);
  color: #E24B4A;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
}

.btn-delete-user:hover {
  background: rgba(226, 75, 74, 0.22);
}

.btn-delete-user:active {
  transform: scale(0.98);
}
</style>