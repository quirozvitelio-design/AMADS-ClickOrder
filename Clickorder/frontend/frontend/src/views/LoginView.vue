<template>
  <div class="login-root">
    <div class="bg-grid"></div>
    <div class="glow-1"></div>
    <div class="glow-2"></div>

    <!-- Botón tema esquina superior derecha -->
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
            <input v-model="password" type="password" placeholder="••••••••" @keyup.enter="login" />
          </div>
        </div>

        <div v-if="error"   class="error-msg">{{ error }}</div>
        <div v-if="success" class="success-msg">{{ success }}</div>

        <button class="btn-login" :disabled="cargando" @click="login">
          {{ cargando ? 'Verificando...' : 'Iniciar sesión →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import api from "../api/axios"
import { useDarkMode } from "../composables/useDarkMode"

const router   = useRouter()
const correo   = ref("")
const password = ref("")
const error    = ref("")
const success  = ref("")
const cargando = ref(false)

const { isDark, toggle } = useDarkMode()

async function login() {
  error.value   = ""
  success.value = ""

  if (!correo.value || !password.value) {
    error.value = "Completa todos los campos"
    return
  }

  cargando.value = true
  try {
    const res = await api.post("/login", {
      correo: correo.value,
      password: password.value
    })
    localStorage.setItem("usuario", JSON.stringify(res.data.usuario))
    success.value = `Bienvenido ${res.data.usuario.nombre}!`

    // Redirigir según rol
    const rol = res.data.usuario.rol
    setTimeout(() => router.push(rol === "admin" ? "/productos" : "/catalogo"), 1000)

  } catch {
    error.value = "Correo o contraseña incorrectos"
  } finally {
    cargando.value = false
  }
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

/* Botón tema flotante */
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
.stats-row { display: flex; gap: 32px; animation: fadeDown 0.7s ease 0.3s both; }
.stat-item { display: flex; flex-direction: column; gap: 2px; }
.stat-num  { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--text-primary); }
.stat-label { font-size: 12px; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; }

.right-panel {
  width: 440px; display: flex; align-items: center;
  justify-content: center; padding: 40px; position: relative; z-index: 1;
}
.form-card {
  width: 100%; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 20px;
  padding: 40px; backdrop-filter: blur(20px);
  animation: fadeUp 0.7s ease 0.2s both;
}
.form-header { margin-bottom: 32px; }
.form-header h2 {
  font-family: 'Syne', sans-serif; font-size: 24px;
  font-weight: 700; color: var(--text-primary); margin-bottom: 6px;
}
.form-header p { font-size: 13px; color: var(--text-muted); }

.field { margin-bottom: 18px; }
.field label {
  display: block; font-size: 12px; font-weight: 500;
  color: var(--text-muted); letter-spacing: 0.05em;
  text-transform: uppercase; margin-bottom: 8px;
}
.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 14px; font-size: 14px; opacity: 0.4; }
.field input {
  width: 100%; background: var(--input-bg);
  border: 1px solid var(--input-border); border-radius: 10px;
  padding: 12px 14px 12px 40px; font-size: 14px;
  color: var(--text-primary); font-family: 'DM Sans', sans-serif;
  outline: none; transition: border-color 0.2s, background 0.2s;
}
.field input::placeholder { color: var(--text-muted); }
.field input:focus {
  border-color: rgba(55,138,221,0.5);
  background: rgba(55,138,221,0.07);
}

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

@keyframes fadeDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:none} }
@keyframes fadeUp   { from{opacity:0;transform:translateY(16px)}  to{opacity:1;transform:none} }

@media (max-width: 700px) {
  .left-panel { display: none; }
  .right-panel { width: 100%; padding: 24px; }
}
</style>