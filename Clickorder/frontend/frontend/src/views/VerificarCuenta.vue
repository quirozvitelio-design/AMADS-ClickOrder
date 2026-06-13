<template>
  <div class="login-root">
    <div class="bg-grid"></div>
    <div class="glow-1"></div>
    <div class="glow-2"></div>

    <button @click="toggle" class="btn-tema" :title="isDark ? 'Modo claro' : 'Modo oscuro'">
      <span v-if="isDark">☀️</span>
      <span v-else>🌙</span>
    </button>

    <div class="left-panel">
      <div class="brand-badge">
        <div class="brand-icon">C</div>
        <span>ClickOrder Platform</span>
      </div>
      <h1 class="hero-title">
        Verificación de seguridad en
        <span class="accent">un solo click</span>
      </h1>
      <p class="hero-sub">
        Validamos tu identidad para asegurar que tus pedidos, facturas y datos comerciales se procesen bajo el estándar más seguro.
      </p>
    </div>

    <div class="right-panel">
      <div class="form-card">
        <div class="form-header">
          <h2>ClickOrder 🛒</h2>
          <p>Estado de verificación y activación de cuenta</p>
        </div>

        <div v-if="status === 'loading'" style="text-align: center; padding: 20px 0;">
          <div class="spinner"></div>
          <p class="divider-text" style="margin-top: 20px; text-transform: uppercase;">
            Sincronizando con el servidor seguro...
          </p>
        </div>

        <div v-else-if="status === 'success'">
          <div class="success-msg" style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px; text-align: center;">
            <div style="width: 48px; height: 48px; background-color: rgba(29, 158, 117, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span style="font-weight: 500; font-size: 15px;">{{ mensajeFeedback }}</span>
          </div>

          <p style="font-size: 13px; color: var(--text-muted); text-align: center; margin: 20px 0 10px 0;">
            Tu registro se completó de manera satisfactoria. Ya tienes acceso total.
          </p>

          <router-link to="/login" class="btn-login" style="display: block; text-decoration: none; text-align: center;">
            Iniciar sesión ahora →
          </router-link>
        </div>

        <div v-else-if="status === 'error'">
          <div class="error-msg" style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px; text-align: center;">
            <div style="width: 48px; height: 48px; background-color: rgba(226, 75, 74, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <span style="font-weight: 500; font-size: 15px;">{{ mensajeFeedback }}</span>
          </div>

          <p style="font-size: 13px; color: var(--text-muted); text-align: center; margin: 20px 0 10px 0;">
            Los enlaces de activación expiran tras 24 horas por políticas de protección informática.
          </p>

          <router-link to="/registro" class="btn-login" style="display: block; text-decoration: none; text-align: center; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-primary);">
            Volver al Registro
          </router-link>
        </div>

        <p class="enlace-registro">
          ¿Problemas con el enlace? <a href="mailto:soporte@clickorder.com">Contactar a soporte</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import api from "../api/axios" // Utilizando tu misma instancia configurada de Axios
import { useDarkMode } from "../composables/useDarkMode"

const route = useRoute()
const status = ref("loading") 
const mensajeFeedback = ref("")

const { isDark, toggle } = useDarkMode()

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    status.value = "error"
    mensajeFeedback.value = "Falta el token de validación en el enlace."
    return
  }

  // Pequeño retardo intencional de 800ms para lucir tu animación de carga estilizada
  setTimeout(async () => {
    try {
      // Usamos el prefijo base de tu axios conectado al puerto 3000
      const res = await api.get(`/usuarios/verificar-cuenta?token=${token}`)
      status.value = "success"
      mensajeFeedback.value = res.data.mensaje
    } catch (err) {
      status.value = "error"
      mensajeFeedback.value = err.response?.data?.mensaje || "El enlace es inválido o ha expirado."
    }
  }, 800)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

* { box-sizing: border-box; }

.login-root {
  min-height: 100vh; display: flex;
  font-family: 'DM Sans', sans-serif;
  background: var(--bg-base);
  position: relative; overflow: hidden;
}

.btn-tema {
  position: absolute; top: 16px; right: 16px; z-index: 10;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 10px; width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 16px; transition: all 0.2s;
}
.btn-tema:hover { background: var(--bg-card-hover); transform: scale(1.05); }

.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
}
.glow-1 {
  position: absolute; width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(55,138,221,0.18) 0%, transparent 70%);
  top: -150px; left: -100px;
  animation: pulse1 6s ease-in-out infinite;
}
.glow-2 {
  position: absolute; width: 400px; height: 400px; border-radius: 50%;
  background: radial-gradient(circle, rgba(29,158,117,0.14) 0%, transparent 70%);
  bottom: -100px; right: -80px;
  animation: pulse2 7s ease-in-out infinite;
}
@keyframes pulse1 { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.1)} }
@keyframes pulse2 { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.08)} }

.left-panel {
  flex: 1; display: flex; flex-direction: column;
  justify-content: center; align-items: flex-start;
  padding: 60px; position: relative; z-index: 1;
}
.brand-badge {
  display: inline-flex; align-items: center; gap: 10px;
  background: rgba(55,138,221,0.12); border: 1px solid rgba(55,138,221,0.25);
  border-radius: 999px; padding: 6px 16px 6px 10px; margin-bottom: 32px;
  animation: fadeDown 0.6s ease both;
}
.brand-icon {
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #378ADD, #1D9E75);
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff; font-family: 'Syne', sans-serif;
}
.brand-badge span { font-size: 13px; font-weight: 500; color: var(--text-secondary); }

.hero-title {
  font-family: 'Syne', sans-serif; font-size: clamp(36px, 5vw, 56px);
  font-weight: 800; color: var(--text-primary); line-height: 1.1; margin-bottom: 20px;
  animation: fadeDown 0.7s ease 0.1s both;
}
.hero-title .accent {
  background: linear-gradient(90deg, #378ADD, #1D9E75);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hero-sub {
  font-size: 16px; color: var(--text-secondary); line-height: 1.7;
  max-width: 360px; margin-bottom: 48px;
  animation: fadeDown 0.7s ease 0.2s both;
}

.right-panel {
  width: 800px; display: flex; align-items: center;
  justify-content: center; padding: 60px; position: relative; z-index: 1;
}
.form-card {
  width: 100%; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 20px;
  padding: 40px 60px; backdrop-filter: blur(20px);
  animation: fadeUp 0.7s ease 0.2s both;
}
.form-header { margin-bottom: 28px; text-align: left; }
.form-header h2 {
  font-family: 'Syne', sans-serif; font-size: 24px;
  font-weight: 700; color: var(--text-primary); margin-bottom: 6px;
}
.form-header p { font-size: 13px; color: var(--text-muted); }

.error-msg {
  background: rgba(226,75,74,0.12); border: 1px solid rgba(226,75,74,0.3);
  border-radius: 12px; padding: 16px; font-size: 13px;
  color: #E24B4A; margin-bottom: 16px;
}
.success-msg {
  background: rgba(29,158,117,0.12); border: 1px solid rgba(29,158,117,0.3);
  border-radius: 12px; padding: 16px; font-size: 13px;
  color: #1D9E75; margin-bottom: 16px;
}
.btn-login {
  width: 100%; padding: 14px;
  background: linear-gradient(135deg, #378ADD, #1D9E75);
  border: none; border-radius: 10px; font-size: 14px;
  font-weight: 600; color: #fff; cursor: pointer;
  font-family: 'Syne', sans-serif; letter-spacing: 0.03em;
  transition: opacity 0.2s, transform 0.1s;
}
.btn-login:hover   { opacity: 0.9; }
.btn-login:active  { transform: scale(0.99); }

.divider-text { font-size: 11px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.05em; }

.spinner {
  margin: 0 auto; width: 40px; height: 40px; 
  border: 3px solid #378ADD; border-top-color: transparent; 
  border-radius: 50%; animation: spin 1s linear infinite;
}

.enlace-registro {
  text-align: center; margin-top: 24px;
  font-size: 13px; color: var(--text-muted);
}
.enlace-registro a {
  color: #378ADD; text-decoration: none; font-weight: 500;
  transition: color 0.2s;
}
.enlace-registro a:hover { text-decoration: underline; color: #1D9E75; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
@keyframes fadeUp   { from{opacity:0;transform:translateY(16px)}  to{opacity:1;transform:none} }

@media (max-width: 700px) {
  .left-panel { display: none; }
  .right-panel { width: 100%; padding: 24px; }
  .form-card { padding: 30px 24px; }
}
</style>