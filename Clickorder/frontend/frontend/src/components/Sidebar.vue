<template>
  <aside :class="['sidebar', isCollapsed ? 'collapsed' : '']">
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <div class="brand-icon">C</div>
        <span class="brand-text">ClickOrder</span>
      </div>
      <button @click="isCollapsed = !isCollapsed" class="btn-toggle-sidebar" title="Alternar menú">
        {{ isCollapsed ? '❯' : '❮' }}
      </button>
    </div>

    <div v-if="usuario" class="sidebar-user">
      <div class="user-avatar">
        {{ usuario.nombre.charAt(0).toUpperCase() }}
      </div>
      <div class="user-info">
        <p class="user-name">{{ usuario.nombre }}</p>
        <p class="user-role">{{ usuario.rol }}</p>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link v-if="usuario?.rol === 'admin'" to="/dashboard" class="sidebar-link">
        <span class="link-icon">📊</span>
        <span class="link-text">Dashboard</span>
      </router-link>

      <router-link v-if="usuario?.rol === 'admin'" to="/productos" class="sidebar-link">
        <span class="link-icon">📦</span>
        <span class="link-text">Productos</span>
      </router-link>

      <router-link v-if="usuario?.rol === 'cliente'" to="/catalogo" class="sidebar-link">
        <span class="link-icon">🛒</span>
        <span class="link-text">Catálogo</span>
      </router-link>

      <router-link v-if="usuario?.rol === 'admin' || usuario?.rol === 'logistica'" to="/pedidos" class="sidebar-link">
        <span class="link-icon">📋</span>
        <span class="link-text">Pedidos</span>
      </router-link>

      <router-link v-if="usuario?.rol === 'admin'" to="/reportes" class="sidebar-link">
        <span class="link-icon">📈</span>
        <span class="link-text">Reportes</span>
      </router-link>

      <router-link v-if="usuario?.rol === 'admin'" to="/usuarios" class="sidebar-link">
        <span class="link-icon">👤</span>
        <span class="link-text">Usuarios</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button @click="toggle" class="btn-footer-action" :title="isDark ? 'Modo claro' : 'Modo oscuro'">
        <span class="footer-icon">{{ isDark ? '☀️' : '🌙' }}</span>
        <span class="link-text">{{ isDark ? 'Modo Claro' : 'Modo Oscuro' }}</span>
      </button>

      <button @click="cerrarSesion" class="btn-footer-action btn-logout" title="Cerrar sesión">
        <span class="footer-icon">🚪</span>
        <span class="link-text">Cerrar Sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useDarkMode } from "../composables/useDarkMode"

const router = useRouter()
const route = useRoute()
const usuario = ref(null)
const isCollapsed = ref(false)
const { isDark, toggle } = useDarkMode()

// Actualizar el estado del usuario basado en la ruta actual
watch(() => route.path, () => {
  usuario.value = JSON.parse(localStorage.getItem("usuario"))
}, { immediate: true })

function cerrarSesion() {
  localStorage.removeItem("usuario")
  usuario.value = null
  router.push("/login")
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  background: var(--nav-bg, #ffffff);
  border-right: 1px solid var(--nav-border, #e5e7eb);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'DM Sans', sans-serif;
}

/* Estado Colapsado */
.sidebar.collapsed {
  width: 80px;
}

.sidebar.collapsed .brand-text,
.sidebar.collapsed .user-info,
.sidebar.collapsed .link-text {
  display: none;
}

.sidebar.collapsed .sidebar-user {
  padding: 19px 0;
  justify-content: center;
}

/* Header */
.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--nav-border, #e5e7eb);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: var(--text-primary);
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #378ADD, #1D9E75);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}

.btn-toggle-sidebar {
  background: transparent;
  border: none;
  color: var(--text-muted, #9ca3af);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  transition: background 0.15s, color 0.15s;
}

.btn-toggle-sidebar:hover {
  background: var(--bg-card-hover, #f3f4f6);
  color: var(--text-primary);
}

/* Perfil de Usuario */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--nav-border, #e5e7eb);
  background: rgba(0, 0, 0, 0.02);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #378ADD, #1D9E75);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.user-info {
  overflow: hidden;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: var(--text-muted, #9ca3af);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Menú de Navegación */
.sidebar-nav {
  flex: 1;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 12px;
  color: var(--text-secondary, #4b5563);
  text-decoration: none;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.sidebar-link:hover {
  color: var(--text-primary);
  background: var(--bg-card-hover, #f3f4f6);
}

.sidebar-link.router-link-active {
  color: #378ADD;
  background: rgba(55, 138, 221, 0.12);
  font-weight: 600;
}

/* Footer / Acciones Inferiores */
.sidebar-footer {
  padding: 12px 8px;
  border-top: 1px solid var(--nav-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-footer-action {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary, #4b5563);
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.btn-footer-action:hover {
  background: var(--bg-card-hover, #f3f4f6);
  color: var(--text-primary);
}

.footer-icon {
  font-size: 25px;
  width: 30px;
  text-align: center;
  display: inline-block;
}

.btn-logout {
  color: #E24B4A;
}

.btn-logout:hover {
  background: rgba(226, 75, 74, 0.1);
  color: #E24B4A;
}
</style>