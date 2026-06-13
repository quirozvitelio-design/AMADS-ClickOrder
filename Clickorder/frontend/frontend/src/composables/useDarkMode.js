// frontend/src/composables/useDarkMode.js
import { ref, watch } from "vue"

// ── Singleton: ref compartido entre TODOS los componentes ──────
// Al estar FUERA de la función, es la misma instancia para toda la app
const isDark = ref(false)
let inicializado = false

function aplicar(dark) {
  document.documentElement.classList.toggle("dark",  dark)
  document.documentElement.classList.toggle("light", !dark)
  localStorage.setItem("tema", dark ? "dark" : "light")
}

function toggle() {
  isDark.value = !isDark.value
  // aplicar() se llama automáticamente por el watcher de abajo
}

// Watcher singleton — se registra una sola vez
watch(isDark, (val) => aplicar(val))

export function useDarkMode() {
  // Inicializar UNA sola vez al primer uso, no en cada componente
  if (!inicializado) {
    inicializado = true
    const guardado = localStorage.getItem("tema")
    // Si no hay preferencia guardada → oscuro por defecto
    isDark.value = guardado ? guardado === "dark" : true
    aplicar(isDark.value)
  }

  return { isDark, toggle }
}