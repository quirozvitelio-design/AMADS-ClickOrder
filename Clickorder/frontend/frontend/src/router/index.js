import { createRouter, createWebHistory } from "vue-router"
import LoginView    from "../views/LoginView.vue"
import ProductosView from "../views/ProductosView.vue"
import PedidosView   from "../views/PedidosView.vue"
import UsuariosView  from "../views/UsuariosView.vue"

const routes = [
    { path: "/",          redirect: "/login" },
    { path: "/login",     component: LoginView },
    { path: "/productos", component: ProductosView, meta: { requiresAuth: true } },
    { path: "/pedidos",   component: PedidosView,   meta: { requiresAuth: true, soloAdmin: true } },
    { path: "/usuarios",  component: UsuariosView,  meta: { requiresAuth: true, soloAdmin: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
    const usuario = JSON.parse(localStorage.getItem("usuario"))
    if (to.meta.requiresAuth && !usuario)       return next("/login")
    if (to.meta.soloAdmin && usuario?.rol !== "admin") return next("/productos")
    next()
})

export default router