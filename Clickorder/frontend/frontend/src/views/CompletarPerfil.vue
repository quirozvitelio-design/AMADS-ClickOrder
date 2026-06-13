<template>
  <div class="cp-root">
    <div class="bg-grid"></div>
    <div class="glow-1"></div>
    <div class="glow-2"></div>

    <div class="cp-card">
      <!-- Encabezado -->
      <div class="cp-header">
        <div class="brand-badge">
          <div class="brand-icon">C</div>
          <span>ClickOrder</span>
        </div>
        <h2>¡Bienvenido, {{ usuario?.nombre?.split(' ')[0] }}! 👋</h2>
        <p>Completa tu perfil para continuar. Solo tomará un momento.</p>
      </div>

      <!-- Formulario -->
      <div class="cp-form">

        <div class="cp-row">
          <div class="field">
            <label>Nombre completo <span class="req">*</span></label>
            <input v-model="form.nombre" type="text" placeholder="Tu nombre y apellido" />
          </div>
        </div>

        <div class="cp-row two-col">
          <div class="field">
            <label>Teléfono</label>
            <input v-model="form.telefono" type="tel" placeholder="+503 7000-0000" />
          </div>
          <div class="field">
            <label>Género</label>
            <select v-model="form.genero">
              <option value="">Prefiero no decir</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        <div class="cp-row two-col">
          <div class="field">
            <label>Documento (DUI)</label>
            <input v-model="form.documento" type="text" placeholder="00000000-0" maxlength="10" />
          </div>
          <div class="field">
            <label>Fecha de nacimiento</label>
            <input v-model="form.fecha_nacimiento" type="date" />
          </div>
        </div>

        <div v-if="error"   class="msg-error">{{ error }}</div>
        <div v-if="success" class="msg-success">{{ success }}</div>

        <div class="cp-actions">
          <button class="btn-completar" :disabled="cargando" @click="guardar">
            {{ cargando ? 'Guardando...' : 'Completar perfil →' }}
          </button>
          <button class="btn-omitir" @click="omitir">
            Omitir por ahora
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'

const router  = useRouter()
const usuario = ref(JSON.parse(localStorage.getItem('usuario') || 'null'))

const form = ref({
  nombre:           usuario.value?.nombre || '',
  telefono:         '',
  genero:           '',
  documento:        '',
  fecha_nacimiento: ''
})

const error    = ref('')
const success  = ref('')
const cargando = ref(false)

async function guardar() {
  error.value = ''
  if (!form.value.nombre.trim()) {
    error.value = 'El nombre es obligatorio'
    return
  }

  cargando.value = true
  try {
    const res = await api.put(`/perfil/${usuario.value.id}`, {
      nombre:           form.value.nombre.trim(),
      telefono:         form.value.telefono         || null,
      genero:           form.value.genero           || null,
      documento:        form.value.documento        || null,
      fecha_nacimiento: form.value.fecha_nacimiento || null
    })

    // Actualizar localStorage con perfil_completo = 1
    const usuarioActualizado = {
      ...usuario.value,
      nombre:          res.data.usuario.nombre,
      perfil_completo: 1
    }
    localStorage.setItem('usuario', JSON.stringify(usuarioActualizado))

    success.value = '¡Perfil completado! Redirigiendo...'
    setTimeout(() => router.push('/catalogo'), 1200)
  } catch (err) {
    error.value = err.response?.data?.mensaje || 'Error al guardar el perfil'
  } finally {
    cargando.value = false
  }
}

function omitir() {
  // Marcar como completado provisionalmente para no entrar en loop
  const u = { ...usuario.value, perfil_completo: 1 }
  localStorage.setItem('usuario', JSON.stringify(u))
  router.push('/catalogo')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

* { box-sizing: border-box; }

.cp-root {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg-base); font-family: 'DM Sans', sans-serif;
  padding: 24px; position: relative; overflow: hidden;
}

.bg-grid {
  position: fixed; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(var(--grid-color, rgba(0,0,0,0.04)) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color, rgba(0,0,0,0.04)) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
}
.glow-1 {
  position: fixed; width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(55,138,221,0.15) 0%, transparent 70%);
  top: -150px; left: -100px; pointer-events: none;
}
.glow-2 {
  position: fixed; width: 400px; height: 400px; border-radius: 50%;
  background: radial-gradient(circle, rgba(29,158,117,0.12) 0%, transparent 70%);
  bottom: -100px; right: -80px; pointer-events: none;
}

.cp-card {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 20px; padding: 40px 48px;
  width: 100%; max-width: 560px;
  position: relative; z-index: 1;
  box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  animation: fadeUp 0.5s ease both;
}

.cp-header { margin-bottom: 28px; }
.brand-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(55,138,221,0.1); border: 1px solid rgba(55,138,221,0.2);
  border-radius: 999px; padding: 5px 14px 5px 8px; margin-bottom: 16px;
}
.brand-icon {
  width: 26px; height: 26px;
  background: linear-gradient(135deg, #378ADD, #1D9E75);
  border-radius: 7px; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: #fff; font-family: 'Syne', sans-serif;
}
.brand-badge span { font-size: 12px; font-weight: 500; color: var(--text-secondary); }

.cp-header h2 {
  font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
  color: var(--text-primary); margin-bottom: 6px;
}
.cp-header p { font-size: 13px; color: var(--text-muted); }

.cp-form { display: flex; flex-direction: column; gap: 14px; }
.cp-row { display: flex; flex-direction: column; gap: 14px; }
.cp-row.two-col { flex-direction: row; gap: 14px; }

.field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.field label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--text-muted);
}
.req { color: #E24B4A; }
.field input, .field select {
  background: var(--input-bg, #f9fafb);
  border: 1px solid var(--input-border, #e5e7eb);
  border-radius: 10px; padding: 11px 14px;
  font-size: 14px; color: var(--text-primary);
  font-family: 'DM Sans', sans-serif; outline: none;
  transition: border-color 0.2s;
}
.field input:focus, .field select:focus {
  border-color: rgba(55,138,221,0.5);
  background: rgba(55,138,221,0.04);
}

.msg-error {
  background: rgba(226,75,74,0.1); border: 1px solid rgba(226,75,74,0.3);
  border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #E24B4A;
}
.msg-success {
  background: rgba(29,158,117,0.1); border: 1px solid rgba(29,158,117,0.3);
  border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #1D9E75;
}

.cp-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
.btn-completar {
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, #378ADD, #1D9E75);
  border: none; border-radius: 10px; font-size: 14px; font-weight: 700;
  color: #fff; cursor: pointer; font-family: 'Syne', sans-serif;
  transition: opacity 0.2s;
}
.btn-completar:hover   { opacity: 0.9; }
.btn-completar:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-omitir {
  width: 100%; padding: 11px; background: transparent;
  border: 1px solid var(--border, #e5e7eb); border-radius: 10px;
  font-size: 13px; color: var(--text-muted); cursor: pointer;
  transition: all 0.15s;
}
.btn-omitir:hover { background: var(--bg-card-hover); color: var(--text-secondary); }

@keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }

@media (max-width: 500px) {
  .cp-card { padding: 28px 20px; }
  .cp-row.two-col { flex-direction: column; }
}
</style>