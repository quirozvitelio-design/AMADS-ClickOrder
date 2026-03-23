import { ref, watch, onMounted } from "vue"

const isDark = ref(true) // oscuro por defecto

export function useDarkMode() {

  function aplicar(dark) {
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.classList.toggle("light", !dark)
    localStorage.setItem("tema", dark ? "dark" : "light")
  }

  function toggle() {
    isDark.value = !isDark.value
    aplicar(isDark.value)
  }

  onMounted(() => {
    const guardado = localStorage.getItem("tema")
    isDark.value = guardado ? guardado === "dark" : true
    aplicar(isDark.value)
  })

  return { isDark, toggle }
}