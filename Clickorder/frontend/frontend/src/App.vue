<template>
  <div>
    <nav v-if="usuario" class="navbar">
      <div class="nav-brand">
        <div class="nav-icon">C</div>
        <span>ClickOrder</span>
      </div>
      <div class="nav-links">
        <router-link v-if="usuario.rol === 'admin'" to="/productos" class="nav-link">Productos</router-link>
        <router-link v-if="usuario.rol === 'cliente'" to="/catalogo" class="nav-link">Catálogo</router-link>
        <router-link v-if="usuario.rol === 'admin' || usuario.rol === 'logistica'" to="/pedidos"   class="nav-link">Pedidos</router-link>
        <router-link v-if="usuario.rol === 'admin'" to="/usuarios"  class="nav-link">Usuarios</router-link>
        <div class="nav-divider"></div>
        <span class="nav-user">{{ usuario.nombre }} · {{ usuario.rol }}</span>

        <!-- Toggle modo claro/oscuro -->
        <button @click="toggle" class="btn-tema" :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
          <span v-if="isDark">☀️</span>
          <span v-else>🌙</span>
        </button>

        <button @click="cerrarSesion" class="btn-salir">Salir</button>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useDarkMode } from "./composables/useDarkMode"

const router  = useRouter()
const route   = useRoute()
const usuario = ref(null)
const { isDark, toggle } = useDarkMode()

watch(() => route.path, () => {
  usuario.value = JSON.parse(localStorage.getItem("usuario"))
}, { immediate: true })

function cerrarSesion() {
  localStorage.removeItem("usuario")
  usuario.value = null
  router.push("/login")
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body { background: var(--bg-base); }

.navbar {
  position: sticky; top: 0; z-index: 100;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--nav-border);
  backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px; height: 56px;
}
.nav-brand {
  display: flex; align-items: center; gap: 10px;
  font-family: 'Syne', sans-serif; font-weight: 700;
  font-size: 16px; color: var(--text-primary);
}
.nav-icon {
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #378ADD, #1D9E75);
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: #fff;
}
.nav-links { display: flex; align-items: center; gap: 8px; }
.nav-link {
  font-size: 13px; color: var(--text-secondary); text-decoration: none;
  padding: 6px 12px; border-radius: 8px; transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.nav-link:hover           { color: var(--text-primary); background: var(--bg-card-hover); }
.nav-link.router-link-active { color: #378ADD; background: rgba(55,138,221,0.12); }
.nav-divider { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }
.nav-user {
  font-size: 12px; color: var(--text-muted);
  font-family: 'DM Sans', sans-serif; padding: 0 8px;
}
.btn-tema {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 8px; width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 16px; transition: all 0.15s;
}
.btn-tema:hover { background: var(--bg-card-hover); }

.btn-salir {
  background: rgba(226,75,74,0.12); border: 1px solid rgba(226,75,74,0.25);
  border-radius: 8px; padding: 5px 14px; font-size: 12px; color: #E24B4A;
  cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
}
.btn-salir:hover { background: rgba(226,75,74,0.22); }
</style>