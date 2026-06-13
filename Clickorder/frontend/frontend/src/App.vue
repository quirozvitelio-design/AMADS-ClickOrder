<template>
  <div :class="['app-container', claseLayout]">

    <!-- Sidebar SOLO para admin y logística — clientes tienen su propio layout -->
    <Sidebar v-if="mostrarSidebarAdmin" />

    <main class="main-content">
      <router-view />
    </main>

  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue"
import { useRoute } from "vue-router"
import Sidebar from "./components/Sidebar.vue"

const route  = useRoute()
const usuario = ref(null)

watch(() => route.path, () => {
  usuario.value = JSON.parse(localStorage.getItem("usuario") || "null")
}, { immediate: true })

// Solo admin y logística usan el sidebar global
const mostrarSidebarAdmin = computed(() => {
  const rol = usuario.value?.rol
  return rol === "admin" || rol === "logistica"
})

// Tres estados de layout:
// - "auth-layout"    → no está logueado (login, registro)
// - "with-sidebar"   → admin / logística (sidebar fijo a la izquierda)
// - "cliente-layout" → cliente (sin padding, el catálogo maneja su propio layout)
const claseLayout = computed(() => {
  if (!usuario.value) return "auth-layout"
  if (mostrarSidebarAdmin.value) return "with-sidebar"
  return "cliente-layout"
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 115%; }

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  overflow-x: hidden;
  font-size: 1rem;
}

/* ── CONTENEDOR MAESTRO ── */
.app-container {
  display: flex;
  min-height: 100vh;
  width: 100vw;
}

/* Admin / logística — sidebar fijo a la izquierda */
.app-container.with-sidebar {
  padding-left: 260px;
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.app-container.with-sidebar:has(.sidebar.collapsed) {
  padding-left: 70px;
}

/* Cliente — sin padding, el catálogo ocupa todo el ancho */
.app-container.cliente-layout {
  padding-left: 0;
}

/* Sin sesión — login / registro */
.app-container.auth-layout {
  padding-left: 0;
}

.main-content {
  flex: 1;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* ── ESTILOS GLOBALES COMPARTIDOS ── */
.page-root {
  position: relative;
  min-height: 100vh;
  padding: 40px 32px;
  background: var(--bg-base);
  z-index: 1;
}

.page-content {
  position: relative;
  max-width: 1550px;
  margin: 0 auto;
  width: 100%;
  z-index: 2;
}

.bg-grid {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 450px;
  background-image:
    linear-gradient(var(--border-soft) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-soft) 1px, transparent 1px);
  background-size: 44px 44px;
  opacity: 0.25;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0));
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0));
  pointer-events: none;
  z-index: 1;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Syne', sans-serif;
  font-size: 40px;
  font-weight: 800;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.page-sub {
  font-size: 19px;
  color: var(--text-muted);
  margin-top: 4px;
}

@media (max-width: 768px) {
  html { font-size: 105%; }
  .app-container.with-sidebar        { padding-left: 0; }
  .app-container.with-sidebar:has(.sidebar.collapsed) { padding-left: 0; }
  .page-root { padding: 24px 16px; }
}
</style>