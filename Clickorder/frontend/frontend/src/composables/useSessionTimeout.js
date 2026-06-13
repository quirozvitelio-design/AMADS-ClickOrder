import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutos en ms

export function useSessionTimeout() {
  const router = useRouter()
  let timer = null

  function cerrarSesionPorInactividad() {
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  function resetearTimer() {
    clearTimeout(timer)
    timer = setTimeout(cerrarSesionPorInactividad, TIMEOUT_MS)
  }

  // Eventos que cuentan como actividad
  const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

  onMounted(() => {
    // Solo activar si hay sesión activa
    if (!localStorage.getItem('usuario')) return

    eventos.forEach(e => window.addEventListener(e, resetearTimer, { passive: true }))
    resetearTimer() // Iniciar el timer al montar
  })

  onUnmounted(() => {
    clearTimeout(timer)
    eventos.forEach(e => window.removeEventListener(e, resetearTimer))
  })
}