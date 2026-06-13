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
        Gestiona tus<br>
        pedidos con<br>
        <span class="accent">precisión total</span>
      </h1>
      <p class="hero-sub">
        Administra productos, pedidos y usuarios desde un solo panel. Rápido, seguro y eficiente.
      </p>
    </div>

    <div class="right-panel">
      <div class="form-card">
        <div class="form-header">
          <h2>Bienvenido 👋</h2>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <div class="field">
          <label>Correo electrónico</label>
          <div class="input-wrap">
            <span class="input-icon">✉</span>
            <input v-model="correo" type="email" placeholder="correo@mail.com" @keyup.enter="login" />
          </div>
        </div>

        <div class="field">
          <label>Contraseña</label>
          <div class="input-wrap">
            <span class="input-icon">🔑</span>
            <input
              v-model="password"
              :type="verPassword ? 'text' : 'password'"
              placeholder="••••••••"
              @keyup.enter="login"
            />
            <button class="toggle-pwd" @click="verPassword = !verPassword" type="button">
              {{ verPassword ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <div v-if="error"   class="error-msg">{{ error }}</div>
        <div v-if="success" class="success-msg">{{ success }}</div>

        <button class="btn-login" :disabled="cargando" @click="login">
          {{ cargando ? 'Verificando...' : 'Iniciar sesión →' }}
        </button>

        <div class="divider-container">
          <div class="divider-line"></div>
          <span class="divider-text">O CONTINUAR CON</span>
          <div class="divider-line"></div>
        </div>

        <div class="google-btn-wrapper">
          <GoogleSignInButton
            @success="handleGoogleSuccess"
            @error="handleGoogleError"
          />
        </div>

        <p class="enlace-registro">
          ¿No tienes una cuenta? <router-link to="/registro">Regístrate por correo aquí</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import api from "../api/axios"
import { useDarkMode } from "../composables/useDarkMode"
import { GoogleSignInButton } from "vue3-google-signin"

const router      = useRouter()
const correo      = ref("")
const password    = ref("")
const verPassword = ref(false)
const error       = ref("")
const success     = ref("")
const cargando    = ref(false)

const { isDark, toggle } = useDarkMode()

// ── Función compartida de redirección ────────────────────────
// Misma lógica para login manual y Google:
//   admin / logística  → /dashboard o /pedidos
//   cliente sin perfil → /completar-perfil
//   cliente con perfil → /catalogo
function redirigirUsuario(usuario) {
  if (usuario.rol === "admin") {
    return router.push("/dashboard")
  }
  if (usuario.rol === "logistica") {
    return router.push("/pedidos")
  }
  // Cliente: revisar si completó su perfil
  if (usuario.perfil_completo === 0 || usuario.perfil_completo === false) {
    return router.push("/completar-perfil")
  }
  router.push("/catalogo")
}

// ── Login tradicional ─────────────────────────────────────────
async function login() {
  error.value   = ""
  success.value = ""

  if (!correo.value || !password.value) {
    error.value = "Completa todos los campos."
    return
  }

  cargando.value = true
  try {
    const res     = await api.post("/login", {
      correo:   correo.value,
      password: password.value
    })
    const usuario = res.data.usuario

    localStorage.setItem("usuario", JSON.stringify(usuario))
    success.value = `¡Bienvenido, ${usuario.nombre.split(' ')[0]}!`

    setTimeout(() => redirigirUsuario(usuario), 700)

  } catch (err) {
    error.value = err.response?.data?.mensaje || "Correo o contraseña incorrectos."
  } finally {
    cargando.value = false
  }
}

// ── Google Login ──────────────────────────────────────────────
async function handleGoogleSuccess(response) {
  error.value   = ""
  success.value = ""
  cargando.value = true

  try {
    const res     = await api.post("/usuarios/google-login", { token: response.credential })
    const usuario = res.data.usuario

    localStorage.setItem("usuario", JSON.stringify(usuario))
    success.value = `¡Bienvenido, ${usuario.nombre.split(' ')[0]}!`

    setTimeout(() => redirigirUsuario(usuario), 700)

  } catch (err) {
    error.value = err.response?.data?.mensaje || "Error al iniciar sesión con Google."
  } finally {
    cargando.value = false
  }
}

function handleGoogleError() {
  error.value = "Se canceló la autenticación con Google."
}
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
.form-header { margin-bottom: 24px; }
.form-header h2 {
  font-family: 'Syne', sans-serif; font-size: 24px;
  font-weight: 700; color: var(--text-primary); margin-bottom: 6px;
}
.form-header p { font-size: 13px; color: var(--text-muted); }

.field { margin-bottom: 16px; }
.field label {
  display: block; font-size: 12px; font-weight: 500;
  color: var(--text-muted); letter-spacing: 0.05em;
  text-transform: uppercase; margin-bottom: 6px;
}
.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon {
  position: absolute; left: 14px; font-size: 14px;
  opacity: 0.4; pointer-events: none;
}
.field input {
  width: 100%; background: var(--input-bg);
  border: 1px solid var(--input-border); border-radius: 10px;
  padding: 12px 40px; font-size: 14px;
  color: var(--text-primary); font-family: 'DM Sans', sans-serif;
  outline: none; transition: border-color 0.2s, background 0.2s;
}
.field input::placeholder { color: var(--text-muted); }
.field input:focus {
  border-color: rgba(55,138,221,0.5);
  background: rgba(55,138,221,0.07);
}
.toggle-pwd {
  position: absolute; right: 12px;
  background: transparent; border: none;
  cursor: pointer; font-size: 14px; opacity: 0.5;
  padding: 4px; transition: opacity 0.15s;
}
.toggle-pwd:hover { opacity: 1; }

.error-msg {
  background: rgba(226,75,74,0.12); border: 1px solid rgba(226,75,74,0.3);
  border-radius: 8px; padding: 10px 14px; font-size: 13px;
  color: #E24B4A; margin-bottom: 16px;
}
.success-msg {
  background: rgba(29,158,117,0.12); border: 1px solid rgba(29,158,117,0.3);
  border-radius: 8px; padding: 10px 14px; font-size: 13px;
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
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

.divider-container {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; margin: 20px 0;
}
.divider-line { flex: 1; height: 1px; background: var(--border); opacity: 0.6; }
.divider-text { font-size: 11px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.05em; }
.google-btn-wrapper { display: flex; justify-content: center; width: 100%; margin-bottom: 8px; }

.enlace-registro {
  text-align: center; margin-top: 20px;
  font-size: 13px; color: var(--text-muted);
}
.enlace-registro a {
  color: #378ADD; text-decoration: none; font-weight: 500;
  transition: color 0.2s;
}
.enlace-registro a:hover { text-decoration: underline; color: #1D9E75; }

@keyframes fadeDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
@keyframes fadeUp   { from{opacity:0;transform:translateY(16px)}  to{opacity:1;transform:none} }

@media (max-width: 700px) {
  .left-panel  { display: none; }
  .right-panel { width: 100%; padding: 24px; }
  .form-card   { padding: 28px 20px; }
}
</style>