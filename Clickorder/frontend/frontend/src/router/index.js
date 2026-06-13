// frontend/router/index.js — versión final
import { createRouter, createWebHistory } from "vue-router"
import LoginView         from "../views/LoginView.vue"
import ProductosView     from "../views/ProductosView.vue"
import PedidosView       from "../views/PedidosView.vue"
import UsuariosView      from "../views/UsuariosView.vue"
import CatalogoView      from "../views/CatalogoView.vue"
import FacturasView      from "../views/FacturasView.vue"
import ReportesView      from "../views/ReportesView.vue"
import ConfiguracionView from "../views/ConfiguracionView.vue"
import DashboardView     from "../views/DashboardView.vue"
import RegistroView      from "../views/RegistroView.vue"
import VerificarCuenta   from "../views/VerificarCuenta.vue"
import PerfilView        from "../views/PerfilView.vue"
import CompletarPerfil   from "../views/CompletarPerfil.vue"

const routes = [
  { path: "/",               redirect: "/login" },
  { path: "/login",          component: LoginView },
  { path: "/registro",       component: RegistroView },
  { path: "/verificar-cuenta", component: VerificarCuenta },

  // ── Completar perfil: aplica a Google Y manual después del primer login ──
  {
    path: "/completar-perfil",
    component: CompletarPerfil,
    meta: { requiresAuth: true }
  },

  // ── Perfil completo del cliente ──
  {
    path: "/perfil",
    component: PerfilView,
    meta: { requiresAuth: true, soloCliente: true }
  },

  // ── Catálogo cliente ──
  {
    path: "/catalogo",
    component: CatalogoView,
    meta: { requiresAuth: true }
  },

  // ── Admin / logística ──
  { path: "/productos",     component: ProductosView,     meta: { requiresAuth: true, soloAdmin: true } },
  { path: "/pedidos",       component: PedidosView,       meta: { requiresAuth: true, soloAdmin: true } },
  { path: "/usuarios",      component: UsuariosView,      meta: { requiresAuth: true, soloAdmin: true } },
  { path: "/facturas",      component: FacturasView,      meta: { requiresAuth: true, soloAdmin: true } },
  { path: "/reportes",      component: ReportesView,      meta: { requiresAuth: true, soloAdmin: true } },
  { path: "/configuracion", component: ConfiguracionView, meta: { requiresAuth: true, soloAdmin: true } },
  { path: "/dashboard",     component: DashboardView,     meta: { requiresAuth: true, soloAdmin: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

// ── Rutas públicas (nunca redirigir desde estas) ──
const rutasPublicas = ["/login", "/registro", "/verificar-cuenta"]

router.beforeEach((to, from, next) => {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null")

  // 1. Sin sesión y ruta protegida → login
  if (to.meta.requiresAuth && !usuario) return next("/login")

  // 2. Con sesión y en ruta pública → redirigir según rol
  if (usuario && rutasPublicas.includes(to.path)) {
    if (usuario.rol === "admin" || usuario.rol === "logistica") return next("/dashboard")
    // Cliente con perfil incompleto → completar perfil
    if (usuario.perfil_completo === 0 || usuario.perfil_completo === false) return next("/completar-perfil")
    return next("/catalogo")
  }

  // 3. Solo admin/logística
  if (to.meta.soloAdmin && usuario?.rol !== "admin" && usuario?.rol !== "logistica")
    return next("/catalogo")

  // 4. Solo cliente (ej: /perfil)
  if (to.meta.soloCliente && (usuario?.rol === "admin" || usuario?.rol === "logistica"))
    return next("/dashboard")

  // 5. Guard de perfil incompleto:
  //    Si el cliente no ha completado el perfil, bloquearlo en cualquier ruta
  //    EXCEPTO /completar-perfil misma (para no hacer loop)
  if (
    usuario &&
    (usuario.perfil_completo === 0 || usuario.perfil_completo === false) &&
    usuario.rol === "cliente" &&
    to.path !== "/completar-perfil"
  ) {
    return next("/completar-perfil")
  }

  next()
})

export default router