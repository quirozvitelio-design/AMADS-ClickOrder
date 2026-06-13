<template>
  <div class="page-root">

    <!-- ══ TOPBAR ══ -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-brand">
          <div class="brand-diamond">◆</div>
          <span class="brand-name">click<strong>order</strong></span>
        </div>
        <div class="topbar-search">
          <span class="ts-ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input v-model="buscarTexto" type="text" placeholder="Buscar productos..." class="ts-inp" />
        </div>
        <div class="topbar-actions">
          <button :class="['ta-btn', vistaActiva === 'pedidos' ? 'active' : '']"
            @click="vistaActiva = 'pedidos'; verPerfilMenu = false; cargarMisPedidos()">
            <span class="ta-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
              <span v-if="pedidosActivos > 0" class="ta-badge">{{ pedidosActivos }}</span>
            </span>
            <span class="ta-label">Mis<br>Pedidos</span>
          </button>

          <div class="ta-notif-wrap" ref="notifMenuRef">
            <button class="ta-btn" @click="verNotificaciones = !verNotificaciones">
              <span class="ta-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span v-if="notifNoLeidas > 0" class="ta-badge">{{ notifNoLeidas }}</span>
              </span>
              <span class="ta-label">Alertas</span>
            </button>
            <transition name="dropdown">
              <div v-if="verNotificaciones" class="notif-dropdown">
                <div class="notif-header">
                  <span class="notif-title">Notificaciones</span>
                  <button v-if="notifNoLeidas > 0" class="notif-mark-all" @click="marcarTodasLeidas">Marcar todas</button>
                </div>
                <div v-if="notificaciones.length === 0" class="notif-empty">Sin notificaciones aún</div>
                <div v-else class="notif-list">
                  <div v-for="n in notificaciones" :key="n.id"
                    :class="['notif-item', !n.leida ? 'unread' : '']" @click="marcarLeida(n.id)">
                    <div class="notif-dot" v-if="!n.leida"></div>
                    <div class="notif-body">
                      <p class="notif-titulo">{{ n.titulo }}</p>
                      <p class="notif-msg">{{ n.mensaje }}</p>
                      <p class="notif-fecha">{{ formatFecha(n.fecha) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <div class="ta-user-wrap" ref="userMenuRef">
            <button class="ta-btn" @click="verPerfilMenu = !verPerfilMenu">
              <span class="ta-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span class="ta-label" v-if="usuario">Hola,<br><strong>{{ usuario.nombre.split(' ')[0] }}</strong></span>
              <span class="ta-label" v-else>Inicia<br>sesión</span>
            </button>
            <transition name="dropdown">
              <div v-if="verPerfilMenu && usuario" class="perfil-dropdown">
                <div class="pd-header">
                  <div class="pd-avatar">{{ usuario.nombre.charAt(0).toUpperCase() }}</div>
                  <div>
                    <p class="pd-name">{{ usuario.nombre }}</p>
                    <p class="pd-email">{{ usuario.correo || 'cliente' }}</p>
                  </div>
                </div>
                <div class="pd-divider"></div>
                <button class="pd-item" @click="irAlPerfil('perfil')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  Mi perfil
                </button>
                <button class="pd-item" @click="vistaActiva = 'pedidos'; verPerfilMenu = false; cargarMisPedidos()">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                  Mis pedidos
                </button>
                <button class="pd-item" @click="toggleDark">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
                  {{ isDark ? 'Modo claro' : 'Modo oscuro' }}
                </button>
                <div class="pd-divider"></div>
                <button class="pd-item pd-logout" @click="cerrarSesion">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Cerrar sesión
                </button>
              </div>
            </transition>
          </div>

          <button class="ta-cart" @click="verCarrito = !verCarrito">
            <span class="ta-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span v-if="totalItems > 0" class="ta-badge">{{ totalItems }}</span>
            </span>
            <span class="ta-label">Mi carrito<br><strong>${{ totalCarrito.toFixed(2) }}</strong></span>
          </button>
        </div>
      </div>
    </header>

    <!-- ══ SECBAR ══ -->
    <nav class="secbar">
      <div class="secbar-inner">
        <button class="depts-btn" @click="sidebarOpen = !sidebarOpen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <strong>Departamentos</strong>
        </button>
        <div class="secbar-sep"></div>
        <div class="secbar-links">
          <button :class="['secbar-link', categoriaSeleccionada === 'TODOS' && !grupoActivo ? 'active' : '']"
            @click="seleccionarCategoria('TODOS'); vistaActiva = 'productos'">⚡ Todo</button>
          <button v-for="grupo in gruposNavbar" :key="grupo.id"
            :class="['secbar-link', grupoActivo === grupo.id ? 'active' : '']"
            @click="seleccionarGrupo(grupo.id); vistaActiva = 'productos'">
            {{ grupo.emoji }} {{ grupo.nombre }}
          </button>
        </div>
      </div>
    </nav>

    <transition name="toast">
      <div v-if="mostrarToast" class="toast-float">🔔 {{ toastMensaje }}</div>
    </transition>

    <!-- ══ DRAWER ══ -->
    <transition name="sidebar-slide">
      <div v-if="sidebarOpen" class="depts-overlay" @click.self="sidebarOpen = false">
        <aside class="depts-drawer">
          <div class="dd-header">
            <span class="dd-header-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              Departamentos
            </span>
            <button class="dd-close" @click="sidebarOpen = false">✕</button>
          </div>
          <div class="dd-scroll">
            <div class="dd-group">
              <button :class="['dd-item', categoriaSeleccionada === 'TODOS' && !grupoActivo ? 'active' : '']"
                @click="seleccionarCategoria('TODOS'); vistaActiva = 'productos'">
                <span class="dd-ico">⚡</span><span class="dd-label">Todo</span>
                <span class="dd-count">{{ contarPorCategoria('TODOS') }}</span>
              </button>
            </div>
            <div class="dd-group">
              <button class="dd-group-toggle" @click="toggleGrupo('tech')">
                <span><span class="dd-ico">💻</span> Tecnología <span class="dd-grupo-count">{{ contarPorGrupo('tech') }}</span></span>
                <svg :class="['dd-chevron', gruposAbiertos.tech ? 'open' : '']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <transition name="expand">
                <div v-if="gruposAbiertos.tech" class="dd-sub-list">
                  <button :class="['dd-item dd-item-sub dd-item-ver-todo', grupoActivo === 'tech' && categoriaSeleccionada === '__GRUPO__' ? 'active' : '']"
                    @click="seleccionarGrupo('tech'); vistaActiva = 'productos'">
                    <span class="dd-ico">📦</span><span class="dd-label">Ver todo Tecnología</span>
                  </button>
                  <button v-for="cat in categoriasTech" :key="cat.id"
                    :class="['dd-item dd-item-sub', categoriaSeleccionada === cat.id ? 'active' : '']"
                    @click="seleccionarCategoria(cat.id); vistaActiva = 'productos'">
                    <span class="dd-ico">{{ cat.emoji }}</span><span class="dd-label">{{ cat.nombre }}</span>
                    <span v-if="contarPorCategoria(cat.id) > 0" class="dd-count">{{ contarPorCategoria(cat.id) }}</span>
                  </button>
                </div>
              </transition>
            </div>
            <div class="dd-group">
              <button class="dd-group-toggle" @click="toggleGrupo('moda')">
                <span><span class="dd-ico">👗</span> Moda <span class="dd-grupo-count">{{ contarPorGrupo('moda') }}</span></span>
                <svg :class="['dd-chevron', gruposAbiertos.moda ? 'open' : '']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <transition name="expand">
                <div v-if="gruposAbiertos.moda" class="dd-sub-list">
                  <button :class="['dd-item dd-item-sub dd-item-ver-todo', grupoActivo === 'moda' && categoriaSeleccionada === '__GRUPO__' ? 'active' : '']"
                    @click="seleccionarGrupo('moda'); vistaActiva = 'productos'">
                    <span class="dd-ico">📦</span><span class="dd-label">Ver todo Moda</span>
                  </button>
                  <button v-for="cat in categoriasModa" :key="cat.id"
                    :class="['dd-item dd-item-sub', categoriaSeleccionada === cat.id ? 'active' : '']"
                    @click="seleccionarCategoria(cat.id); vistaActiva = 'productos'">
                    <span class="dd-ico">{{ cat.emoji }}</span><span class="dd-label">{{ cat.nombre }}</span>
                    <span v-if="contarPorCategoria(cat.id) > 0" class="dd-count">{{ contarPorCategoria(cat.id) }}</span>
                  </button>
                </div>
              </transition>
            </div>
            <div class="dd-group">
              <button class="dd-group-toggle" @click="toggleGrupo('hogar')">
                <span><span class="dd-ico">🏠</span> Hogar <span class="dd-grupo-count">{{ contarPorGrupo('hogar') }}</span></span>
                <svg :class="['dd-chevron', gruposAbiertos.hogar ? 'open' : '']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <transition name="expand">
                <div v-if="gruposAbiertos.hogar" class="dd-sub-list">
                  <button :class="['dd-item dd-item-sub dd-item-ver-todo', grupoActivo === 'hogar' && categoriaSeleccionada === '__GRUPO__' ? 'active' : '']"
                    @click="seleccionarGrupo('hogar'); vistaActiva = 'productos'">
                    <span class="dd-ico">📦</span><span class="dd-label">Ver todo Hogar</span>
                  </button>
                  <button v-for="cat in categoriasHogar" :key="cat.id"
                    :class="['dd-item dd-item-sub', categoriaSeleccionada === cat.id ? 'active' : '']"
                    @click="seleccionarCategoria(cat.id); vistaActiva = 'productos'">
                    <span class="dd-ico">{{ cat.emoji }}</span><span class="dd-label">{{ cat.nombre }}</span>
                    <span v-if="contarPorCategoria(cat.id) > 0" class="dd-count">{{ contarPorCategoria(cat.id) }}</span>
                  </button>
                </div>
              </transition>
            </div>
            <div class="dd-group">
              <button class="dd-group-toggle" @click="toggleGrupo('mas')">
                <span><span class="dd-ico">🛒</span> Más categorías <span class="dd-grupo-count">{{ contarPorGrupo('mas') }}</span></span>
                <svg :class="['dd-chevron', gruposAbiertos.mas ? 'open' : '']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <transition name="expand">
                <div v-if="gruposAbiertos.mas" class="dd-sub-list">
                  <button :class="['dd-item dd-item-sub dd-item-ver-todo', grupoActivo === 'mas' && categoriaSeleccionada === '__GRUPO__' ? 'active' : '']"
                    @click="seleccionarGrupo('mas'); vistaActiva = 'productos'">
                    <span class="dd-ico">📦</span><span class="dd-label">Ver todo</span>
                  </button>
                  <button v-for="cat in categoriasMas" :key="cat.id"
                    :class="['dd-item dd-item-sub', categoriaSeleccionada === cat.id ? 'active' : '']"
                    @click="seleccionarCategoria(cat.id); vistaActiva = 'productos'">
                    <span class="dd-ico">{{ cat.emoji }}</span><span class="dd-label">{{ cat.nombre }}</span>
                    <span v-if="contarPorCategoria(cat.id) > 0" class="dd-count">{{ contarPorCategoria(cat.id) }}</span>
                  </button>
                </div>
              </transition>
            </div>
            <div class="dd-group">
              <p class="dd-group-label">Disponibilidad</p>
              <button v-for="f in filtrosStock" :key="f.val"
                :class="['dd-item', filtroStock === f.val ? 'active' : '']"
                @click="filtroStock = f.val; sidebarOpen = false">
                <span class="dd-ico">{{ f.emoji }}</span><span class="dd-label">{{ f.label }}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </transition>

    <!-- ══ RESUMEN POST-COMPRA ══ -->
    <div v-if="vistaActiva === 'resumen'" class="resumen-wrap">
      <div class="resumen-box">
        <span class="res-icon">🎉</span>
        <h2>¡Pedido Confirmado!</h2>
        <p class="res-sub">Tu orden fue procesada exitosamente.</p>
        <div class="res-detalles">
          <div class="res-row"><span>Comprador</span><strong>{{ usuario?.nombre }}</strong></div>
          <div class="res-row"><span>Método de pago</span>
            <strong>{{ metodoPagoSeleccionado === 'contra_entrega' ? 'Contra entrega' : metodoPagoSeleccionado === 'paypal' ? 'PayPal' : 'Tarjeta' }}</strong>
          </div>
          <div class="res-row total"><span>Total cobrado</span><strong>${{ totalCarritoHistorial.toFixed(2) }}</strong></div>
        </div>
        <div class="res-btns">
          <button class="btn-prim" @click="vistaActiva = 'productos'">Seguir comprando</button>
          <button class="btn-sec" @click="irAlPerfil('pedidos')">Ver mis pedidos</button>
        </div>
      </div>
    </div>

    <!-- ══ MIS PEDIDOS ══ -->
    <div v-else-if="vistaActiva === 'pedidos'" class="page-padded">
      <div class="section-hdr">
        <button class="btn-back" @click="vistaActiva = 'productos'">← Volver</button>
        <h2 class="section-title">Historial de pedidos</h2>
        <button class="btn-prim-sm" @click="irAlPerfil('pedidos')">Ver perfil completo →</button>
      </div>
      <div v-if="misPedidos.length === 0" class="empty-st">
        <span>📦</span><p>Aún no has realizado ninguna compra.</p>
      </div>
      <div v-else class="pedidos-lista">
        <div v-for="(grupo, key) in pedidosAgrupados" :key="key" class="pedido-history-card">
          <div class="p-card-header">
            <span class="p-id">🛍️ {{ grupo[0].pedido_grupo ? grupo[0].pedido_grupo.slice(0,22)+'...' : 'Orden #'+grupo[0].id }}</span>
            <span class="p-date">📅 {{ formatFecha(grupo[0].fecha) }}</span>
          </div>
          <div class="p-card-body">
            <div v-for="item in grupo" :key="item.id" class="p-item-row">
              <!-- Imagen del producto -->
              <div class="p-item-img-wrap">
                <img :src="item.imagen_url || item.imagen || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=100&q=60'"
                  :alt="item.producto" class="p-item-img"
                  @error="$event.target.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=100&q=60'" />
              </div>
              <span class="p-item-nombre">{{ item.producto }}</span>
              <span class="p-item-detalle">{{ item.cantidad }} u. × ${{ parseFloat(item.precio).toFixed(2) }}</span>
              <span class="p-item-sub">${{ parseFloat(item.total).toFixed(2) }}</span>
            </div>
            <div class="p-orden-total">
              <span>Total de la orden:</span>
              <strong>${{ totalGrupo(grupo) }}</strong>
            </div>
            <div class="pedido-timeline">
              <div :class="['timeline-step', obtenerClasePaso(grupo[0].estado, 1)]"><div class="step-dot"></div><span class="step-label">Recibido</span></div>
              <div :class="['timeline-step', obtenerClasePaso(grupo[0].estado, 2)]"><div class="step-dot"></div><span class="step-label">Preparando</span></div>
              <div :class="['timeline-step', obtenerClasePaso(grupo[0].estado, 3)]"><div class="step-dot"></div><span class="step-label">En Camino</span></div>
              <div :class="['timeline-step', obtenerClasePaso(grupo[0].estado, 4)]"><div class="step-dot"></div><span class="step-label">Entregado</span></div>
            </div>
          </div>
          <div class="p-card-footer">
            <span :class="['estado-pill','estado-'+(grupo[0].estado||'recibido').toLowerCase().replace(/[\\/\s]/g,'-')]">{{ grupo[0].estado || 'Recibido' }}</span>
            <small class="text-muted">{{ formatFecha(grupo[0].fecha_estado_actualizado) }}</small>
          </div>
          <div v-if="facturasCliente[grupo[0].pedido_grupo]" class="factura-row-cliente">
            <span class="factura-num-cliente">🧾 {{ facturasCliente[grupo[0].pedido_grupo].numero_factura }}</span>
            <button class="btn-factura-ver" @click="abrirFacturaPDF(facturasCliente[grupo[0].pedido_grupo].id, facturasCliente[grupo[0].pedido_grupo].numero_factura)">👁 Ver PDF</button>
            <button class="btn-factura-pdf" @click="descargarFacturaPDF(facturasCliente[grupo[0].pedido_grupo].id)">⬇ Descargar</button>
            <button class="btn-factura-json" @click="descargarFacturaJSON(facturasCliente[grupo[0].pedido_grupo].id, facturasCliente[grupo[0].pedido_grupo].numero_factura)">{ } JSON</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ CATÁLOGO ══ -->
    <div v-else class="catalog-view">
      <div class="hero-banner">
        <div class="hero-text">
          <p class="hero-tag">{{ categoriaActivaEmoji }} {{ categoriaActivaNombre }}</p>
          <h2 class="hero-title">Los mejores productos al mejor precio</h2>
          <p class="hero-sub">{{ productosFinales.length }} productos disponibles para ti</p>
        </div>
        <div class="hero-deco">
          <div class="hero-circle c1"></div>
          <div class="hero-circle c2"></div>
          <span class="hero-big-emoji">{{ categoriaActivaEmoji }}</span>
        </div>
      </div>
      <div class="quick-filters">
        <div class="qf-info">
          <span class="qf-breadcrumb">
            <button class="qf-crumb-btn" @click="seleccionarCategoria('TODOS')">Todo</button>
            <template v-if="grupoActivo">
              <span class="qf-sep">›</span>
              <span class="qf-crumb-active">{{ gruposNavbar.find(g => g.id === grupoActivo)?.nombre }}</span>
            </template>
            <template v-else-if="categoriaSeleccionada !== 'TODOS'">
              <span class="qf-sep">›</span>
              <span class="qf-crumb-active">{{ todasCategorias.find(c => c.id === categoriaSeleccionada)?.nombre }}</span>
            </template>
          </span>
          <span class="qf-total">{{ productosFinales.length }} resultados</span>
        </div>
        <select v-model="ordenar" class="qf-sort">
          <option value="default">Relevancia</option>
          <option value="precio-asc">Precio ↑</option>
          <option value="precio-desc">Precio ↓</option>
          <option value="nombre">Nombre A-Z</option>
        </select>
      </div>
      <div v-if="productosFinales.length === 0" class="empty-st">
        <span>🔍</span><p>No se encontraron productos.</p>
        <button class="btn-empty-cta" @click="seleccionarCategoria('TODOS')">Ver todos</button>
      </div>
      <div class="shop-grid">
        <div v-for="p in productosFinales" :key="p.id"
          class="shop-card" :class="{ 'out-stock': p.stock <= 0 }"
          @click="p.stock > 0 && abrirModalCompra(p)">
          <div v-if="p.stock > 0 && p.stock <= 5" class="badge-last">Últimas {{ p.stock }} u.</div>
          <div v-if="p.stock <= 0" class="badge-agotado">Agotado</div>
          <div class="shop-img-wrap">
            <img :src="p.imagen || p.imagen_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&q=70'"
              :alt="p.nombre" class="shop-img"
              @error="$event.target.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&q=70'" />
            <div v-if="p.stock > 0" class="shop-overlay"><span>Ver detalle</span></div>
          </div>
          <div class="shop-info">
            <p class="shop-cat">{{ p.categoria || 'General' }}</p>
            <h3 class="shop-name">{{ p.nombre }}</h3>
            <p class="shop-desc">{{ p.descripcion }}</p>
            <div class="shop-footer">
              <div class="shop-price-wrap">
                <span v-if="p.precio_original && p.precio_original > p.precio" class="shop-price-old">${{ parseFloat(p.precio_original).toFixed(2) }}</span>
                <span class="shop-price">${{ parseFloat(p.precio).toFixed(2) }}</span>
              </div>
              <button class="btn-add" :disabled="p.stock <= 0" @click.stop="abrirModalCompra(p)">
                {{ p.stock <= 0 ? 'Agotado' : '+ Agregar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ CARRITO SIDEBAR ══ -->
    <transition name="slide">
      <div v-if="verCarrito" class="carrito-overlay" @click.self="verCarrito = false">
        <div class="carrito-sidebar">
          <div class="cart-header">
            <div class="cart-header-left">
              <h3 class="cart-title">Carrito</h3>
              <span v-if="totalItems > 0" class="cart-count-pill">{{ totalItems }}</span>
            </div>
            <button class="btn-close" @click="verCarrito = false">✕</button>
          </div>
          <div v-if="carrito.length === 0" class="cart-empty">
            <span>🛍️</span><p>Tu carrito está vacío</p>
            <button class="btn-empty-cta" @click="verCarrito = false">Ver productos</button>
          </div>
          <div v-else class="cart-body">
            <div class="cart-items">
              <div v-for="item in carrito" :key="item.id" class="cart-item">
                <div class="cart-img-wrap">
                  <img :src="item.imagen || item.imagen_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&q=60'"
                    :alt="item.nombre" class="cart-img"
                    @error="$event.target.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&q=60'" />
                </div>
                <div class="cart-item-body">
                  <div class="cart-item-top">
                    <div class="cart-item-info">
                      <p class="cart-item-brand">{{ item.categoria || 'ClickOrder' }}</p>
                      <h4 class="cart-item-name">{{ item.nombre }}</h4>
                    </div>
                    <button class="btn-remove-item" @click="eliminarDelCarrito(item.id)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                  <div class="cart-item-bottom">
                    <span class="cart-price">${{ parseFloat(item.precio).toFixed(2) }}</span>
                    <div class="cart-qty-stepper">
                      <button class="qty-minus" @click="restarCarrito(item)" :disabled="item.cantidad <= 1">−</button>
                      <span class="qty-val">{{ item.cantidad }}</span>
                      <button class="qty-plus" @click="sumarCarrito(item)" :disabled="item.cantidad >= item.stock">+</button>
                    </div>
                    <span class="cart-item-subtotal">${{ (item.precio * item.cantidad).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="cart-footer">
              <div class="cart-totals">
                <div class="cart-total-row"><span>Subtotal</span><span>${{ subtotalCarrito.toFixed(2) }}</span></div>
                <div v-if="descuentoTotal > 0" class="cart-total-row discount"><span>Descuento</span><span>−${{ descuentoTotal.toFixed(2) }}</span></div>
                <div class="cart-total-row grand-total"><span>Total</span><strong class="grand-total-val">${{ totalCarrito.toFixed(2) }}</strong></div>
              </div>
              <button class="btn-checkout" @click="abrirCheckout">
                Ir a pagar — ${{ totalCarrito.toFixed(2) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL DETALLE PRODUCTO ══ -->
    <transition name="modal">
      <div v-if="modalCompra.visible" class="modal-overlay" @click.self="modalCompra.visible = false">
        <div class="modal-detail">
          <div class="modal-img-wrap">
            <img :src="modalCompra.producto?.imagen || modalCompra.producto?.imagen_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=60'"
              :alt="modalCompra.producto?.nombre" class="modal-img"
              @error="$event.target.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=60'" />
            <button class="modal-close-btn" @click="modalCompra.visible = false">✕</button>
            <div v-if="modalCompra.producto?.stock <= 5 && modalCompra.producto?.stock > 0" class="modal-last-badge">
              Últimas {{ modalCompra.producto.stock }} unidades
            </div>
          </div>
          <div class="modal-body">
            <p class="modal-cat">{{ modalCompra.producto?.categoria || 'General' }}</p>
            <h2 class="modal-name">{{ modalCompra.producto?.nombre }}</h2>
            <p class="modal-desc">{{ modalCompra.producto?.descripcion }}</p>
            <div class="modal-meta">
              <div class="meta-item">
                <span class="meta-label">Precio</span>
                <span class="meta-val precio">${{ modalCompra.producto?.precio }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Stock</span>
                <span class="meta-val">{{ modalCompra.producto?.stock }} disponibles</span>
              </div>
            </div>
            <div class="modal-qty-wrap">
              <span class="meta-label">Cantidad</span>
              <div class="modal-qty">
                <button @click="modificarCantidadModal(-1)" :disabled="modalCompra.cantidad <= 1">−</button>
                <span>{{ modalCompra.cantidad }}</span>
                <button @click="modificarCantidadModal(1)" :disabled="modalCompra.cantidad >= modalCompra.producto?.stock">+</button>
              </div>
              <span class="modal-subtotal">Subtotal: <strong>${{ (modalCompra.cantidad * (modalCompra.producto?.precio || 0)).toFixed(2) }}</strong></span>
            </div>
            <button class="btn-modal-add" @click="agregarAlCarritoConfirmado">
              🛒 Agregar al carrito — ${{ (modalCompra.cantidad * (modalCompra.producto?.precio || 0)).toFixed(2) }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL CHECKOUT 3 PASOS ══ -->
    <transition name="modal">
      <div v-if="verCheckout" class="modal-overlay" @click.self="verCheckout = false">
        <div class="checkout-modal">
          <div class="ck-header">
            <button class="btn-close" @click="verCheckout = false">✕</button>
            <div class="ck-steps">
              <div :class="['ck-step', pasoCheckout >= 1 ? 'active' : '']">
                <span class="ck-step-num">1</span><span class="ck-step-label">Dirección</span>
              </div>
              <div :class="['ck-step-line', pasoCheckout >= 2 ? 'done' : '']"></div>
              <div :class="['ck-step', pasoCheckout >= 2 ? 'active' : '']">
                <span class="ck-step-num">2</span><span class="ck-step-label">Pago</span>
              </div>
              <div :class="['ck-step-line', pasoCheckout >= 3 ? 'done' : '']"></div>
              <div :class="['ck-step', pasoCheckout >= 3 ? 'active' : '']">
                <span class="ck-step-num">3</span><span class="ck-step-label">Confirmar</span>
              </div>
            </div>
          </div>

          <!-- PASO 1: Dirección -->
          <div v-if="pasoCheckout === 1" class="ck-body">
            <h3 class="ck-title">📍 Dirección de entrega</h3>
            <div v-if="direcciones.length === 0" class="ck-empty-dir">
              <p>No tienes direcciones guardadas.</p>
              <button class="btn-prim" @click="verCheckout = false; irAlPerfil('direcciones')">+ Añadir dirección</button>
            </div>
            <div v-else class="ck-dir-list">
              <div v-for="dir in direcciones" :key="dir.id"
                :class="['ck-dir-card', direccionSeleccionada === dir.id ? 'selected' : '']"
                @click="direccionSeleccionada = dir.id">
                <div class="ck-dir-radio"><div :class="['ck-radio-dot', direccionSeleccionada === dir.id ? 'active' : '']"></div></div>
                <div class="ck-dir-info">
                  <p class="ck-dir-nombre">{{ dir.destinatario }}</p>
                  <p class="ck-dir-detalle">{{ dir.calle }}{{ dir.info_adicional ? ', ' + dir.info_adicional : '' }}</p>
                  <p class="ck-dir-detalle">{{ dir.municipio }}, {{ dir.departamento }}</p>
                </div>
                <span v-if="dir.es_principal" class="badge-principal">Principal</span>
              </div>
            </div>
            <button class="btn-text-link" @click="verCheckout = false; irAlPerfil('direcciones')">+ Añadir nueva dirección</button>
            <div class="ck-footer">
              <button class="btn-sec" @click="verCheckout = false; verCarrito = true">← Volver al carrito</button>
              <button class="btn-prim" :disabled="!direccionSeleccionada && direcciones.length > 0" @click="pasoCheckout = 2">Continuar →</button>
            </div>
          </div>

          <!-- PASO 2: Método de pago -->
          <div v-if="pasoCheckout === 2" class="ck-body">
            <h3 class="ck-title">💳 Método de pago</h3>
            <div class="ck-payment-opts">
              <!-- Tarjeta -->
              <label :class="['ck-pay-opt', metodoPagoSeleccionado === 'tarjeta' ? 'selected' : '']">
                <input type="radio" value="tarjeta" v-model="metodoPagoSeleccionado" hidden>
                <div class="ck-pay-radio"><div :class="['ck-radio-dot', metodoPagoSeleccionado === 'tarjeta' ? 'active' : '']"></div></div>
                <div class="ck-pay-info">
                  <p class="ck-pay-titulo">💳 Tarjeta de crédito / débito</p>
                  <p class="ck-pay-sub">Visa, Mastercard, American Express</p>
                </div>
              </label>
              <!-- PayPal -->
              <label :class="['ck-pay-opt', metodoPagoSeleccionado === 'paypal' ? 'selected' : '']">
                <input type="radio" value="paypal" v-model="metodoPagoSeleccionado" hidden>
                <div class="ck-pay-radio"><div :class="['ck-radio-dot', metodoPagoSeleccionado === 'paypal' ? 'active' : '']"></div></div>
                <div class="ck-pay-info">
                  <p class="ck-pay-titulo">
                    <svg width="60" height="16" viewBox="0 0 124 33" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle">
                      <path d="M46.21 6.75H37.2c-.63 0-1.16.46-1.25 1.08l-3.7 23.46c-.07.45.28.86.74.86h4.38c.63 0 1.16-.46 1.25-1.08l1-6.34c.09-.62.62-1.08 1.25-1.08h2.96c6.17 0 9.73-2.99 10.66-8.91.42-2.59.02-4.63-1.18-6.05-1.32-1.57-3.66-2.39-6.1-2.39v.05zm1.08 8.78c-.51 3.36-3.07 3.36-5.55 3.36h-1.41l.99-6.25c.06-.38.39-.65.77-.65h.65c1.69 0 3.28 0 4.1.96.49.57.64 1.42.45 2.58z" fill="#003087"/>
                      <path d="M79.9 15.37h-4.38c-.38 0-.71.27-.77.65l-.2 1.25-.31-.45c-.96-1.39-3.1-1.86-5.24-1.86-4.9 0-9.09 3.71-9.9 8.91-.42 2.59.18 5.07 1.64 6.8 1.35 1.59 3.27 2.25 5.56 2.25 3.95 0 6.14-2.54 6.14-2.54l-.2 1.23c-.07.45.28.86.74.86h3.95c.63 0 1.16-.46 1.25-1.08l2.37-14.97c.07-.46-.28-.87-.74-.87h-.01v.02zm-6.1 8.63c-.43 2.54-2.44 4.25-5 4.25-1.28 0-2.31-.41-2.97-1.19-.66-.77-.9-1.87-.7-3.09.41-2.52 2.45-4.28 4.97-4.28 1.25 0 2.27.41 2.95 1.2.68.8.94 1.91.75 3.11z" fill="#003087"/>
                      <path d="M101.69 15.37h-4.41c-.42 0-.82.21-1.06.56l-6.12 9.01-2.59-8.66a1.27 1.27 0 00-1.21-.91h-4.33c-.5 0-.84.49-.68.96l4.88 14.33-4.59 6.48c-.34.48 0 1.14.59 1.14h4.41c.42 0 .82-.21 1.05-.55l14.74-21.28c.34-.48 0-1.14-.6-1.14l.01.06h.01z" fill="#003087"/>
                    </svg>
                  </p>
                  <p class="ck-pay-sub">Paga de forma segura con tu cuenta PayPal</p>
                </div>
              </label>

              <!-- Contra entrega -->
              <label :class="['ck-pay-opt', metodoPagoSeleccionado === 'contra_entrega' ? 'selected' : '']">
                <input type="radio" value="contra_entrega" v-model="metodoPagoSeleccionado" hidden>
                <div class="ck-pay-radio"><div :class="['ck-radio-dot', metodoPagoSeleccionado === 'contra_entrega' ? 'active' : '']"></div></div>
                <div class="ck-pay-info">
                  <p class="ck-pay-titulo">🚚 Contra entrega</p>
                  <p class="ck-pay-sub">Pagas cuando recibes tu pedido</p>
                </div>
              </label>
            </div>

            <!-- Sección tarjeta: muestra las guardadas + opción agregar nueva -->
            <div v-if="metodoPagoSeleccionado === 'tarjeta'" class="ck-card-section">
              <!-- Tarjetas guardadas -->
              <div v-if="tarjetasGuardadas.length > 0">
                <p class="ck-sec-label" style="margin-top:14px">Tus tarjetas guardadas</p>
                <div class="ck-tar-list">
                  <div v-for="tar in tarjetasGuardadas" :key="tar.id"
                    :class="['ck-tar-item', tarjetaSeleccionada === tar.id ? 'selected' : '']"
                    @click="tarjetaSeleccionada = tar.id; mostrarFormNuevaTar = false">
                    <div class="ck-tar-chip">
                      <svg width="32" height="22" viewBox="0 0 32 22"><rect width="32" height="22" rx="4" :fill="tar.tipo==='mastercard'?'#eb001b':tar.tipo==='amex'?'#007b5e':'#1a1f71'"/><rect x="2" y="6" width="10" height="8" rx="2" fill="white" opacity=".3"/></svg>
                    </div>
                    <div class="ck-tar-info">
                      <p class="ck-tar-num">•••• •••• •••• {{ tar.ultimos_cuatro }}</p>
                      <p class="ck-tar-sub">{{ tar.nombre_titular }} · Vence {{ tar.expiracion }}</p>
                    </div>
                    <span v-if="tar.es_principal" class="ck-tar-badge">Principal</span>
                    <div class="ck-dir-radio"><div :class="['ck-radio-dot', tarjetaSeleccionada === tar.id ? 'active' : '']"></div></div>
                  </div>
                </div>
              </div>

              <!-- Agregar tarjeta nueva -->
              <div class="ck-nueva-tar">
                <button class="ck-nueva-tar-toggle" @click="mostrarFormNuevaTar = !mostrarFormNuevaTar; tarjetaSeleccionada = null">
                  <span style="font-size:18px">{{ mostrarFormNuevaTar ? '−' : '+' }}</span>
                  Usar otra tarjeta
                </button>
                <div v-if="mostrarFormNuevaTar" class="ck-nueva-tar-form">
                  <!-- Preview -->
                  <div :class="['ck-nueva-tar-preview', 'tipo-' + tipoTarjetaNueva]">
                    <p class="cntp-num">{{ nuevaTarjetaVista }}</p>
                    <div class="cntp-bottom">
                      <span>{{ nuevaTar.nombre || 'NOMBRE TITULAR' }}</span>
                      <span>{{ nuevaTar.expira || '**/**' }}</span>
                    </div>
                  </div>
                  <input v-model="nuevaTar.numero" type="text" placeholder="Número de tarjeta" maxlength="19" class="ck-input" @input="formatNuevaTar" />
                  <input v-model="nuevaTar.nombre" type="text" placeholder="Nombre en la tarjeta" class="ck-input" style="text-transform:uppercase" />
                  <div class="ck-card-row">
                    <input v-model="nuevaTar.expira" type="text" placeholder="MM/AA" maxlength="5" class="ck-input" @input="formatNuevaTarExp" />
                    <input v-model="nuevaTar.cvv" type="password" placeholder="CVV" maxlength="4" class="ck-input" />
                  </div>
                  <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);cursor:pointer">
                    <input type="checkbox" v-model="nuevaTar.guardar" /> Guardar esta tarjeta en mi perfil
                  </label>
                </div>
              </div>
            </div>

            <!-- Sección PayPal (v-show mantiene el DOM para que PayPal pueda montarse) -->
            <div v-show="metodoPagoSeleccionado === 'paypal'" class="paypal-section">
              <div id="paypal-button-container"></div>
              <p class="paypal-sandbox-note">🧪 Entorno de prueba (sandbox) — No se realizan cargos reales</p>
            </div>

            <div class="ck-footer" v-if="metodoPagoSeleccionado !== 'paypal'">
              <button class="btn-sec" @click="pasoCheckout = 1">← Cambiar dirección</button>
              <button class="btn-prim" @click="validarPagoYContinuar">Continuar →</button>
            </div>
            <div class="ck-footer" v-else>
              <button class="btn-sec" @click="pasoCheckout = 1">← Cambiar dirección</button>
              <p style="font-size:12px;color:var(--text-muted);align-self:center">Aprueba el pago en PayPal para continuar</p>
            </div>
          </div>

          <!-- PASO 3: Resumen -->
          <div v-if="pasoCheckout === 3" class="ck-body">
            <h3 class="ck-title">🧾 Resumen del pedido</h3>
            <div class="ck-resumen-dir" v-if="direccionSeleccionada">
              <p class="ck-sec-label">📍 Enviar a</p>
              <template v-for="dir in direcciones" :key="dir.id">
                <div v-if="dir.id === direccionSeleccionada" class="ck-dir-elegida">
                  <p style="font-weight:600;color:var(--text-primary)">{{ dir.destinatario }}</p>
                  <p style="font-size:13px;color:var(--text-secondary)">{{ dir.calle }}{{ dir.info_adicional ? ', ' + dir.info_adicional : '' }}, {{ dir.municipio }}, {{ dir.departamento }}</p>
                </div>
              </template>
            </div>
            <div class="ck-items">
              <p class="ck-sec-label">🛒 Productos</p>
              <div v-for="item in carrito" :key="item.id" class="ck-item-row">
                <img :src="item.imagen || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=80&q=60'" class="ck-item-img"
                  @error="$event.target.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=80&q=60'" />
                <span class="ck-item-nombre">{{ item.nombre }}</span>
                <span class="ck-item-cant">× {{ item.cantidad }}</span>
                <span class="ck-item-precio">${{ (item.precio * item.cantidad).toFixed(2) }}</span>
              </div>
            </div>
            <div class="ck-metodo">
              <p class="ck-sec-label">💳 Método de pago</p>
              <p style="font-size:14px;font-weight:600;color:var(--text-primary)">
                {{ metodoPagoSeleccionado === 'contra_entrega' ? '🚚 Contra entrega'
                 : metodoPagoSeleccionado === 'paypal' ? '🔵 PayPal'
                 : '💳 Tarjeta' }}
                <span v-if="metodoPagoSeleccionado === 'tarjeta' && tarjetaSeleccionada" style="font-size:12px;color:var(--text-muted);font-weight:400;margin-left:6px">
                  (•••• {{ tarjetasGuardadas.find(t=>t.id===tarjetaSeleccionada)?.ultimos_cuatro }})
                </span>
                <span v-else-if="metodoPagoSeleccionado === 'tarjeta' && mostrarFormNuevaTar && nuevaTar.numero" style="font-size:12px;color:var(--text-muted);font-weight:400;margin-left:6px">
                  (•••• {{ nuevaTar.numero.replace(/\s/g,'').slice(-4) }})
                </span>
              </p>
            </div>
            <div class="ck-total-row">
              <span>Total</span>
              <strong class="grand-total-val">${{ totalCarrito.toFixed(2) }}</strong>
            </div>
            <div class="ck-footer">
              <button class="btn-sec" @click="pasoCheckout = 2">← Cambiar pago</button>
              <button class="btn-checkout" style="flex:1" @click="procesarTodoElCarrito">✅ Confirmar pedido</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL FACTURA PDF ══ -->
    <transition name="modal">
      <div v-if="facturaModal.visible" class="modal-overlay" @click.self="facturaModal.visible = false">
        <div class="factura-pdf-modal">
          <div class="fpdf-header">
            <p class="fpdf-title">🧾 {{ facturaModal.numero }}</p>
            <div class="fpdf-actions">
              <button class="btn-prim-sm" @click="descargarFacturaPDF(facturaModal.id)">⬇ Descargar PDF</button>
              <button class="btn-close" @click="facturaModal.visible = false">✕</button>
            </div>
          </div>
          <iframe v-if="facturaModal.pdfUrl" :src="facturaModal.pdfUrl" class="fpdf-iframe" title="Factura PDF"></iframe>
          <div v-else style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-muted)">
            Cargando PDF...
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, watch, nextTick } from "vue"
import clickOrderApi from "../api/axios"
import { useDarkMode } from "../composables/useDarkMode"
import { useRouter } from "vue-router"

const router  = useRouter()
const usuario = ref(JSON.parse(localStorage.getItem("usuario") || "null"))
const { isDark, toggle: toggleDark } = useDarkMode()

// ── Session timeout 15 min ────────────────────────────────────
const TIMEOUT_MS = 15 * 60 * 1000
let sessionTimer = null
function resetearTimer() {
  clearTimeout(sessionTimer)
  if (!localStorage.getItem("usuario")) return
  sessionTimer = setTimeout(() => { localStorage.removeItem("usuario"); router.push("/login") }, TIMEOUT_MS)
}
const eventosActividad = ["mousemove","mousedown","keydown","scroll","touchstart","click"]

// ── UI ────────────────────────────────────────────────────────
const sidebarOpen    = ref(false)
const verPerfilMenu  = ref(false)
const userMenuRef    = ref(null)
const notifMenuRef   = ref(null)
const gruposAbiertos = reactive({ tech: true, moda: false, hogar: false, mas: false })

function onClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) verPerfilMenu.value = false
  if (notifMenuRef.value && !notifMenuRef.value.contains(e.target)) verNotificaciones.value = false
}

let notifInterval = null

// ═══════════════════════════════════════════════════════════════
// CARRITO — persiste en sessionStorage
// ═══════════════════════════════════════════════════════════════
function cargarCarritoGuardado() {
  try {
    const guardado = sessionStorage.getItem('clickorder_carrito')
    return guardado ? JSON.parse(guardado) : []
  } catch { return [] }
}
function guardarCarrito(items) {
  try { sessionStorage.setItem('clickorder_carrito', JSON.stringify(items)) } catch {}
}

const carrito = ref(cargarCarritoGuardado())
watch(carrito, (v) => guardarCarrito(v), { deep: true })

onMounted(() => {
  document.addEventListener("click", onClickOutside)
  if (usuario.value) {
    eventosActividad.forEach(ev => window.addEventListener(ev, resetearTimer, { passive: true }))
    resetearTimer()
  }
  cargarProductos()
  cargarMisPedidos()
  cargarNotificaciones()
  notifInterval = setInterval(cargarNotificaciones, 30000)
})

onUnmounted(() => {
  document.removeEventListener("click", onClickOutside)
  clearTimeout(sessionTimer)
  clearInterval(notifInterval)
  eventosActividad.forEach(ev => window.removeEventListener(ev, resetearTimer))
})

function irAlPerfil(tab = "perfil") {
  verPerfilMenu.value = false; verCarrito.value = false
  sessionStorage.setItem("perfilTab", tab); router.push("/perfil")
}

// ── Data ──────────────────────────────────────────────────────
const productos              = ref([])
const misPedidos             = ref([])
const vistaActiva            = ref("productos")
const verCarrito             = ref(false)
const totalCarritoHistorial  = ref(0)
const metodoPagoSeleccionado = ref("tarjeta")
const buscarTexto            = ref("")
const categoriaSeleccionada  = ref("TODOS")
const grupoActivo            = ref(null)
const filtroStock            = ref("todos")
const ordenar                = ref("default")
const mostrarToast           = ref(false)
const toastMensaje           = ref("")
const modalCompra            = ref({ visible: false, producto: null, cantidad: 1 })
const facturasCliente        = ref({})

// ── Factura PDF modal ─────────────────────────────────────────
const facturaModal = reactive({ visible: false, id: null, numero: '', pdfUrl: null })

function abrirFacturaPDF(id, numero) {
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/facturas/${id}/pdf`
  facturaModal.id      = id
  facturaModal.numero  = numero
  facturaModal.pdfUrl  = url
  facturaModal.visible = true
}
function descargarFacturaPDF(id) {
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/facturas/${id}/pdf`
  const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.click()
}
async function descargarFacturaJSON(id, numero) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/facturas/${id}/json`)
    const blob = await res.blob(); const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `${numero}.json`; a.click(); URL.revokeObjectURL(url)
  } catch { alert("Error al descargar JSON") }
}

// ── Notificaciones ────────────────────────────────────────────
const notificaciones    = ref([])
const verNotificaciones = ref(false)
const notifNoLeidas     = computed(() => notificaciones.value.filter(n => !n.leida).length)

async function cargarNotificaciones() {
  if (!usuario.value) return
  try { const r = await clickOrderApi.get(`/notificaciones/${usuario.value.id}`); notificaciones.value = r.data }
  catch (e) { console.error(e) }
}
async function marcarLeida(id) {
  try { await clickOrderApi.patch(`/notificaciones/${id}/leer`); const n = notificaciones.value.find(x => x.id === id); if (n) n.leida = true }
  catch (e) { console.error(e) }
}
async function marcarTodasLeidas() {
  try { await clickOrderApi.patch(`/notificaciones/leer-todas/${usuario.value.id}`); notificaciones.value.forEach(n => { n.leida = true }) }
  catch (e) { console.error(e) }
}

// ══════════════════════════════════════════════════════════════
// CHECKOUT
// ══════════════════════════════════════════════════════════════
const verCheckout           = ref(false)
const pasoCheckout          = ref(1)
const direcciones           = ref([])
const direccionSeleccionada = ref(null)

// Tarjetas guardadas en perfil
const tarjetasGuardadas    = ref([])
const tarjetaSeleccionada  = ref(null)
const mostrarFormNuevaTar  = ref(false)
const nuevaTar             = ref({ numero: '', nombre: '', expira: '', cvv: '', guardar: false })

const tipoTarjetaNueva = computed(() => {
  const n = nuevaTar.value.numero.replace(/\s/g, '')
  if (n.startsWith('4')) return 'visa'
  if (/^5[1-5]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  return 'otro'
})
const nuevaTarjetaVista = computed(() => {
  const n = nuevaTar.value.numero.replace(/\s/g, '')
  if (!n) return '•••• •••• •••• ••••'
  return n.padEnd(16, '•').match(/.{1,4}/g).join(' ')
})
function formatNuevaTar(e) {
  let val = e.target.value.replace(/\D/g, '').slice(0, 16)
  nuevaTar.value.numero = val.match(/.{1,4}/g)?.join(' ') || val
}
function formatNuevaTarExp(e) {
  let val = e.target.value.replace(/\D/g, '').slice(0, 4)
  if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2)
  nuevaTar.value.expira = val
}

async function cargarDirecciones() {
  if (!usuario.value) return
  try {
    const r = await clickOrderApi.get(`/perfil/${usuario.value.id}/direcciones`)
    direcciones.value = r.data
    const principal = r.data.find(d => d.es_principal)
    if (principal) direccionSeleccionada.value = principal.id
    else if (r.data.length > 0) direccionSeleccionada.value = r.data[0].id
  } catch (e) { console.error(e) }
}
async function cargarTarjetasCheckout() {
  if (!usuario.value) return
  try {
    const r = await clickOrderApi.get(`/perfil/${usuario.value.id}/tarjetas`)
    tarjetasGuardadas.value = r.data
    const principal = r.data.find(t => t.es_principal)
    if (principal) tarjetaSeleccionada.value = principal.id
    else if (r.data.length > 0) tarjetaSeleccionada.value = r.data[0].id
  } catch (e) { console.error(e) }
}

function validarPagoYContinuar() {
  if (metodoPagoSeleccionado.value === 'tarjeta') {
    if (!tarjetaSeleccionada.value && !mostrarFormNuevaTar.value) {
      alert('Selecciona o agrega una tarjeta'); return
    }
    if (mostrarFormNuevaTar.value) {
      const n = nuevaTar.value.numero.replace(/\s/g, '')
      if (n.length < 13 || !nuevaTar.value.expira || !nuevaTar.value.cvv) {
        alert('Completa los datos de la tarjeta'); return
      }
    }
  }
  pasoCheckout.value = 3
}

function abrirCheckout() {
  if (!carrito.value.length) return
  pasoCheckout.value = 1
  verCheckout.value  = true
  verCarrito.value   = false
  mostrarFormNuevaTar.value = false
  nuevaTar.value = { numero: '', nombre: '', expira: '', cvv: '', guardar: false }
  cargarDirecciones()
  cargarTarjetasCheckout()
}

// ── PayPal Sandbox ────────────────────────────────────────────
// REEMPLAZA 'TU_PAYPAL_CLIENT_ID_SANDBOX' con tu Client ID real de sandbox
const PAYPAL_CLIENT_ID = 'Ac8kTc-TipF7AmPXn1iVKJEhP5QWzyam3UPIvujNg75ruVHZIO662BQMruWvxiI6d7aJZsT_4a0JKUqo'
let paypalLoaded = false

async function cargarPayPal() {
  if (paypalLoaded || document.getElementById('paypal-sdk')) return
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.id  = 'paypal-sdk'
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`
    script.onload = () => { paypalLoaded = true; resolve() }
    document.head.appendChild(script)
  })
}

async function montarPayPal() {
  await cargarPayPal()
  // Esperar hasta que window.paypal esté disponible
  let attempts = 0
  while (!window.paypal && attempts < 30) {
    await new Promise(r => setTimeout(r, 200))
    attempts++
  }
  if (!window.paypal) { console.warn('PayPal SDK no cargó'); return }
  const container = document.getElementById('paypal-button-container')
  if (!container) { console.warn('Container de PayPal no encontrado'); return }
  // Limpiar siempre para re-montar limpio
  container.innerHTML = ''
  window.paypal.Buttons({
    style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 44 },
    createOrder(data, actions) {
      return actions.order.create({
        purchase_units: [{
          description: 'Compra ClickOrder',
          amount: { value: totalCarrito.value.toFixed(2), currency_code: 'USD' }
        }]
      })
    },
    onApprove(data, actions) {
      return actions.order.capture().then(async (details) => {
        metodoPagoSeleccionado.value = 'paypal'
        await procesarTodoElCarrito()
      })
    },
    onError(err) { console.error('PayPal error:', err); alert('Error con PayPal. Intenta de nuevo.') }
  }).render('#paypal-button-container')
}

// Montar PayPal cuando se seleccione y paso 2 esté visible
// Montar PayPal cuando se selecciona en paso 2
watch([() => metodoPagoSeleccionado.value, () => pasoCheckout.value], async ([metodo, paso]) => {
  if (metodo === 'paypal' && paso === 2) {
    await nextTick()
    setTimeout(() => montarPayPal(), 400)
  }
})

// ── Categorías ────────────────────────────────────────────────
const gruposNavbar = [
  { id: "tech",  nombre: "Tecnología", emoji: "💻" },
  { id: "moda",  nombre: "Moda",       emoji: "👗" },
  { id: "hogar", nombre: "Hogar",      emoji: "🏠" },
  { id: "mas",   nombre: "Más",        emoji: "🛒" },
]
const categoriasPorGrupo = {
  tech:  ["Pantallas y Audio","Celulares y Tablets","Computadoras","Laptops","Zona Gaming","Audio y Audífonos","Cargadores y Energía","Cables y Conectividad","Almacenamiento y Computación","Soportes y Accesorios","Cases y Protección","Smartwatches","Fotografía","Smart Home","Impresoras"],
  moda:  ["Zapatos","Ropa de Mujer","Ropa de Hombre","Ropa Infantil","Accesorios de Moda","Belleza"],
  hogar: ["Hogar y Estilo de Vida","Camas y Dormitorio","Muebles","Línea Blanca"],
  mas:   ["Bebés","Niños y Juguetes","Deporte y Viaje","Mascotas","Bienestar y Salud","Librería","Automotriz y Ferretería"],
}
const categoriasTech = [
  { id: "Pantallas y Audio",            nombre: "Pantallas y Audio",   emoji: "📺" },
  { id: "Celulares y Tablets",          nombre: "Celulares y Tablets", emoji: "📱" },
  { id: "Computadoras",                 nombre: "Computadoras",        emoji: "💻" },
  { id: "Laptops",                      nombre: "Laptops",             emoji: "🖥️" },
  { id: "Zona Gaming",                  nombre: "Zona Gaming",         emoji: "🎮" },
  { id: "Audio y Audífonos",            nombre: "Audio y Audífonos",   emoji: "🎵" },
  { id: "Cargadores y Energía",         nombre: "Cargadores",          emoji: "🔌" },
  { id: "Cables y Conectividad",        nombre: "Cables & Hubs",       emoji: "🔗" },
  { id: "Almacenamiento y Computación", nombre: "Almacenamiento",      emoji: "💾" },
  { id: "Soportes y Accesorios",        nombre: "Soportes",            emoji: "📐" },
  { id: "Cases y Protección",           nombre: "Cases",               emoji: "🛡️" },
  { id: "Smartwatches",                 nombre: "Smartwatches",        emoji: "⌚" },
  { id: "Fotografía",                   nombre: "Fotografía",          emoji: "📷" },
  { id: "Smart Home",                   nombre: "Smart Home",          emoji: "🏡" },
  { id: "Impresoras",                   nombre: "Impresoras",          emoji: "🖨️" },
]
const categoriasModa = [
  { id: "Zapatos",            nombre: "Zapatos",       emoji: "👟" },
  { id: "Ropa de Mujer",      nombre: "Ropa Mujer",    emoji: "👗" },
  { id: "Ropa de Hombre",     nombre: "Ropa Hombre",   emoji: "👕" },
  { id: "Ropa Infantil",      nombre: "Ropa Infantil", emoji: "🧒" },
  { id: "Accesorios de Moda", nombre: "Accesorios",    emoji: "👜" },
  { id: "Belleza",            nombre: "Belleza",       emoji: "💄" },
]
const categoriasHogar = [
  { id: "Hogar y Estilo de Vida", nombre: "Hogar",              emoji: "🏠" },
  { id: "Camas y Dormitorio",     nombre: "Camas y Dormitorio", emoji: "🛏️" },
  { id: "Muebles",                nombre: "Muebles",            emoji: "🛋️" },
  { id: "Línea Blanca",           nombre: "Línea Blanca",       emoji: "🫙" },
]
const categoriasMas = [
  { id: "Bebés",                   nombre: "Bebés",                   emoji: "🍼" },
  { id: "Niños y Juguetes",        nombre: "Niños y Juguetes",        emoji: "🧸" },
  { id: "Deporte y Viaje",         nombre: "Deporte y Viaje",         emoji: "🏋️" },
  { id: "Mascotas",                nombre: "Mascotas",                emoji: "🐾" },
  { id: "Bienestar y Salud",       nombre: "Bienestar y Salud",       emoji: "💊" },
  { id: "Librería",                nombre: "Librería",                emoji: "📚" },
  { id: "Automotriz y Ferretería", nombre: "Automotriz y Ferretería", emoji: "🔧" },
]
const filtrosStock = [
  { val: "todos",      label: "Todos",            emoji: "📋" },
  { val: "disponible", label: "Disponibles",      emoji: "✅" },
  { val: "ultimos",    label: "Últimas unidades", emoji: "🔥" },
]
const todasCategorias = [...categoriasTech, ...categoriasModa, ...categoriasHogar, ...categoriasMas]

function seleccionarCategoria(id) { categoriaSeleccionada.value = id; grupoActivo.value = null; sidebarOpen.value = false }
function seleccionarGrupo(grupoId) { grupoActivo.value = grupoId; categoriaSeleccionada.value = "__GRUPO__"; sidebarOpen.value = false }
function toggleGrupo(k) { gruposAbiertos[k] = !gruposAbiertos[k] }

const categoriaActivaNombre = computed(() => {
  if (categoriaSeleccionada.value === "TODOS") return "Todo"
  if (categoriaSeleccionada.value === "__GRUPO__") return gruposNavbar.find(g => g.id === grupoActivo.value)?.nombre || "Todo"
  return todasCategorias.find(c => c.id === categoriaSeleccionada.value)?.nombre || "Todo"
})
const categoriaActivaEmoji = computed(() => {
  if (categoriaSeleccionada.value === "TODOS") return "⚡"
  if (categoriaSeleccionada.value === "__GRUPO__") return gruposNavbar.find(g => g.id === grupoActivo.value)?.emoji || "⚡"
  return todasCategorias.find(c => c.id === categoriaSeleccionada.value)?.emoji || "⚡"
})
function contarPorCategoria(id) {
  if (id === "TODOS") return productos.value.filter(p => p.stock > 0).length
  return productos.value.filter(p => p.categoria === id && p.stock > 0).length
}
function contarPorGrupo(grupoId) {
  return productos.value.filter(p => (categoriasPorGrupo[grupoId]||[]).includes(p.categoria) && p.stock > 0).length
}
const pedidosActivos = computed(() => misPedidos.value.filter(p => !["completado","entregado"].includes((p.estado||"").toLowerCase())).length)
const pedidosAgrupados = computed(() => {
  const g = {}
  for (const p of misPedidos.value) {
    const k = p.pedido_grupo || `individual_${p.id}`
    if (!g[k]) g[k] = []
    g[k].push(p)
  }
  return Object.fromEntries(Object.entries(g).sort(([,a],[,b]) => new Date(b[0].fecha)-new Date(a[0].fecha)))
})
const productosFiltrados = computed(() =>
  productos.value.filter(p => {
    let cumpleCat = false
    if (categoriaSeleccionada.value === "TODOS") cumpleCat = true
    else if (categoriaSeleccionada.value === "__GRUPO__") cumpleCat = (categoriasPorGrupo[grupoActivo.value]||[]).includes(p.categoria)
    else cumpleCat = p.categoria === categoriaSeleccionada.value
    const cumpleText = p.nombre.toLowerCase().includes(buscarTexto.value.toLowerCase()) || (p.descripcion||"").toLowerCase().includes(buscarTexto.value.toLowerCase())
    const cumpleStock = filtroStock.value === "todos" ? true : filtroStock.value === "disponible" ? p.stock > 0 : p.stock > 0 && p.stock <= 5
    return cumpleCat && cumpleText && cumpleStock
  })
)
const productosFinales = computed(() => {
  const l = [...productosFiltrados.value]
  if (ordenar.value === "precio-asc")  return l.sort((a,b) => a.precio - b.precio)
  if (ordenar.value === "precio-desc") return l.sort((a,b) => b.precio - a.precio)
  if (ordenar.value === "nombre")      return l.sort((a,b) => a.nombre.localeCompare(b.nombre))
  return l
})
const totalItems      = computed(() => carrito.value.reduce((s,i) => s+i.cantidad, 0))
const totalCarrito    = computed(() => carrito.value.reduce((s,i) => s+i.precio*i.cantidad, 0))
const subtotalCarrito = computed(() => carrito.value.reduce((s,i) => s+(i.precio_original||i.precio)*i.cantidad, 0))
const descuentoTotal  = computed(() => subtotalCarrito.value - totalCarrito.value)

function totalGrupo(g) { return g.reduce((s,p) => s+parseFloat(p.total||0), 0).toFixed(2) }
function formatFecha(f) {
  if (!f) return ""
  return new Date(f).toLocaleDateString("es-SV", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
}
function obtenerClasePaso(estado, paso) {
  const e = (estado||"recibido").toLowerCase()
  let pa = 1
  if (e === "preparando" || e === "proceso") pa = 2
  else if (e.includes("camino") || e.includes("listo")) pa = 3
  else if (e === "entregado" || e === "completado") pa = 4
  if (paso < pa) return "completed"
  if (paso === pa) return "active"
  return ""
}
function triggerToast(msg) { toastMensaje.value = msg; mostrarToast.value = true; setTimeout(() => { mostrarToast.value = false }, 3500) }

function eliminarDelCarrito(id) { carrito.value = carrito.value.filter(i => i.id !== id) }
function restarCarrito(item)    { item.cantidad > 1 ? item.cantidad-- : eliminarDelCarrito(item.id) }
function sumarCarrito(item) {
  const prod = productos.value.find(p => p.id === item.id)
  if (item.cantidad < (prod ? prod.stock : 99)) item.cantidad++
}
function abrirModalCompra(p) { modalCompra.value = { visible: true, producto: p, cantidad: 1 } }
function modificarCantidadModal(v) {
  const n = modalCompra.value.cantidad + v
  if (n >= 1 && n <= modalCompra.value.producto.stock) modalCompra.value.cantidad = n
}
function agregarAlCarritoConfirmado() {
  const p = modalCompra.value.producto; const cant = modalCompra.value.cantidad
  if (!p) return
  const existe = carrito.value.find(i => i.id === p.id)
  if (existe) {
    const nueva = existe.cantidad + cant
    if (nueva <= p.stock) { existe.cantidad = nueva; triggerToast(`+${cant} u. de ${p.nombre}`) }
    else { alert(`Límite de stock: ${p.stock}`); return }
  } else {
    carrito.value.push({ id:p.id, nombre:p.nombre, precio:p.precio, precio_original:p.precio_original||null, imagen:p.imagen||p.imagen_url||null, imagen_url:p.imagen_url||p.imagen||null, categoria:p.categoria||null, stock:p.stock, cantidad:cant })
    triggerToast(`¡${p.nombre} agregado!`)
  }
  modalCompra.value.visible = false; verCarrito.value = true
}

async function cargarProductos() {
  try { const r = await clickOrderApi.get("/productos"); productos.value = r.data } catch(e) { console.error(e) }
}
async function cargarMisPedidos() {
  if (!usuario.value) return
  try { const r = await clickOrderApi.get(`/pedidos/usuario/${usuario.value.id}`); misPedidos.value = r.data; await cargarFacturasCliente() } catch(e) { console.error(e) }
}
async function cargarFacturasCliente() {
  try {
    const grupos = Object.keys(pedidosAgrupados.value)
    if (!grupos.length) return
    const res = await Promise.all(grupos.map(g => clickOrderApi.get(`/facturas/pedido/${g}`).catch(() => ({ data: null }))))
    const mapa = {}; grupos.forEach((g,i) => { if (res[i].data) mapa[g] = res[i].data }); facturasCliente.value = mapa
  } catch { facturasCliente.value = {} }
}

async function procesarTodoElCarrito(metodoPagoOverride) {
  if (!usuario.value || !carrito.value.length) return

  // Determinar método de pago final
  const metodoRaw = metodoPagoOverride || metodoPagoSeleccionado.value
  let metodoPago
  if      (metodoRaw === 'tarjeta' || metodoRaw === 'Tarjeta')               metodoPago = 'Tarjeta'
  else if (metodoRaw === 'contra_entrega' || metodoRaw === 'Contra entrega') metodoPago = 'Contra entrega'
  else if (metodoRaw === 'paypal'  || metodoRaw === 'PayPal')               metodoPago = 'PayPal'
  else                                                                        metodoPago = metodoRaw


  // Validar tarjeta nueva si aplica
  if (metodoPagoSeleccionado.value === 'tarjeta' && mostrarFormNuevaTar.value) {
    const n = nuevaTar.value.numero.replace(/\s/g, '')
    if (n.length < 13 || !nuevaTar.value.expira || !nuevaTar.value.cvv) {
      alert("Por favor completa los datos de la tarjeta."); return
    }
    // Guardar en perfil si se marcó la opción
    if (nuevaTar.value.guardar && usuario.value) {
      try {
        await clickOrderApi.post(`/perfil/${usuario.value.id}/tarjetas`, {
          ultimos_cuatro: n.slice(-4),
          nombre_titular: nuevaTar.value.nombre.toUpperCase(),
          expiracion:     nuevaTar.value.expira,
          tipo:           tipoTarjetaNueva.value,
          es_principal:   tarjetasGuardadas.value.length === 0
        })
      } catch {}
    }
  }

  try {
    totalCarritoHistorial.value = totalCarrito.value
    await clickOrderApi.post("/pedidos/carrito", {
      usuario_id:   usuario.value.id,
      metodo_pago:  metodoPago,
      direccion_id: direccionSeleccionada.value || null,
      items: carrito.value.map(i => ({ producto_id: i.id, cantidad: i.cantidad })),
    })
    triggerToast("¡Pedido confirmado!")
    verCheckout.value = false
    vistaActiva.value = "resumen"
    carrito.value     = []
    sessionStorage.removeItem('clickorder_carrito')
    verCarrito.value  = false
    nuevaTar.value    = { numero: '', nombre: '', expira: '', cvv: '', guardar: false }
    cargarProductos(); cargarMisPedidos(); cargarNotificaciones()
  } catch(err) { alert(err.response?.data?.mensaje || "Error al procesar el pedido.") }
}

function cerrarSesion() {
  clearTimeout(sessionTimer); clearInterval(notifInterval)
  eventosActividad.forEach(ev => window.removeEventListener(ev, resetearTimer))
  localStorage.removeItem("usuario"); usuario.value = null; router.push("/login")
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
.page-root { min-height: 100vh; background: var(--bg-base, #f5f5f5); font-family: 'DM Sans', sans-serif; }

/* ══ TOPBAR ══ */
.topbar { background: linear-gradient(135deg, #378ADD, #1D9E75); position: sticky; top: 0; z-index: 200; box-shadow: 0 2px 8px rgba(55,138,221,0.25); }
.topbar-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; gap: 16px; padding: 10px 24px; height: 62px; }
.topbar-brand { display: flex; align-items: center; gap: 6px; color: #fff; white-space: nowrap; flex-shrink: 0; }
.brand-diamond { font-size: 20px; }
.brand-name { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 600; color: #fff; }
.brand-name strong { font-weight: 800; }
.topbar-search { flex: 1; position: relative; max-width: 580px; margin: 0 auto; }
.ts-ico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #888; display: flex; }
.ts-inp { width: 100%; background: #fff; border: none; border-radius: 6px; padding: 10px 16px 10px 42px; font-size: 14px; color: #333; font-family: 'DM Sans', sans-serif; outline: none; }
.ts-inp::placeholder { color: #aaa; }
.topbar-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; flex-shrink: 0; }
.ta-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: none; border-radius: 8px; padding: 6px 10px; cursor: pointer; color: #fff; font-family: 'DM Sans', sans-serif; transition: background 0.15s; position: relative; }
.ta-btn:hover { background: rgba(255,255,255,0.12); }
.ta-btn.active { background: rgba(255,255,255,0.18); }
.ta-icon { position: relative; display: flex; align-items: center; }
.ta-label { font-size: 11px; line-height: 1.3; color: rgba(255,255,255,0.9); text-align: left; }
.ta-badge { position: absolute; top: -6px; right: -6px; background: #F5C518; color: #000; font-size: 9px; font-weight: 800; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.ta-cart { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 6px 12px; cursor: pointer; color: #fff; font-family: 'DM Sans', sans-serif; transition: background 0.15s; position: relative; }
.ta-cart:hover { background: rgba(255,255,255,0.2); }

/* ══ NOTIFICACIONES ══ */
.ta-notif-wrap { position: relative; }
.notif-dropdown { position: absolute; top: calc(100% + 8px); right: 0; width: 320px; background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.14); z-index: 300; overflow: hidden; }
.notif-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--border); background: var(--bg-base); }
.notif-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.notif-mark-all { background: transparent; border: none; font-size: 11px; color: #378ADD; cursor: pointer; font-weight: 600; }
.notif-empty { padding: 24px; text-align: center; font-size: 13px; color: var(--text-muted); }
.notif-list { max-height: 340px; overflow-y: auto; }
.notif-item { display: flex; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--border-soft); cursor: pointer; transition: background 0.12s; }
.notif-item:hover { background: var(--bg-base); }
.notif-item.unread { background: rgba(55,138,221,0.04); }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #378ADD; flex-shrink: 0; margin-top: 5px; }
.notif-body { flex: 1; min-width: 0; }
.notif-titulo { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.notif-msg    { font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 4px; }
.notif-fecha  { font-size: 10px; color: var(--text-muted); }

/* DROPDOWN PERFIL */
.ta-user-wrap { position: relative; }
.perfil-dropdown { position: absolute; top: calc(100% + 8px); right: 0; width: 220px; background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.14); z-index: 300; overflow: hidden; }
.pd-header { display: flex; align-items: center; gap: 10px; padding: 14px 14px 12px; background: var(--bg-base, #f9fafb); }
.pd-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #378ADD, #1D9E75); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
.pd-name  { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.pd-email { font-size: 11px; color: var(--text-muted); }
.pd-divider { height: 1px; background: var(--border, #e5e7eb); }
.pd-item { display: flex; align-items: center; gap: 10px; width: 100%; background: transparent; border: none; padding: 10px 14px; font-size: 13px; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; text-align: left; transition: background 0.12s; }
.pd-item:hover { background: var(--bg-base, #f3f4f6); color: var(--text-primary); }
.pd-logout { color: #E24B4A; }
.pd-logout:hover { background: rgba(226,75,74,0.08); }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

/* ══ SECBAR ══ */
.secbar { background: var(--bg-card, #fff); border-bottom: 1px solid var(--border, #e5e7eb); position: sticky; top: 62px; z-index: 150; }
.secbar-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; padding: 0 24px; height: 42px; }
.depts-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: none; padding: 0 16px 0 0; height: 100%; font-size: 13px; font-weight: 700; color: var(--text-primary); cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; flex-shrink: 0; transition: color 0.15s; }
.depts-btn:hover { color: #378ADD; }
.secbar-sep { width: 1px; height: 20px; background: var(--border, #e5e7eb); margin: 0 16px; flex-shrink: 0; }
.secbar-links { display: flex; align-items: center; gap: 2px; overflow-x: auto; flex: 1; }
.secbar-links::-webkit-scrollbar { height: 0; }
.secbar-link { background: transparent; border: none; border-radius: 6px; padding: 5px 12px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: all 0.12s; }
.secbar-link:hover { color: #378ADD; background: rgba(55,138,221,0.06); }
.secbar-link.active { color: #378ADD; font-weight: 700; background: rgba(55,138,221,0.08); }

/* ══ DRAWER ══ */
.depts-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.38); backdrop-filter: blur(3px); z-index: 400; display: flex; align-items: flex-start; }
.depts-drawer { width: 280px; height: 100%; background: var(--bg-card, #fff); box-shadow: 4px 0 24px rgba(0,0,0,0.14); display: flex; flex-direction: column; overflow: hidden; }
.dd-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 12px; border-bottom: 1px solid var(--border, #e5e7eb); flex-shrink: 0; }
.dd-header-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-primary); font-family: 'Syne', sans-serif; }
.dd-close { background: var(--bg-base, #f3f4f6); border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; cursor: pointer; font-size: 11px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
.dd-close:hover { background: rgba(226,75,74,0.08); color: #E24B4A; border-color: rgba(226,75,74,0.2); }
.dd-scroll { flex: 1; overflow-y: auto; padding: 8px 0; }
.dd-scroll::-webkit-scrollbar { width: 13px; }
.dd-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.dd-group { padding: 4px 10px; }
.dd-group-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); padding: 8px 6px 4px; display: block; }
.dd-group-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; background: transparent; border: none; padding: 9px 8px; font-size: 13px; font-weight: 700; color: var(--text-primary); cursor: pointer; font-family: 'DM Sans', sans-serif; border-radius: 8px; transition: background 0.12s; }
.dd-group-toggle:hover { background: var(--bg-base, #f5f5f5); }
.dd-chevron { color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; }
.dd-chevron.open { transform: rotate(180deg); }
.dd-grupo-count { font-size: 10px; background: rgba(55,138,221,0.1); color: #378ADD; border-radius: 999px; padding: 1px 7px; margin-left: 6px; font-weight: 700; }
.dd-sub-list { padding-left: 6px; }
.dd-item { display: flex; align-items: center; gap: 10px; width: 100%; background: transparent; border: none; border-radius: 8px; padding: 8px 8px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; text-align: left; transition: all 0.12s; }
.dd-item:hover { background: var(--bg-base, #f5f5f5); color: var(--text-primary); }
.dd-item.active { background: rgba(55,138,221,0.08); color: #378ADD; font-weight: 600; }
.dd-item-sub { padding-left: 14px; font-size: 12px; }
.dd-item-ver-todo { font-style: italic; opacity: 0.75; }
.dd-item-ver-todo:hover { opacity: 1; }
.dd-ico   { font-size: 16px; width: 22px; text-align: center; flex-shrink: 0; }
.dd-label { flex: 1; }
.dd-count { font-size: 10px; background: var(--bg-base); border-radius: 999px; padding: 1px 7px; color: var(--text-muted); font-weight: 600; white-space: nowrap; }
.dd-item.active .dd-count { background: rgba(55,138,221,0.1); color: #378ADD; }
.sidebar-slide-enter-active, .sidebar-slide-leave-active { transition: all 0.28s ease; }
.sidebar-slide-enter-from .depts-drawer, .sidebar-slide-leave-to .depts-drawer { transform: translateX(-100%); }
.sidebar-slide-enter-from, .sidebar-slide-leave-to { opacity: 0; }
.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }
.expand-enter-to, .expand-leave-from { max-height: 800px; opacity: 1; }

/* ══ HERO ══ */
.catalog-view { padding: 24px; max-width: 1400px; margin: 0 auto; }
.hero-banner { background: linear-gradient(135deg, #378ADD, #2570c2); border-radius: 16px; padding: 28px 36px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; overflow: hidden; position: relative; }
.hero-text   { position: relative; z-index: 1; }
.hero-tag    { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.8); margin-bottom: 6px; }
.hero-title  { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 4px; }
.hero-sub    { font-size: 13px; color: rgba(255,255,255,0.7); }
.hero-deco   { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
.hero-circle { position: absolute; border-radius: 50%; opacity: 0.15; background: #fff; }
.c1 { width: 80px; height: 80px; top: -10px; right: -10px; }
.c2 { width: 50px; height: 50px; top: 10px; right: 10px; }
.hero-big-emoji { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 40px; }
.quick-filters { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
.qf-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.qf-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.qf-crumb-btn { background: transparent; border: none; cursor: pointer; color: #378ADD; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; padding: 0; }
.qf-sep { color: var(--text-muted); font-size: 14px; }
.qf-crumb-active { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.qf-total { font-size: 12px; color: var(--text-muted); background: var(--bg-card, #fff); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; }
.qf-sort { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 8px; padding: 6px 12px; font-size: 13px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; outline: none; cursor: pointer; }
.shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.shop-card { background: var(--bg-card, #fff); border: 1px solid var(--border-soft, #ebebeb); border-radius: 14px; overflow: hidden; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; position: relative; }
.shop-card:hover:not(.out-stock) { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.1); border-color: rgba(55,138,221,0.3); }
.shop-card.out-stock { opacity: 0.55; cursor: default; }
.badge-last    { position: absolute; top: 8px; left: 8px; z-index: 2; background: #EF9F27; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 5px; }
.badge-agotado { position: absolute; top: 8px; left: 8px; z-index: 2; background: #E24B4A; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 5px; }
.shop-img-wrap { position: relative; overflow: hidden; width: 100%; aspect-ratio: 1 / 1; background: var(--bg-base, #f5f5f5); flex-shrink: 0; }
.shop-img { width: 100%; height: 100%; object-fit: contain; object-position: center; transition: transform 0.3s; display: block; padding: 8px; }
.shop-card:hover .shop-img { transform: scale(1.04); }
.shop-overlay { position: absolute; inset: 0; background: rgba(55,138,221,0.1); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; font-size: 12px; font-weight: 700; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
.shop-card:hover .shop-overlay { opacity: 1; }
.shop-info { padding: 12px; flex: 1; display: flex; flex-direction: column; }
.shop-cat  { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #378ADD; margin-bottom: 4px; }
.shop-name { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; line-height: 1.35; }
.shop-desc { font-size: 11px; color: var(--text-muted); line-height: 1.45; flex: 1; margin-bottom: 10px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.shop-footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 6px; }
.shop-price-wrap { display: flex; flex-direction: column; }
.shop-price-old  { font-size: 10px; color: var(--text-muted); text-decoration: line-through; }
.shop-price { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: var(--text-primary); }
.btn-add { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 7px; padding: 6px 11px; font-size: 11px; font-weight: 700; color: #fff; cursor: pointer; white-space: nowrap; transition: opacity 0.15s; }
.btn-add:hover:not(:disabled) { opacity: 0.88; }
.btn-add:disabled { background: var(--bg-base); color: var(--text-muted); border: 1px solid var(--border); cursor: not-allowed; }
.carrito-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.38); backdrop-filter: blur(4px); z-index: 500; display: flex; justify-content: flex-end; }
.carrito-sidebar { width: 420px; max-width: 100vw; height: 100%; background: var(--bg-base, #fff); display: flex; flex-direction: column; box-shadow: -6px 0 28px rgba(0,0,0,0.12); }
.cart-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
.cart-header-left { display: flex; align-items: center; gap: 10px; }
.cart-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.cart-count-pill { background: #111; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; }
.btn-close { background: var(--bg-card, #f3f4f6); border: 1px solid var(--border); border-radius: 8px; width: 30px; height: 30px; cursor: pointer; font-size: 12px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; }
.cart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 12px; color: var(--text-muted); }
.cart-empty span { font-size: 44px; }
.cart-empty p { font-size: 13px; }
.btn-empty-cta { background: linear-gradient(135deg, #378ADD, #1D9E75); color: #fff; border: none; border-radius: 8px; padding: 9px 22px; font-size: 13px; font-weight: 600; cursor: pointer; }
.cart-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.cart-items { flex: 1; overflow-y: auto; }
.cart-items::-webkit-scrollbar { width: 3px; }
.cart-items::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.cart-item { display: flex; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--border-soft); }
.cart-img-wrap { width: 72px; height: 72px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: var(--bg-card-hover); border: 1px solid var(--border-soft); }
.cart-img { width: 100%; height: 100%; object-fit: contain; padding: 4px; display: block; }
.cart-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.cart-item-top { display: flex; justify-content: space-between; align-items: flex-start; }
.cart-item-brand { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.cart-item-name { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.btn-remove-item { background: transparent; border: none; cursor: pointer; color: var(--text-muted); padding: 3px; border-radius: 5px; flex-shrink: 0; transition: all 0.12s; display: flex; }
.btn-remove-item:hover { background: rgba(226,75,74,0.1); color: #E24B4A; }
.cart-item-bottom { display: flex; align-items: center; gap: 8px; }
.cart-price { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--text-primary); flex: 1; }
.cart-qty-stepper { display: flex; align-items: center; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--bg-card, #fff); }
.qty-minus, .qty-plus { background: transparent; border: none; width: 28px; height: 28px; font-size: 15px; cursor: pointer; color: var(--text-primary); display: flex; align-items: center; justify-content: center; transition: background 0.1s; }
.qty-minus:hover:not(:disabled), .qty-plus:hover:not(:disabled) { background: var(--bg-base); }
.qty-minus:disabled, .qty-plus:disabled { opacity: 0.3; cursor: not-allowed; }
.qty-val { font-size: 13px; font-weight: 600; color: var(--text-primary); min-width: 26px; text-align: center; }
.cart-item-subtotal { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
.cart-footer { padding: 14px 18px 18px; border-top: 1px solid var(--border); }
.cart-totals { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.cart-total-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); }
.cart-total-row.discount { color: #1D9E75; }
.cart-total-row.grand-total { padding-top: 8px; border-top: 1px solid var(--border); font-size: 15px; color: var(--text-primary); font-weight: 600; }
.grand-total-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #7de24a; }
.btn-checkout { width: 100%; background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 10px; padding: 14px; font-size: 15px; font-weight: 700; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; transition: opacity 0.15s; }
.btn-checkout:hover { opacity: 0.9; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 12px; }
.modal-detail  { background: var(--bg-card, #fff); border-radius: 18px; width: 100%; max-width: 820px; display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; max-height: 90vh; }
.modal-img-wrap { position: relative; background: var(--bg-base, #f5f5f5); min-height: 380px; display: flex; align-items: center; justify-content: center; }
.modal-img { width: 100%; height: 100%; object-fit: contain; padding: 20px; display: block; }
.modal-close-btn { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.38); border: none; border-radius: 50%; width: 32px; height: 32px; color: #fff; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.modal-last-badge { position: absolute; bottom: 12px; left: 12px; background: #EF9F27; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
.modal-body { padding: 26px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
.modal-cat  { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #378ADD; }
.modal-name { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
.modal-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; }
.modal-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.meta-item  { background: var(--bg-base, #f5f5f5); border-radius: 10px; padding: 12px; }
.meta-label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 4px; }
.meta-val   { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.meta-val.precio { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #1D9E75; }
.modal-qty-wrap { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.modal-qty { display: flex; align-items: center; gap: 10px; background: var(--bg-base); border-radius: 10px; padding: 6px 12px; }
.modal-qty button { background: var(--bg-card, #fff); border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; font-size: 16px; cursor: pointer; color: var(--text-primary); }
.modal-qty button:disabled { opacity: 0.4; cursor: not-allowed; }
.modal-qty span { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text-primary); min-width: 26px; text-align: center; }
.modal-subtotal { font-size: 13px; color: var(--text-muted); }
.modal-subtotal strong { color: #1D9E75; font-size: 15px; }
.btn-modal-add { width: 100%; padding: 12px; background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 12px; font-size: 14px; font-weight: 700; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; margin-top: auto; transition: opacity 0.15s; }
.btn-modal-add:hover { opacity: 0.9; }
.checkout-modal { background: var(--bg-card, #fff); border-radius: 18px; width: 100%; max-width: 520px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; }
.ck-header { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.ck-steps { display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; }
.ck-step  { display: flex; align-items: center; gap: 5px; }
.ck-step-num { width: 22px; height: 22px; border-radius: 50%; background: var(--bg-base); border: 2px solid var(--border); font-size: 11px; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.ck-step.active .ck-step-num { background: #378ADD; border-color: #378ADD; color: #fff; }
.ck-step-label { font-size: 11px; font-weight: 600; color: var(--text-muted); }
.ck-step.active .ck-step-label { color: #378ADD; }
.ck-step-line { width: 30px; height: 2px; background: var(--border); transition: background 0.2s; }
.ck-step-line.done { background: #378ADD; }
.ck-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.ck-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.ck-empty-dir { text-align: center; padding: 20px; color: var(--text-muted); display: flex; flex-direction: column; gap: 12px; align-items: center; }
.ck-dir-list  { display: flex; flex-direction: column; gap: 10px; }
.ck-dir-card  { display: flex; align-items: flex-start; gap: 12px; background: var(--bg-base); border: 2px solid var(--border); border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all 0.15s; }
.ck-dir-card.selected { border-color: #378ADD; background: rgba(55,138,221,0.05); }
.ck-dir-card:hover { border-color: rgba(55,138,221,0.4); }
.ck-dir-radio { flex-shrink: 0; margin-top: 2px; }
.ck-radio-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); transition: all 0.15s; }
.ck-radio-dot.active { border-color: #378ADD; background: #378ADD; box-shadow: inset 0 0 0 3px #fff; }
.ck-dir-info { flex: 1; }
.ck-dir-nombre  { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ck-dir-detalle { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.ck-payment-opts { display: flex; flex-direction: column; gap: 10px; }
.ck-pay-opt { display: flex; align-items: center; gap: 14px; background: var(--bg-base); border: 2px solid var(--border); border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.15s; }
.ck-pay-opt.selected { border-color: #378ADD; background: rgba(55,138,221,0.05); }
.ck-pay-opt:hover { border-color: rgba(55,138,221,0.4); }
.ck-pay-radio { flex-shrink: 0; }
.ck-pay-info { flex: 1; }
.ck-pay-titulo { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.ck-pay-sub    { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.ck-card-fields { display: flex; flex-direction: column; gap: 8px; }
.ck-card-row    { display: flex; gap: 8px; }
.ck-input { flex: 1; background: var(--bg-base, #f5f5f5); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; font-size: 13px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; outline: none; }
.ck-input:focus { border-color: #378ADD; }
.ck-sec-label   { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 8px; }
.ck-resumen-dir { background: var(--bg-base); border-radius: 10px; padding: 12px 14px; }
.ck-dir-elegida { margin-top: 6px; }
.ck-items       { background: var(--bg-base); border-radius: 10px; padding: 12px 14px; }
.ck-item-row    { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border-soft); }
.ck-item-row:last-child { border-bottom: none; }
.ck-item-img    { width: 36px; height: 36px; border-radius: 6px; object-fit: contain; flex-shrink: 0; background: var(--bg-card); padding: 2px; }
.ck-item-nombre { flex: 1; font-size: 13px; color: var(--text-primary); font-weight: 500; }
.ck-item-cant   { font-size: 12px; color: var(--text-muted); }
.ck-item-precio { font-size: 13px; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
.ck-metodo      { background: var(--bg-base); border-radius: 10px; padding: 12px 14px; }
.ck-total-row   { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-base); border-radius: 10px; font-size: 15px; font-weight: 600; color: var(--text-primary); }
.ck-footer      { display: flex; gap: 10px; padding-top: 4px; flex-shrink: 0; }
.btn-text-link  { background: transparent; border: none; font-size: 13px; color: #378ADD; cursor: pointer; font-weight: 600; font-family: 'DM Sans', sans-serif; padding: 4px 0; }
.btn-text-link:hover { opacity: 0.75; }
.badge-principal { background: rgba(55,138,221,0.1); color: #378ADD; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; }
.page-padded { padding: 24px; max-width: 1000px; margin: 0 auto; }
.section-hdr { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
.btn-back { background: var(--bg-card, #fff); border: 1px solid var(--border); border-radius: 8px; padding: 7px 14px; font-size: 13px; color: var(--text-secondary); cursor: pointer; }
.section-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--text-primary); flex: 1; }
.btn-prim { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 8px; padding: 10px 22px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; transition: opacity 0.15s; }
.btn-prim:hover:not(:disabled) { opacity: 0.9; }
.btn-prim:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-prim-sm { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 600; color: #fff; cursor: pointer; white-space: nowrap; }
.btn-sec { background: var(--bg-base, #f5f5f5); border: 1px solid var(--border, #e5e7eb); border-radius: 8px; padding: 9px 18px; font-size: 13px; color: var(--text-secondary); cursor: pointer; transition: all 0.12s; font-family: 'DM Sans', sans-serif; }
.btn-sec:hover { background: var(--bg-card-hover); }
.empty-st { text-align: center; padding: 80px 20px; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty-st span { font-size: 48px; display: block; }
.pedidos-lista { display: flex; flex-direction: column; gap: 14px; }
.pedido-history-card { background: var(--bg-card, #fff); border: 1px solid var(--border-soft); border-radius: 14px; overflow: hidden; }
.p-card-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-soft); }
.p-id   { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; color: var(--text-primary); }
.p-date { font-size: 11px; color: var(--text-muted); }
.p-card-body { padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
.p-item-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border-soft); }
.p-item-row:last-of-type { border-bottom: none; }
.p-item-nombre  { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-primary); }
.p-item-detalle { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
.p-item-sub     { font-size: 13px; font-weight: 700; color: #1D9E75; white-space: nowrap; }
.p-orden-total  { display: flex; justify-content: space-between; padding: 8px 0 2px; font-size: 13px; color: var(--text-secondary); border-top: 1px solid var(--border-soft); }
.p-orden-total strong { font-family: 'Syne', sans-serif; font-size: 17px; color: #1D9E75; }
.pedido-timeline { display: flex; justify-content: space-between; margin: 10px 0 2px; position: relative; padding: 0 6px; }
.pedido-timeline::before { content: ""; position: absolute; top: 5px; left: 20px; right: 20px; height: 2px; background: var(--border); z-index: 1; }
.timeline-step   { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; flex: 1; }
.step-dot        { width: 12px; height: 12px; border-radius: 50%; background: var(--border); border: 2px solid var(--bg-card, #fff); transition: all 0.3s; }
.step-label      { font-size: 9px; margin-top: 4px; color: var(--text-muted); font-weight: 600; text-align: center; }
.timeline-step.active .step-dot    { background: #378ADD; transform: scale(1.3); box-shadow: 0 0 6px rgba(55,138,221,0.4); }
.timeline-step.active .step-label  { color: #378ADD; font-weight: 700; }
.timeline-step.completed .step-dot   { background: #1D9E75; }
.timeline-step.completed .step-label { color: #1D9E75; }
.p-card-footer { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; border-top: 1px solid var(--border-soft); background: var(--bg-base); }
.estado-pill { font-size: 9px; text-transform: uppercase; font-weight: 700; padding: 3px 9px; border-radius: 5px; }
.estado-pill.estado-recibido   { background: rgba(55,138,221,0.12); color: #378ADD; }
.estado-pill.estado-preparando { background: rgba(239,159,39,0.12); color: #EF9F27; }
.estado-pill.estado-en-camino  { background: rgba(124,58,237,0.12); color: #7C3AED; }
.estado-pill.estado-entregado  { background: rgba(29,158,117,0.12); color: #1D9E75; }
.text-muted { font-size: 10px; color: var(--text-muted); }
.factura-row-cliente { display: flex; align-items: center; gap: 8px; padding: 8px 16px 12px; border-top: 1px solid var(--border-soft); background: rgba(29,158,117,0.04); }
.factura-num-cliente { font-size: 12px; font-weight: 700; color: #1D9E75; flex: 1; }
.btn-factura-pdf  { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 7px; padding: 5px 12px; font-size: 11px; font-weight: 600; color: #fff; cursor: pointer; }
.btn-factura-json { background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.3); border-radius: 7px; padding: 5px 10px; font-size: 11px; font-weight: 600; color: #7C3AED; cursor: pointer; }
.resumen-wrap { display: flex; justify-content: center; padding: 60px 20px; }
.resumen-box  { background: var(--bg-card, #fff); border: 1px solid var(--border-soft); border-radius: 20px; padding: 36px; max-width: 440px; width: 100%; text-align: center; }
.res-icon     { font-size: 50px; display: block; margin-bottom: 12px; }
.resumen-box h2 { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; }
.res-sub  { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; }
.res-detalles { background: var(--bg-base); border-radius: 12px; padding: 14px; text-align: left; margin-bottom: 18px; display: flex; flex-direction: column; gap: 7px; font-size: 13px; }
.res-row  { display: flex; justify-content: space-between; color: var(--text-secondary); }
.res-row.total { border-top: 1px dashed var(--border); padding-top: 7px; font-weight: 700; color: var(--text-primary); }
.res-btns { display: flex; flex-direction: column; gap: 9px; }
.toast-float { position: fixed; bottom: 22px; right: 22px; background: var(--bg-card, #fff); border: 1px solid rgba(55,138,221,0.3); border-radius: 14px; padding: 11px 18px; font-size: 13px; font-weight: 600; color: var(--text-primary); z-index: 9999; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(14px); }
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateX(20px); }
.modal-enter-active, .modal-leave-active { transition: all 0.24s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }
@media (max-width: 768px) {
  .topbar-inner { padding: 8px 14px; height: 56px; }
  .topbar-search { max-width: 160px; }
  .ta-label { display: none; }
  .secbar-inner { padding: 0 14px; }
  .catalog-view { padding: 14px; }
  .shop-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .modal-detail { grid-template-columns: 1fr; max-width: 400px; }
  .modal-img-wrap { min-height: 240px; }
  .hero-banner { flex-direction: column; text-align: center; gap: 12px; padding: 20px; }
  .section-hdr { gap: 8px; }
  .qf-info { flex-direction: column; align-items: flex-start; gap: 6px; }
  .notif-dropdown { width: 290px; right: -60px; }
}
@media (max-width: 440px) {
  .carrito-sidebar { width: 100%; }
  .shop-grid { gap: 8px; }
}

/* ══ PAYPAL ══ */
.paypal-section { margin-top: 12px; }
.paypal-divider { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
.paypal-divider span { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
.paypal-divider::before, .paypal-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
#paypal-button-container { min-height: 44px; }
.paypal-sandbox-note { font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 6px; background: rgba(239,159,39,0.08); border-radius: 6px; padding: 6px 10px; }

/* ══ TARJETAS EN CHECKOUT ══ */
.ck-tar-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.ck-tar-item { display: flex; align-items: center; gap: 12px; background: var(--bg-base); border: 2px solid var(--border); border-radius: 10px; padding: 10px 14px; cursor: pointer; transition: all 0.15s; }
.ck-tar-item.selected { border-color: #378ADD; background: rgba(55,138,221,0.05); }
.ck-tar-item:hover { border-color: rgba(55,138,221,0.4); }
.ck-tar-chip { width: 32px; height: 24px; flex-shrink: 0; }
.ck-tar-info { flex: 1; }
.ck-tar-num  { font-size: 13px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.06em; }
.ck-tar-sub  { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.ck-tar-badge { font-size: 10px; font-weight: 700; background: rgba(55,138,221,0.1); color: #378ADD; padding: 2px 7px; border-radius: 5px; }

/* Agregar tarjeta inline en checkout */
.ck-nueva-tar { border: 2px dashed var(--border); border-radius: 10px; padding: 14px; margin-top: 6px; }
.ck-nueva-tar-toggle { display: flex; align-items: center; gap: 8px; background: transparent; border: none; font-size: 13px; font-weight: 600; color: #378ADD; cursor: pointer; font-family: 'DM Sans', sans-serif; width: 100%; }
.ck-nueva-tar-form { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.ck-nueva-tar-preview { background: linear-gradient(135deg, #1a1f71, #2575fc); border-radius: 10px; padding: 14px 16px; color: #fff; margin-bottom: 10px; }
.ck-nueva-tar-preview.tipo-mastercard { background: linear-gradient(135deg, #eb001b, #f79e1b); }
.ck-nueva-tar-preview.tipo-amex       { background: linear-gradient(135deg, #007b5e, #00d2a0); }
.ck-nueva-tar-preview.tipo-otro       { background: linear-gradient(135deg, #2a2a2a, #555); }
.cntp-num    { font-size: 15px; letter-spacing: 0.12em; font-weight: 600; margin-bottom: 8px; }
.cntp-bottom { display: flex; justify-content: space-between; font-size: 11px; opacity: 0.85; }

/* ══ FACTURA PDF MODAL ══ */
.factura-pdf-modal { background: var(--bg-card, #fff); border-radius: 14px; width: 96vw; max-width: 1100px; height: 94vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
.fpdf-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; gap: 12px; }
.fpdf-title  { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary); flex: 1; }
.fpdf-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.fpdf-iframe { flex: 1; width: 100%; border: none; background: #f0f0f0; display: block; min-height: 0; }

/* ══ PEDIDO DETALLE IMAGENES ══ */
.p-item-img-wrap { width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: var(--bg-base); flex-shrink: 0; border: 1px solid var(--border-soft); }
.p-item-img { width: 100%; height: 100%; object-fit: contain; padding: 3px; display: block; }
</style>