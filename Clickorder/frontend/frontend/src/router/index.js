import { createRouter, createWebHistory } from "vue-router"
import LoginView     from "../views/LoginView.vue"
import ProductosView from "../views/ProductosView.vue"
import PedidosView   from "../views/PedidosView.vue"
import UsuariosView  from "../views/UsuariosView.vue"
import CatalogoView  from "../views/CatalogoView.vue"
import FacturasView  from "../views/FacturasView.vue"
import ConfiguracionView from "../views/ConfiguracionView.vue"
import ReportesView from "../views/ReportesView.vue"
import DashboardView from "../views/DashboardView.vue"

const routes = [
    { path: "/",          redirect: "/login" },
    { path: "/login",     component: LoginView },
    { path: "/productos", component: ProductosView, meta: { requiresAuth: true, soloAdmin: true } },
    { path: "/catalogo",  component: CatalogoView,  meta: { requiresAuth: true } },
    { path: "/pedidos",   component: PedidosView,   meta: { requiresAuth: true, soloAdmin: true } },
    { path: "/usuarios",  component: UsuariosView,  meta: { requiresAuth: true, soloAdmin: true } },
    { path: "/facturas",  component: FacturasView,  meta: { requiresAuth: true, soloAdmin: true } },
    { path: "/reportes", component: ReportesView, meta: { requiresAuth: true, soloAdmin: true } },
    { path: "/configuracion", component: ConfiguracionView, meta: { requiresAuth: true, soloAdmin: true } },
    { path: "/dashboard", component: DashboardView, meta: { requiresAuth: true, soloAdmin: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
    const usuario = JSON.parse(localStorage.getItem("usuario"))
    if (to.meta.requiresAuth && !usuario) return next("/login")
    if (to.meta.soloAdmin && usuario?.rol !== "admin") return next("/catalogo")
    if (to.meta.soloDespacho && !["admin", "logistica"].includes(usuario?.rol))
        return next("/catalogo")
    next()
})

export default router