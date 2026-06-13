<template>
  <div class="perfil-root">
    <div class="perfil-layout">

      <!-- SIDEBAR -->
      <aside class="perfil-aside">
        <div class="pa-user">
          <div class="pa-avatar">{{ inicialUsuario }}</div>
          <div class="pa-info">
            <p class="pa-saludo">Hola,</p>
            <p class="pa-nombre">{{ perfil.nombre || usuario?.nombre }}</p>
          </div>
        </div>
        <nav class="pa-nav">
          <button class="pa-link pa-catalogo" @click="router.push('/catalogo')">← Volver al catálogo</button>
          <div class="pa-nav-sep"></div>
          <button v-for="tab in tabs" :key="tab.id"
            :class="['pa-link', tabActivo === tab.id ? 'active' : '']"
            @click="irA(tab.id)">{{ tab.label }}</button>
          <div class="pa-nav-sep"></div>
          <button class="pa-link pa-darkmode" @click="toggle">
            <span class="pa-darkmode-icon">{{ isDark ? '☀️' : '🌙' }}</span>
            {{ isDark ? 'Modo claro' : 'Modo oscuro' }}
          </button>
          <button class="pa-link pa-logout" @click="cerrarSesion">Salir</button>
        </nav>
      </aside>

      <!-- CONTENIDO -->
      <main class="perfil-main">

        <!-- ── TAB: PERFIL ── -->
        <section v-if="tabActivo === 'perfil'">
          <div class="tab-header">
            <h2 class="tab-title">Perfil</h2>
          </div>
          <div v-if="!editandoPerfil" class="info-card">
            <div class="ic-grid">
              <div class="ic-field ic-full">
                <label>Nombre completo</label>
                <p>{{ primerNombre }}</p>
              </div>
              <div class="ic-field ic-full">
                <label>Email</label>
                <p>{{ perfil.correo }}</p>
              </div>
              <div class="ic-field">
                <label>Documento (DUI)</label>
                <p>{{ perfil.documento || '—' }}</p>
              </div>
              <div class="ic-field">
                <label>Género</label>
                <p>{{ perfil.genero || '—' }}</p>
              </div>
              <div class="ic-field">
                <label>Fecha de nacimiento</label>
                <p>{{ formatFecha(perfil.fecha_nacimiento) }}</p>
              </div>
              <div class="ic-field">
                <label>Teléfono</label>
                <p>{{ perfil.telefono || '—' }}</p>
              </div>
            </div>
            <button class="btn-prim" @click="abrirEditarPerfil">Editar</button>
          </div>
          <div v-else class="info-card">
            <div class="ic-grid">
              <div class="ic-field">
                <label>Nombre completo <span class="req">*</span></label>
                <input v-model="formPerfil.nombre" type="text" class="ic-input" />
              </div>
              <div class="ic-field">
                <label>Teléfono</label>
                <input v-model="formPerfil.telefono" type="tel" class="ic-input" placeholder="+503 7000-0000" />
              </div>
              <div class="ic-field">
                <label>Documento (DUI)</label>
                <input v-model="formPerfil.documento" type="text" class="ic-input" placeholder="00000000-0" maxlength="10" />
              </div>
              <div class="ic-field">
                <label>Género</label>
                <select v-model="formPerfil.genero" class="ic-input">
                  <option value="">Prefiero no decir</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div class="ic-field ic-full">
                <label>Fecha de nacimiento</label>
                <input v-model="formPerfil.fecha_nacimiento" type="date" class="ic-input" />
              </div>
            </div>
            <div v-if="msgPerfil" :class="msgPerfil.tipo === 'ok' ? 'msg-ok' : 'msg-err'">{{ msgPerfil.texto }}</div>
            <div class="ic-actions">
              <button class="btn-prim" :disabled="guardandoPerfil" @click="guardarPerfil">
                {{ guardandoPerfil ? 'Guardando...' : 'Guardar cambios' }}
              </button>
              <button class="btn-sec" @click="editandoPerfil = false">Cancelar</button>
            </div>
          </div>
        </section>

        <!-- ── TAB: DIRECCIONES ── -->
        <section v-else-if="tabActivo === 'direcciones'">
          <div class="tab-header">
            <div class="tab-header-left">
              <button class="btn-back" @click="subvistaDireccion = null" v-if="subvistaDireccion">← DIRECCIONES</button>
              <h2 class="tab-title">{{ subvistaDireccion ? 'Añadir Dirección' : 'Mis Direcciones' }}</h2>
            </div>
            <button v-if="!subvistaDireccion" class="btn-prim" @click="subvistaDireccion = 'nueva'">+ Añadir</button>
          </div>

          <!-- Lista de direcciones -->
          <div v-if="!subvistaDireccion">
            <div v-if="direcciones.length === 0" class="empty-state">
              <span>📍</span><p>No tienes direcciones guardadas.</p>
            </div>
            <div v-else class="dir-list">
              <div v-for="dir in direcciones" :key="dir.id" class="dir-card">

                <!-- Vista normal -->
                <template v-if="editandoDirId !== dir.id">
                  <div class="dir-card-top">
                    <div>
                      <p class="dir-nombre">{{ dir.destinatario }}</p>
                      <p class="dir-detalle">{{ dir.calle }}, {{ dir.municipio }}, {{ dir.departamento }}</p>
                      <p v-if="dir.info_adicional" class="dir-extra">{{ dir.info_adicional }}</p>
                    </div>
                    <span v-if="dir.es_principal" class="badge-principal">Principal</span>
                  </div>
                  <div class="dir-card-actions">
                    <button class="btn-text" @click="abrirEditarDireccion(dir)">✏️ Editar</button>
                    <button v-if="!dir.es_principal" class="btn-text" @click="marcarPrincipalDir(dir.id)">⭐ Marcar como principal</button>
                    <button v-if="dir.es_principal" class="btn-text warn" @click="quitarPrincipalDir(dir.id)">✕ Quitar principal</button>
                    <button class="btn-text danger" @click="eliminarDireccion(dir.id)">Eliminar</button>
                  </div>
                </template>

                <!-- Edición inline -->
                <template v-else>
                  <div class="dir-edit-form">
                    <p class="dir-edit-titulo">✏️ Editando dirección</p>
                    <div class="ic-grid">
                      <div class="ic-field ic-full">
                        <label>Destinatario <span class="req">*</span></label>
                        <input v-model="formEditDir.destinatario" type="text" class="ic-input" />
                      </div>
                      <div class="ic-field">
                        <label>Departamento <span class="req">*</span></label>
                        <select v-model="formEditDir.departamento" class="ic-input"
                          @change="formEditDir.distrito = ''; formEditDir.municipio = ''">
                          <option value="">Seleccionar</option>
                          <option v-for="dep in departamentos" :key="dep" :value="dep">{{ dep }}</option>
                        </select>
                      </div>
                      <div class="ic-field">
                        <label>Distrito <span class="req">*</span></label>
                        <select v-model="formEditDir.distrito" class="ic-input"
                          :disabled="!formEditDir.departamento"
                          @change="formEditDir.municipio = ''">
                          <option value="">{{ formEditDir.departamento ? 'Seleccionar' : 'Elige departamento' }}</option>
                          <option v-for="dist in distritosPorDep[formEditDir.departamento] || []" :key="dist" :value="dist">{{ dist }}</option>
                        </select>
                      </div>
                      <div class="ic-field ic-full">
                        <label>Municipio <span class="req">*</span></label>
                        <select v-model="formEditDir.municipio" class="ic-input" :disabled="!formEditDir.distrito">
                          <option value="">{{ formEditDir.distrito ? 'Seleccionar' : 'Elige distrito' }}</option>
                          <option v-for="mun in municipiosPorDistrito[formEditDir.distrito] || []" :key="mun" :value="mun">{{ mun }}</option>
                        </select>
                      </div>
                      <div class="ic-field ic-full">
                        <label>Calle / Dirección <span class="req">*</span></label>
                        <input v-model="formEditDir.calle" type="text" class="ic-input" />
                      </div>
                      <div class="ic-field ic-full">
                        <label>Información adicional</label>
                        <input v-model="formEditDir.info_adicional" type="text" class="ic-input" placeholder="Ej: Apto 201, casa azul" />
                      </div>
                    </div>
                    <div v-if="msgEditDir" :class="msgEditDir.tipo === 'ok' ? 'msg-ok' : 'msg-err'">{{ msgEditDir.texto }}</div>
                    <div class="dir-edit-actions">
                      <button class="btn-prim" :disabled="guardandoEditDir" @click="guardarEditarDireccion(dir.id)">
                        {{ guardandoEditDir ? 'Guardando...' : 'Guardar cambios' }}
                      </button>
                      <button class="btn-sec" @click="editandoDirId = null; msgEditDir = null">Cancelar</button>
                    </div>
                  </div>
                </template>

              </div>
            </div>
          </div>

          <!-- Formulario nueva dirección -->
          <div v-else class="info-card">
            <div class="ic-grid">
              <div class="ic-field ic-full">
                <label>País</label>
                <select v-model="formDir.pais" class="ic-input">
                  <option value="El Salvador">El Salvador</option>
                </select>
              </div>
              <div class="ic-field">
                <label>Departamento <span class="req">*</span></label>
                <select v-model="formDir.departamento" class="ic-input"
                  @change="formDir.distrito = ''; formDir.municipio = ''">
                  <option value="">Seleccionar</option>
                  <option v-for="dep in departamentos" :key="dep" :value="dep">{{ dep }}</option>
                </select>
              </div>
              <div class="ic-field">
                <label>Distrito <span class="req">*</span></label>
                <select v-model="formDir.distrito" class="ic-input"
                  :disabled="!formDir.departamento"
                  @change="formDir.municipio = ''">
                  <option value="">{{ formDir.departamento ? 'Seleccionar' : 'Selecciona un departamento primero' }}</option>
                  <option v-for="dist in distritosPorDep[formDir.departamento] || []" :key="dist" :value="dist">{{ dist }}</option>
                </select>
              </div>
              <div class="ic-field ic-full">
                <label>Municipio <span class="req">*</span></label>
                <select v-model="formDir.municipio" class="ic-input" :disabled="!formDir.distrito">
                  <option value="">{{ formDir.distrito ? 'Seleccionar' : 'Selecciona un distrito primero' }}</option>
                  <option v-for="mun in municipiosPorDistrito[formDir.distrito] || []" :key="mun" :value="mun">{{ mun }}</option>
                </select>
              </div>
              <div class="ic-field ic-full">
                <label>Calle / Dirección <span class="req">*</span></label>
                <input v-model="formDir.calle" type="text" class="ic-input" placeholder="Ej: Calle Principal #15" />
              </div>
              <div class="ic-field ic-full">
                <label>Información adicional</label>
                <input v-model="formDir.info_adicional" type="text" class="ic-input" placeholder="Ej: Apto. 201, casa azul" />
              </div>
              <div class="ic-field ic-full">
                <label>Destinatario <span class="req">*</span></label>
                <input v-model="formDir.destinatario" type="text" class="ic-input" :placeholder="perfil.nombre" />
              </div>
            </div>
            <div v-if="msgDir" :class="msgDir.tipo === 'ok' ? 'msg-ok' : 'msg-err'">{{ msgDir.texto }}</div>
            <div class="ic-actions">
              <button class="btn-prim" :disabled="guardandoDir" @click="guardarDireccion">
                {{ guardandoDir ? 'Guardando...' : 'Añadir Dirección' }}
              </button>
            </div>
          </div>
        </section>

        <!-- ── TAB: TARJETAS ── -->
        <section v-else-if="tabActivo === 'tarjetas'">
          <div class="tab-header">
            <div class="tab-header-left">
              <button class="btn-back" @click="subvistaTarjeta = null" v-if="subvistaTarjeta">← TARJETAS DE CRÉDITO</button>
              <h2 class="tab-title">{{ subvistaTarjeta ? 'Nueva Tarjeta' : 'Tarjetas de Crédito/Débito' }}</h2>
            </div>
            <button v-if="!subvistaTarjeta" class="btn-prim" @click="subvistaTarjeta = 'nueva'">+ Añadir</button>
          </div>
          <div v-if="!subvistaTarjeta">
            <div v-if="tarjetas.length === 0" class="empty-state">
              <span>💳</span><p>No tienes tarjetas guardadas.</p>
            </div>
            <div v-else class="tar-list">
              <div v-for="tar in tarjetas" :key="tar.id" class="tar-card">
                <div class="tar-chip">
                  <svg width="28" height="22" viewBox="0 0 28 22"><rect x="0" y="0" width="28" height="22" rx="3" fill="#c8a951"/><rect x="2" y="7" width="10" height="8" rx="1" fill="#e8c96a" opacity=".5"/></svg>
                </div>
                <div class="tar-info">
                  <p class="tar-numero">•••• •••• •••• {{ tar.ultimos_cuatro }}</p>
                  <p class="tar-titular">{{ tar.nombre_titular }}</p>
                  <p class="tar-exp">Válida hasta {{ tar.expiracion }}</p>
                </div>
                <div class="tar-right">
                  <span v-if="tar.es_principal" class="badge-principal">Principal</span>
                  <span class="tar-tipo">{{ tar.tipo?.toUpperCase() }}</span>
                </div>
                <button class="btn-text danger tar-del" @click="eliminarTarjeta(tar.id)">Eliminar</button>
              </div>
            </div>
          </div>
          <div v-else class="tar-form-layout">
            <div class="tar-preview" :class="'tipo-' + (tipoDetectado || 'otro')">
              <div class="tp-chip"><svg width="32" height="26" viewBox="0 0 32 26"><rect x="0" y="0" width="32" height="26" rx="4" fill="#c8a951"/><rect x="2" y="8" width="12" height="10" rx="2" fill="#e8c96a" opacity=".6"/></svg></div>
              <p class="tp-numero">{{ tarjetaNumeroVista }}</p>
              <div class="tp-bottom">
                <p class="tp-nombre">{{ formTar.nombre_titular || 'NOMBRE' }}</p>
                <p class="tp-exp">Válida hasta {{ formTar.expiracion || '**/**' }}</p>
              </div>
            </div>
            <div class="info-card" style="flex:1">
              <p class="ic-sub">Ingresa los datos de tu tarjeta:</p>
              <div class="ic-grid">
                <div class="ic-field ic-full">
                  <label>Número de la tarjeta</label>
                  <input v-model="formTar.numero" type="text" class="ic-input" placeholder="•••• •••• •••• ••••" maxlength="19" @input="formatearNumeroTarjeta" />
                </div>
                <div class="ic-field ic-full">
                  <label>Nombre impreso en la tarjeta</label>
                  <input v-model="formTar.nombre_titular" type="text" class="ic-input" placeholder="Como aparece en la tarjeta" style="text-transform:uppercase" />
                </div>
                <div class="ic-field">
                  <label>Válida hasta</label>
                  <input v-model="formTar.expiracion" type="text" class="ic-input" placeholder="MM/AA" maxlength="5" @input="formatearExpiracion" />
                </div>
                <div class="ic-field">
                  <label>Código de seguridad</label>
                  <input v-model="formTar.cvv" type="password" class="ic-input" placeholder="CVV" maxlength="4" />
                </div>
              </div>
              <div class="tar-aviso">⚠️ Puede que se le cargue una pequeña cantidad para verificar su tarjeta. La transacción se cancelará después.</div>
              <div v-if="msgTar" :class="msgTar.tipo === 'ok' ? 'msg-ok' : 'msg-err'">{{ msgTar.texto }}</div>
              <div class="ic-actions">
                <button class="btn-prim" :disabled="guardandoTar" @click="guardarTarjeta">{{ guardandoTar ? 'Guardando...' : 'GUARDAR TARJETA' }}</button>
                <button class="btn-text" @click="subvistaTarjeta = null">CANCELAR</button>
              </div>
              <p class="tar-nota">Esta tarjeta no se asociará automáticamente a tus suscripciones.</p>
            </div>
          </div>
        </section>

        <!-- ── TAB: PEDIDOS ── -->
        <section v-else-if="tabActivo === 'pedidos'">
          <div class="tab-header">
            <div class="tab-header-left">
              <button class="btn-back" @click="pedidoDetalle = null" v-if="pedidoDetalle">← Atrás</button>
              <h2 class="tab-title">{{ pedidoDetalle ? 'Detalle de orden' : 'Mis pedidos' }}</h2>
            </div>
          </div>
          <div v-if="!pedidoDetalle">
            <div class="ped-filtros">
              <div class="pf-search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="buscarPedido" type="text" placeholder="Buscar pedido" />
              </div>
            </div>
            <div v-if="Object.keys(pedidosFiltrados).length === 0" class="empty-state">
              <span>📦</span><p>No se encontraron pedidos.</p>
            </div>
            <div v-else class="ped-list">
              <div v-for="(grupo, key) in pedidosFiltrados" :key="key"
                class="ped-row" @click="verDetallePedido(grupo)">
                <div class="ped-row-left">
                  <span :class="['estado-pill', 'estado-' + estadoSlug(grupo[0].estado)]">{{ grupo[0].estado || 'Recibido' }}</span>
                  <div class="ped-row-info">
                    <p class="ped-num">Pedido #{{ grupo[0].pedido_grupo?.slice(-12) || grupo[0].id }}</p>
                    <p class="ped-fecha">{{ formatFecha(grupo[0].fecha) }}</p>
                    <p class="ped-total">${{ totalGrupo(grupo) }}</p>
                  </div>
                </div>
                <div class="ped-row-right">
                  <div class="ped-thumbs">
                    <div v-for="(item, idx) in grupo.slice(0,3)" :key="idx" class="ped-thumb">
                      <img :src="item.imagen_url || item.imagen || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=80&q=60'" :alt="item.producto"
                        @error="$event.target.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=80&q=60'" />
                    </div>
                    <span v-if="grupo.length > 3" class="ped-thumb-more">+{{ grupo.length - 3 }}</span>
                  </div>
                  <span class="ped-row-arrow">Más detalles →</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="ped-detalle">
            <div class="ped-detalle-grid">
              <div class="pd-col">
                <div class="pd-box">
                  <p class="pd-box-title">Forma de pago</p>
                  <p class="pd-box-val">{{ pedidoDetalle[0].metodo_pago || '—' }}</p>
                </div>
              </div>
              <div class="pd-col">
                <div class="pd-box">
                  <p class="pd-box-title">Resumen</p>
                  <div class="pd-resumen">
                    <div class="pd-res-row"><span>Subtotal</span><span>${{ subtotalDetalle }}</span></div>
                    <div class="pd-res-row total"><span>Total</span><span>${{ totalDetalle }}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pd-paquete">
              <div class="pd-paq-header">
                <p class="pd-paq-title">Paquete 1 de 1</p>
                <span :class="['estado-pill', 'estado-' + estadoSlug(pedidoDetalle[0].estado)]">{{ pedidoDetalle[0].estado || 'Recibido' }}</span>
              </div>
              <div v-for="item in pedidoDetalle" :key="item.id" class="pd-item">
                <img :src="item.imagen_url || item.imagen || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=120&q=60'" class="pd-item-img"
                  @error="$event.target.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=120&q=60'" />
                <div class="pd-item-info">
                  <p class="pd-item-label">Producto</p>
                  <p class="pd-item-nombre">{{ item.producto }}</p>
                </div>
                <div class="pd-item-nums">
                  <div><p class="pd-item-label">Precio</p><p>${{ parseFloat(item.precio).toFixed(2) }}</p></div>
                  <div><p class="pd-item-label">Cantidad</p><p>{{ item.cantidad }}</p></div>
                  <div><p class="pd-item-label">Subtotal</p><p>${{ parseFloat(item.total).toFixed(2) }}</p></div>
                </div>
              </div>
            </div>
            <div v-if="facturaDelDetalle" class="pd-factura">
              <div class="pdf-header">
                <span class="pdf-num">🧾 {{ facturaDelDetalle.numero_factura }}</span>
                <div class="pdf-btns">
                  <button class="btn-prim" @click="verFacturaModal(facturaDelDetalle.id)">Ver factura</button>
                  <button class="btn-sec" @click="descargarPDF(facturaDelDetalle.id, facturaDelDetalle.numero_factura)">⬇ PDF</button>
                  <button class="btn-sec" @click="descargarJSON(facturaDelDetalle.id, facturaDelDetalle.numero_factura)">{ } JSON</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── TAB: AUTENTICACIÓN ── -->
        <section v-else-if="tabActivo === 'autenticacion'">
          <div class="tab-header">
            <div class="tab-header-left">
              <button class="btn-back" @click="subvistaAuth = null" v-if="subvistaAuth">← PERFIL</button>
              <h2 class="tab-title">Autenticación</h2>
            </div>
          </div>
          <div v-if="!subvistaAuth" class="auth-layout">
            <div class="info-card">
              <div v-if="perfil.registro_google" class="google-notice">
                <span>🔒</span>
                <p>Tu cuenta fue creada con Google. No puedes cambiar la contraseña desde aquí.</p>
              </div>
              <template v-else>
                <div class="ic-grid">
                  <div class="ic-field ic-full">
                    <label>Contraseña actual</label>
                    <div class="pwd-wrap">
                      <input :type="verPwd1 ? 'text' : 'password'" v-model="formPwd.actual" class="ic-input" />
                      <button class="pwd-toggle" @click="verPwd1 = !verPwd1">👁</button>
                    </div>
                  </div>
                  <div class="ic-field ic-full">
                    <label>Nueva contraseña</label>
                    <div class="pwd-wrap">
                      <input :type="verPwd2 ? 'text' : 'password'" v-model="formPwd.nueva" class="ic-input" @input="validarPassword" />
                      <button class="pwd-toggle" @click="verPwd2 = !verPwd2">👁</button>
                    </div>
                  </div>
                </div>
                <ul class="pwd-reqs">
                  <li :class="['req-item', pwdReqs.length ? 'ok' : 'fail']"><span class="req-ico">{{ pwdReqs.length ? '✅' : '❌' }}</span> 8 caracteres</li>
                  <li :class="['req-item', pwdReqs.numero ? 'ok' : 'fail']"><span class="req-ico">{{ pwdReqs.numero ? '✅' : '❌' }}</span> 1 número</li>
                  <li :class="['req-item', pwdReqs.minus ? 'ok' : 'fail']"><span class="req-ico">{{ pwdReqs.minus ? '✅' : '❌' }}</span> 1 letra minúscula</li>
                  <li :class="['req-item', pwdReqs.mayus ? 'ok' : 'fail']"><span class="req-ico">{{ pwdReqs.mayus ? '✅' : '❌' }}</span> 1 letra mayúscula</li>
                </ul>
                <div v-if="msgPwd" :class="msgPwd.tipo === 'ok' ? 'msg-ok' : 'msg-err'">{{ msgPwd.texto }}</div>
                <button class="btn-prim" :disabled="guardandoPwd || !pwdValida" @click="cambiarPassword" style="margin-top:16px">
                  {{ guardandoPwd ? 'Guardando...' : 'Guardar contraseña' }}
                </button>
              </template>
            </div>
            <div class="auth-side">
              <p class="auth-side-title">Gestión de sesiones</p>
              <p class="auth-side-sub">Usted tiene 1 sesión activa</p>
              <button class="btn-text" @click="subvistaAuth = 'sesiones'">Ver sesiones →</button>
            </div>
          </div>
          <div v-else-if="subvistaAuth === 'sesiones'">
            <div class="sesiones-grid">
              <div class="sesion-card sesion-actual">
                <div class="sesion-badge">Sesión actual ⭐</div>
                <p class="sesion-tipo">Escritorio</p>
                <p class="sesion-info">Último acceso: ahora mismo</p>
                <p class="sesion-info">{{ navegadorInfo }}</p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>

    <!-- MODAL FACTURA PDF -->
    <transition name="modal">
      <div v-if="facturaModal.visible" class="modal-overlay" @click.self="facturaModal.visible = false">
        <div class="factura-pdf-modal">
          <div class="fpdf-header">
            <p class="fpdf-title">🧾 {{ facturaModal.numero }}</p>
            <div class="fpdf-actions">
              <button class="btn-prim-sm" @click="descargarPDF(facturaModal.id)">⬇ Descargar PDF</button>
              <button class="btn-sec-sm" @click="descargarJSON(facturaModal.id, facturaModal.numero)">{ } JSON</button>
              <button class="btn-close" @click="facturaModal.visible = false">✕</button>
            </div>
          </div>
          <iframe v-if="facturaModal.pdfUrl" :src="facturaModal.pdfUrl" class="fpdf-iframe" title="Factura PDF"></iframe>
          <div v-else style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:14px">
            Cargando PDF...
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import { useDarkMode } from '../composables/useDarkMode'

const router  = useRouter()
const usuario = ref(JSON.parse(localStorage.getItem('usuario') || 'null'))
const { isDark, toggle } = useDarkMode()

const tabs = [
  { id: 'perfil',        label: 'Perfil' },
  { id: 'direcciones',   label: 'Direcciones' },
  { id: 'tarjetas',      label: 'Tarjetas de crédito' },
  { id: 'pedidos',       label: 'Pedidos' },
  { id: 'autenticacion', label: 'Autenticación' },
]
const tabActivo = ref('perfil')
function irA(tab) { tabActivo.value = tab }

// ── Perfil ────────────────────────────────────────────────────
const perfil          = reactive({})
const editandoPerfil  = ref(false)
const guardandoPerfil = ref(false)
const msgPerfil       = ref(null)
const formPerfil      = ref({})

const inicialUsuario = computed(() => (perfil.nombre || usuario.value?.nombre || 'U').charAt(0).toUpperCase())
const primerNombre   = computed(() => { const p = (perfil.nombre||'').split(' '); return p.slice(0,2).join(' ')||'—' })

async function cargarPerfil() {
  try { const r = await api.get(`/perfil/${usuario.value.id}`); Object.assign(perfil, r.data) } catch(e) { console.error(e) }
}
function abrirEditarPerfil() {
  formPerfil.value = { nombre: perfil.nombre||'', telefono: perfil.telefono||'', genero: perfil.genero||'', documento: perfil.documento||'', fecha_nacimiento: perfil.fecha_nacimiento ? perfil.fecha_nacimiento.slice(0,10) : '' }
  editandoPerfil.value = true; msgPerfil.value = null
}
async function guardarPerfil() {
  if (!formPerfil.value.nombre.trim()) { msgPerfil.value = { tipo:'err', texto:'El nombre es obligatorio' }; return }
  guardandoPerfil.value = true; msgPerfil.value = null
  try {
    const r = await api.put(`/perfil/${usuario.value.id}`, formPerfil.value)
    Object.assign(perfil, r.data.usuario)
    const u = { ...usuario.value, nombre: r.data.usuario.nombre, perfil_completo: 1 }
    localStorage.setItem('usuario', JSON.stringify(u)); usuario.value = u
    editandoPerfil.value = false
    msgPerfil.value = { tipo:'ok', texto:'¡Perfil actualizado correctamente!' }
    setTimeout(() => { msgPerfil.value = null }, 3000)
  } catch(err) { msgPerfil.value = { tipo:'err', texto: err.response?.data?.mensaje||'Error al guardar' } }
  finally { guardandoPerfil.value = false }
}

// ── Direcciones ───────────────────────────────────────────────
const direcciones       = ref([])
const subvistaDireccion = ref(null)
const guardandoDir      = ref(false)
const msgDir            = ref(null)
const formDir           = ref({ pais:'El Salvador', departamento:'', municipio:'', distrito:'', calle:'', info_adicional:'', destinatario:'' })

// Edición inline
const editandoDirId    = ref(null)
const guardandoEditDir = ref(false)
const msgEditDir       = ref(null)
const formEditDir      = ref({ destinatario:'', departamento:'', distrito:'', municipio:'', calle:'', info_adicional:'' })

function abrirEditarDireccion(dir) {
  editandoDirId.value = dir.id; msgEditDir.value = null
  formEditDir.value = { destinatario: dir.destinatario||'', departamento: dir.departamento||'', distrito: dir.distrito||'', municipio: dir.municipio||'', calle: dir.calle||'', info_adicional: dir.info_adicional||'' }
}
async function guardarEditarDireccion(id) {
  const f = formEditDir.value
  if (!f.destinatario || !f.departamento || !f.distrito || !f.municipio || !f.calle) {
    msgEditDir.value = { tipo:'err', texto:'Completa los campos obligatorios' }; return
  }
  guardandoEditDir.value = true; msgEditDir.value = null
  try { await api.put(`/perfil/direcciones/${id}`, f); await cargarDirecciones(); editandoDirId.value = null }
  catch(err) { msgEditDir.value = { tipo:'err', texto: err.response?.data?.mensaje||'Error al guardar' } }
  finally { guardandoEditDir.value = false }
}
async function quitarPrincipalDir(id) {
  try { await api.patch(`/perfil/direcciones/${id}/quitar-principal`); await cargarDirecciones() } catch(e) { console.error(e) }
}

const departamentos = ['Ahuachapán','Santa Ana','Sonsonate','Chalatenango','La Libertad','San Salvador','Cuscatlán','La Paz','Cabañas','San Vicente','Usulután','San Miguel','Morazán','La Unión']

const distritosPorDep = {
  'Ahuachapán':   ['Ahuachapán Centro','Ahuachapán Norte','Ahuachapán Sur'],
  'Santa Ana':    ['Santa Ana Centro','Santa Ana Este','Santa Ana Norte','Santa Ana Oeste'],
  'Sonsonate':    ['Sonsonate Centro','Sonsonate Este','Sonsonate Norte','Sonsonate Oeste'],
  'Chalatenango': ['Chalatenango Centro','Chalatenango Norte','Chalatenango Sur'],
  'La Libertad':  ['La Libertad Centro','La Libertad Costa','La Libertad Este','La Libertad Norte','La Libertad Oeste','La Libertad Sur'],
  'San Salvador': ['San Salvador Centro','San Salvador Este','San Salvador Norte','San Salvador Oeste','San Salvador Sur'],
  'Cuscatlán':    ['Cuscatlán Norte','Cuscatlán Sur'],
  'La Paz':       ['La Paz Centro','La Paz Este','La Paz Oeste'],
  'Cabañas':      ['Cabañas Este','Cabañas Oeste'],
  'San Vicente':  ['San Vicente Norte','San Vicente Sur'],
  'Usulután':     ['Usulután Este','Usulután Norte','Usulután Oeste'],
  'San Miguel':   ['San Miguel Centro','San Miguel Norte','San Miguel Oeste'],
  'Morazán':      ['Morazán Norte','Morazán Sur'],
  'La Unión':     ['La Unión Norte','La Unión Sur'],
}

const municipiosPorDistrito = {
  'Ahuachapán Centro':   ['Ahuachapán','Apaneca','Concepción de Ataco','Tacuba'],
  'Ahuachapán Norte':    ['Atiquizaya','El Refugio','San Lorenzo','Turín'],
  'Ahuachapán Sur':      ['Guaymango','Jujutla','San Francisco Menéndez','San Pedro Puxtla'],
  'Santa Ana Centro':    ['Santa Ana'],
  'Santa Ana Este':      ['Coatepeque','El Congo'],
  'Santa Ana Norte':     ['Masahuat','Metapán','Santa Rosa Guachipilín','Texistepeque'],
  'Santa Ana Oeste':     ['Candelaria de la Frontera','Chalchuapa','El Porvenir','San Antonio Pajonal','San Sebastián Salitrillo','Santiago de la Frontera'],
  'Sonsonate Centro':    ['Nahulingo','San Antonio del Monte','Santo Domingo de Guzmán','Sonsonate','Sonzacate'],
  'Sonsonate Este':      ['Armenia','Caluco','Cuisnahuat','Izalco','San Julián','Santa Isabel Ishuatán'],
  'Sonsonate Norte':     ['Juayúa','Nahuizalco','Salcoatitán','Santa Catarina Masahuat'],
  'Sonsonate Oeste':     ['Acajutla'],
  'Chalatenango Centro': ['Agua Caliente','Dulce Nombre de María','El Paraíso','La Reina','Nueva Concepción','San Fernando','San Francisco Morazán','San Rafael','Santa Rita','Tejutla'],
  'Chalatenango Norte':  ['Citalá','La Palma','San Ignacio'],
  'Chalatenango Sur':    ['Arcatao','Azacualpa','Chalatenango','Comalapa','Concepción Quezaltepeque','El Carrizal','La Laguna','Las Vueltas','Nombre de Jesús','Nueva Trinidad','Ojos de Agua','Potonico','San Antonio Los Ranchos','San Antonio de la Cruz','San Francisco Lempa','San Isidro Labrador','San José Cancasque','San José Las Flores','San Luis del Carmen','San Miguel de Mercedes'],
  'La Libertad Centro':  ['Ciudad Arce','San Juan Opico'],
  'La Libertad Costa':   ['Chiltiupán','Jicalapa','La Libertad','Tamanique','Teotepeque'],
  'La Libertad Este':    ['Antiguo Cuscatlán','Huizúcar','Nuevo Cuscatlán','San José Villanueva','Zaragoza'],
  'La Libertad Norte':   ['Quezaltepeque','San Matías','San Pablo Tacachico'],
  'La Libertad Oeste':   ['Colón','Jayaque','Sacacoyo','Talnique','Tepecoyo'],
  'La Libertad Sur':     ['Comasagua','Santa Tecla'],
  'San Salvador Centro': ['Ayutuxtepeque','Cuscatancingo','Delgado','Mejicanos','San Salvador'],
  'San Salvador Este':   ['Ilopango','San Martín','Soyapango','Tonacatepeque'],
  'San Salvador Norte':  ['Aguilares','El Paisnal','Guazapa'],
  'San Salvador Oeste':  ['Apopa','Nejapa'],
  'San Salvador Sur':    ['Panchimalco','Rosario de Mora','San Marcos','Santiago Texacuangos','Santo Tomás'],
  'Cuscatlán Norte':     ['Oratorio de Concepción','San Bartolomé Perulapía','San José Guayabal','San Pedro Perulapán','Suchitoto'],
  'Cuscatlán Sur':       ['Candelaria','Cojutepeque','El Carmen','El Rosario','Monte San Juan','San Cristóbal','San Rafael Cedros','San Ramón','Santa Cruz Analquito','Santa Cruz Michapa','Tenancingo'],
  'La Paz Centro':       ['El Rosario de La Paz','Jerusalén','Mercedes La Ceiba','Paraíso de Osorio','San Antonio Masahuat','San Emigdio','San Juan Tepezontes','San Luis La Herradura','San Miguel Tepezontes','San Pedro Nonualco','Santa María Ostuma','Santiago Nonualco'],
  'La Paz Este':         ['San Juan Nonualco','San Rafael Obrajuelo','Zacatecoluca'],
  'La Paz Oeste':        ['Cuyultitán','Olocuilta','San Francisco Chinameca','San Juan Talpa','San Luis Talpa','San Pedro Masahuat','Tapalhuaca'],
  'Cabañas Este':        ['Dolores','Guacotecti','San Isidro','Sensuntepeque','Victoria'],
  'Cabañas Oeste':       ['Cinquera','Ilobasco','Jutiapa','Tejutepeque'],
  'San Vicente Norte':   ['Apastepeque','San Esteban Catarina','San Ildefonso','San Lorenzo','San Sebastián','Santa Clara','Santo Domingo'],
  'San Vicente Sur':     ['Guadalupe','San Cayetano Istepeque','San Vicente','Tecoluca','Tepetitán','Verapaz'],
  'Usulután Este':       ['California','Concepción Batres','Ereguayquín','Jucuarán','Ozatlán','San Dionisio','Santa Elena','Santa María','Tecapán','Usulután'],
  'Usulután Norte':      ['Alegría','Berlín','El Triunfo','Estanzuelas','Jucuapa','Mercedes Umaña','Nueva Granada','San Buenaventura','Santiago de María'],
  'Usulután Oeste':      ['Jiquilisco','Puerto El Triunfo','San Agustín','San Francisco Javier'],
  'San Miguel Centro':   ['Chirilagua','Comacarán','Moncagua','Quelepa','San Miguel','Uluazapa'],
  'San Miguel Norte':    ['Carolina','Chapeltique','Ciudad Barrios','Nuevo Edén de San Juan','San Antonio del Mosco','San Gerardo','San Luis de La Reina','Sesori'],
  'San Miguel Oeste':    ['Chinameca','El Tránsito','Lolotique','Nueva Guadalupe','San Jorge','San Rafael Oriente'],
  'Morazán Norte':       ['Arambala','Cacaopera','Corinto','El Rosario','Joateca','Jocoaitique','Meanguera','Perquín','San Fernando','San Isidro','Torola'],
  'Morazán Sur':         ['Chilanga','Delicias de Concepción','El Divisadero','Gualococti','Guatajiagua','Jocoro','Lolotiquillo','Osicala','San Carlos','San Francisco Gotera','San Simón','Sensembra','Sociedad','Yamabal','Yoloaiquín'],
  'La Unión Norte':      ['Anamorós','Bolívar','Concepción de Oriente','El Sauce','Lislique','Nueva Esparta','Pasaquina','Polorós','San José La Fuente','Santa Rosa de Lima'],
  'La Unión Sur':        ['Conchagua','El Carmen','Intipucá','La Unión','Meanguera del Golfo','San Alejo','Yayantique','Yucuaiquín'],
}

async function cargarDirecciones() {
  try { const r = await api.get(`/perfil/${usuario.value.id}/direcciones`); direcciones.value = r.data } catch(e) { console.error(e) }
}
async function guardarDireccion() {
  if (!formDir.value.departamento || !formDir.value.distrito || !formDir.value.municipio || !formDir.value.calle || !formDir.value.destinatario) {
    msgDir.value = { tipo:'err', texto:'Completa los campos obligatorios' }; return
  }
  guardandoDir.value = true; msgDir.value = null
  try {
    await api.post(`/perfil/${usuario.value.id}/direcciones`, formDir.value)
    await cargarDirecciones(); subvistaDireccion.value = null
    formDir.value = { pais:'El Salvador', departamento:'', municipio:'', distrito:'', calle:'', info_adicional:'', destinatario:'' }
  } catch(err) { msgDir.value = { tipo:'err', texto: err.response?.data?.mensaje||'Error al guardar' } }
  finally { guardandoDir.value = false }
}
async function eliminarDireccion(id) {
  if (!confirm('¿Eliminar esta dirección?')) return
  try { await api.delete(`/perfil/direcciones/${id}`); await cargarDirecciones() } catch(e) { console.error(e) }
}
async function marcarPrincipalDir(id) {
  try { await api.patch(`/perfil/direcciones/${id}/principal`, { usuario_id: usuario.value.id }); await cargarDirecciones() } catch(e) { console.error(e) }
}

// ── Tarjetas ──────────────────────────────────────────────────
const tarjetas        = ref([])
const subvistaTarjeta = ref(null)
const guardandoTar    = ref(false)
const msgTar          = ref(null)
const formTar         = ref({ numero:'', nombre_titular:'', expiracion:'', cvv:'', tipo:'visa' })

const tipoDetectado = computed(() => {
  const n = formTar.value.numero.replace(/\s/g,'')
  if (n.startsWith('4')) return 'visa'
  if (/^5[1-5]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  return 'otro'
})
const tarjetaNumeroVista = computed(() => {
  const n = formTar.value.numero.replace(/\s/g,'')
  if (!n) return '•••• •••• •••• ••••'
  return n.padEnd(16,'•').match(/.{1,4}/g).join(' ')
})
function formatearNumeroTarjeta(e) {
  let val = e.target.value.replace(/\D/g,'').slice(0,16)
  formTar.value.numero = val.match(/.{1,4}/g)?.join(' ') || val
  formTar.value.tipo = tipoDetectado.value
}
function formatearExpiracion(e) {
  let val = e.target.value.replace(/\D/g,'').slice(0,4)
  if (val.length >= 3) val = val.slice(0,2)+'/'+val.slice(2)
  formTar.value.expiracion = val
}
async function cargarTarjetas() {
  try { const r = await api.get(`/perfil/${usuario.value.id}/tarjetas`); tarjetas.value = r.data } catch(e) { console.error(e) }
}
async function guardarTarjeta() {
  const n = formTar.value.numero.replace(/\s/g,'')
  if (n.length < 13 || !formTar.value.nombre_titular || !formTar.value.expiracion) {
    msgTar.value = { tipo:'err', texto:'Completa todos los datos de la tarjeta' }; return
  }
  guardandoTar.value = true; msgTar.value = null
  try {
    await api.post(`/perfil/${usuario.value.id}/tarjetas`, {
      ultimos_cuatro: n.slice(-4), nombre_titular: formTar.value.nombre_titular.toUpperCase(),
      expiracion: formTar.value.expiracion, tipo: tipoDetectado.value, es_principal: tarjetas.value.length === 0
    })
    await cargarTarjetas(); subvistaTarjeta.value = null
    formTar.value = { numero:'', nombre_titular:'', expiracion:'', cvv:'', tipo:'visa' }
  } catch(err) { msgTar.value = { tipo:'err', texto: err.response?.data?.mensaje||'Error al guardar' } }
  finally { guardandoTar.value = false }
}
async function eliminarTarjeta(id) {
  if (!confirm('¿Eliminar esta tarjeta?')) return
  try { await api.delete(`/perfil/tarjetas/${id}`); await cargarTarjetas() } catch(e) { console.error(e) }
}

// ── Pedidos ───────────────────────────────────────────────────
const pedidos           = ref([])
const pedidoDetalle     = ref(null)
const facturaDelDetalle = ref(null)
const buscarPedido      = ref('')

const pedidosAgrupados = computed(() => {
  const g = {}
  for (const p of pedidos.value) {
    const k = p.pedido_grupo || `ind_${p.id}`
    if (!g[k]) g[k] = []
    g[k].push(p)
  }
  return Object.fromEntries(Object.entries(g).sort(([,a],[,b]) => new Date(b[0].fecha)-new Date(a[0].fecha)))
})
const pedidosFiltrados = computed(() => {
  const q = buscarPedido.value.toLowerCase()
  return Object.fromEntries(
    Object.entries(pedidosAgrupados.value).filter(([key,grupo]) =>
      !q || key.toLowerCase().includes(q) || grupo.some(i=>(i.producto||'').toLowerCase().includes(q))
    )
  )
})
function totalGrupo(grupo) { return grupo.reduce((s,i)=>s+parseFloat(i.total||0),0).toFixed(2) }
const totalDetalle    = computed(() => pedidoDetalle.value ? totalGrupo(pedidoDetalle.value) : '0.00')
const subtotalDetalle = computed(() => pedidoDetalle.value ? (parseFloat(totalDetalle.value)/1.13).toFixed(2) : '0.00')

async function verDetallePedido(grupo) {
  pedidoDetalle.value = grupo; facturaDelDetalle.value = null
  try {
    const key = grupo[0].pedido_grupo
    if (key) { const r = await api.get(`/facturas/pedido/${key}`); facturaDelDetalle.value = r.data }
  } catch { /* sin factura */ }
}
async function cargarPedidos() {
  try { const r = await api.get(`/pedidos/usuario/${usuario.value.id}`); pedidos.value = r.data } catch(e) { console.error(e) }
}

// ── Autenticación ─────────────────────────────────────────────
const subvistaAuth  = ref(null)
const verPwd1       = ref(false)
const verPwd2       = ref(false)
const guardandoPwd  = ref(false)
const msgPwd        = ref(null)
const formPwd       = ref({ actual:'', nueva:'' })
const pwdReqs       = reactive({ length:false, numero:false, minus:false, mayus:false })
const pwdValida     = computed(() => pwdReqs.length && pwdReqs.numero && pwdReqs.minus && pwdReqs.mayus)

function validarPassword() {
  const p = formPwd.value.nueva
  pwdReqs.length = p.length >= 8; pwdReqs.numero = /\d/.test(p)
  pwdReqs.minus = /[a-z]/.test(p); pwdReqs.mayus = /[A-Z]/.test(p)
}
async function cambiarPassword() {
  if (!pwdValida.value) return
  guardandoPwd.value = true; msgPwd.value = null
  try {
    await api.put(`/perfil/${usuario.value.id}/password`, { password_actual: formPwd.value.actual, password_nuevo: formPwd.value.nueva })
    msgPwd.value = { tipo:'ok', texto:'Contraseña actualizada correctamente' }
    formPwd.value = { actual:'', nueva:'' }
    Object.assign(pwdReqs, { length:false, numero:false, minus:false, mayus:false })
  } catch(err) { msgPwd.value = { tipo:'err', texto: err.response?.data?.mensaje||'Error al cambiar contraseña' } }
  finally { guardandoPwd.value = false }
}
const navegadorInfo = computed(() => {
  const ua = navigator.userAgent
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : 'Navegador'
  const os      = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'Mac' : 'Escritorio'
  return `${browser}, ${os}`
})

// ── Factura modal ─────────────────────────────────────────────
const facturaModal = reactive({ visible:false, id:null, numero:'', pdfUrl:null })
async function verFacturaModal(id) {
  const pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/facturas/${id}/pdf`
  facturaModal.id      = id
  facturaModal.pdfUrl  = pdfUrl
  facturaModal.visible = true
}
function descargarPDF(id) {
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/facturas/${id}/pdf`
  const a = document.createElement('a')
  a.href = url; a.target = '_blank'; a.download = `factura_${id}.pdf`; a.click()
}
async function descargarJSON(id, numero) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL||'http://localhost:3000'}/api/facturas/${id}/json`)
    const blob = await res.blob(); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${numero}.json`; a.click(); URL.revokeObjectURL(url)
  } catch { alert('Error al descargar') }
}

// ── Helpers ───────────────────────────────────────────────────
function formatFecha(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-SV', { day:'2-digit', month:'2-digit', year:'numeric' })
}
function estadoSlug(e) { return (e||'recibido').toLowerCase().replace(/[\s/]/g,'-') }
function cerrarSesion() { localStorage.removeItem('usuario'); router.push('/login') }

onMounted(async () => {
  const tabSolicitado = sessionStorage.getItem('perfilTab')
  tabActivo.value = (tabSolicitado && tabSolicitado !== 'perfil') ? tabSolicitado : 'perfil'
  sessionStorage.removeItem('perfilTab')
  await cargarPerfil()
  await cargarDirecciones()
  await cargarTarjetas()
  await cargarPedidos()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.perfil-root { min-height: 100vh; background: var(--bg-base, #f5f5f5); font-family: 'DM Sans', sans-serif; }
.perfil-layout { max-width: 1200px; margin: 0 auto; padding: 32px 24px; display: flex; gap: 32px; align-items: flex-start; }

/* ASIDE */
.perfil-aside { width: 200px; flex-shrink: 0; position: sticky; top: 24px; }
.pa-user { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.pa-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-card-hover, #e5e7eb); color: var(--text-muted); font-size: 20px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid var(--border, #e5e7eb); flex-shrink: 0; }
.pa-saludo { font-size: 12px; color: var(--text-muted); }
.pa-nombre { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.pa-nav { display: flex; flex-direction: column; }
.pa-link { background: transparent; border: none; text-align: left; padding: 10px 12px; font-size: 14px; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; border-radius: 6px; transition: all 0.12s; border-left: 3px solid transparent; }
.pa-link:hover { color: var(--text-primary); background: var(--bg-card, #fff); }
.pa-link.active { color: #378ADD; border-left-color: #378ADD; background: rgba(55,138,221,0.06); font-weight: 600; }
.pa-logout { color: #E24B4A !important; margin-top: 8px; }
.pa-logout:hover { background: rgba(226,75,74,0.08) !important; }
.pa-catalogo { color: #378ADD !important; font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.pa-catalogo:hover { background: rgba(55,138,221,0.08) !important; }
.pa-nav-sep { height: 1px; background: var(--border, #e5e7eb); margin: 6px 0 8px; }
.pa-darkmode { display: flex; align-items: center; gap: 8px; color: var(--text-secondary) !important; font-size: 13px; }
.pa-darkmode:hover { color: var(--text-primary) !important; background: var(--bg-card, #fff); }
.pa-darkmode-icon { font-size: 15px; }

/* MAIN */
.perfil-main { flex: 1; min-width: 0; }
.tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.tab-header-left { display: flex; align-items: center; gap: 12px; }
.tab-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--text-primary); }
.btn-back { background: transparent; border: none; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 0; transition: color 0.12s; }
.btn-back:hover { color: #378ADD; }

/* INFO CARD */
.info-card { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 12px; padding: 24px; }
.ic-sub { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
.ic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.ic-field { display: flex; flex-direction: column; gap: 4px; }
.ic-full  { grid-column: 1 / -1; }
.ic-field label { font-size: 12px; color: var(--text-muted); }
.ic-field p { font-size: 16px; color: var(--text-primary); font-weight: 400; padding-bottom: 8px; border-bottom: 1px solid var(--border-soft, #f0f0f0); }
.ic-input { background: var(--input-bg, #f9fafb); border: 1px solid var(--input-border, #e5e7eb); border-radius: 8px; padding: 10px 12px; font-size: 14px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; outline: none; width: 100%; color-scheme: inherit; }
.ic-input:focus { border-color: rgba(55,138,221,0.5); background: rgba(55,138,221,0.03); }
:global(.dark) select.ic-input, :global(.dark) select.ic-input option { background-color: #12151f; color: #f1f5f9; }
:global(.light) select.ic-input, :global(.light) select.ic-input option, :global(:root) select.ic-input, :global(:root) select.ic-input option { background-color: #f9fafb; color: #111827; }
:global(.dark) select.ic-input:disabled { background-color: #0f1117; color: #64748b; }
:global(.light) select.ic-input:disabled { background-color: #f3f4f6; color: #9ca3af; }
.ic-actions { display: flex; gap: 10px; margin-top: 16px; }
.req { color: #E24B4A; }

/* BUTTONS */
.btn-prim { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 8px; padding: 10px 22px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Syne', sans-serif; transition: opacity 0.15s; }
.btn-prim:hover:not(:disabled) { opacity: 0.9; }
.btn-prim:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sec { background: var(--bg-base, #f5f5f5); border: 1px solid var(--border, #e5e7eb); border-radius: 8px; padding: 9px 18px; font-size: 13px; color: var(--text-secondary); cursor: pointer; transition: all 0.12s; }
.btn-sec:hover { background: var(--bg-card-hover); }
.btn-text { background: transparent; border: none; font-size: 12px; font-weight: 600; color: #378ADD; cursor: pointer; padding: 4px 0; }
.btn-text.danger { color: #E24B4A; }
.btn-text.warn   { color: #EF9F27; }
.btn-text.warn:hover { color: #c07a00; }
.btn-close { background: var(--bg-base); border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; color: var(--text-muted); }

/* MESSAGES */
.msg-ok  { background: rgba(29,158,117,0.1); border: 1px solid rgba(29,158,117,0.3); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #1D9E75; margin-top: 12px; }
.msg-err { background: rgba(226,75,74,0.1);  border: 1px solid rgba(226,75,74,0.3);  border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #E24B4A; margin-top: 12px; }

/* EMPTY */
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.empty-state span { font-size: 44px; display: block; margin-bottom: 12px; }

/* DIRECCIONES */
.dir-list { display: flex; flex-direction: column; gap: 12px; }
.dir-card { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; padding: 14px 16px; }
.dir-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.dir-nombre  { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.dir-detalle { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
.dir-extra   { font-size: 12px; color: var(--text-muted); }
.badge-principal { background: rgba(55,138,221,0.1); color: #378ADD; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; }
.dir-card-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.dir-edit-form { padding: 4px 0; }
.dir-edit-titulo { font-size: 12px; font-weight: 700; color: #378ADD; margin-bottom: 14px; }
.dir-edit-actions { display: flex; gap: 10px; margin-top: 14px; }

/* TARJETAS */
.tar-form-layout { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
.tar-preview { width: 260px; min-width: 220px; height: 160px; border-radius: 16px; background: linear-gradient(135deg, #2a2a2a, #555); padding: 20px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 8px 20px rgba(0,0,0,0.2); color: #fff; flex-shrink: 0; }
.tar-preview.tipo-visa       { background: linear-gradient(135deg, #1a1f71, #2575fc); }
.tar-preview.tipo-mastercard { background: linear-gradient(135deg, #eb001b, #f79e1b); }
.tar-preview.tipo-amex       { background: linear-gradient(135deg, #007b5e, #00d2a0); }
.tp-chip { margin-bottom: 8px; }
.tp-numero { font-size: 16px; letter-spacing: 0.15em; font-weight: 600; }
.tp-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
.tp-nombre { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.tp-exp    { font-size: 11px; color: rgba(255,255,255,0.8); }
.tar-list { display: flex; flex-direction: column; gap: 12px; }
.tar-card { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; }
.tar-chip  { flex-shrink: 0; }
.tar-info  { flex: 1; }
.tar-numero  { font-size: 14px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.1em; }
.tar-titular { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; }
.tar-exp     { font-size: 11px; color: var(--text-muted); }
.tar-right   { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.tar-tipo    { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
.tar-del     { flex-shrink: 0; margin-left: 8px; }
.tar-aviso { background: rgba(239,159,39,0.1); border: 1px solid rgba(239,159,39,0.3); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #a06000; margin-top: 14px; line-height: 1.5; }
.tar-nota { font-size: 11px; color: var(--text-muted); margin-top: 10px; text-align: center; }
.pwd-wrap { position: relative; }
.pwd-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; }

/* PEDIDOS */
.ped-filtros { display: flex; gap: 10px; margin-bottom: 16px; }
.pf-search { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 8px; padding: 9px 14px; }
.pf-search input { flex: 1; background: transparent; border: none; outline: none; font-size: 13px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; }
.ped-list { display: flex; flex-direction: column; gap: 10px; }
.ped-row { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.15s; }
.ped-row:hover { border-color: rgba(55,138,221,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.ped-row-left  { display: flex; align-items: center; gap: 14px; }
.ped-row-info  { display: flex; flex-direction: column; gap: 2px; }
.ped-num       { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ped-fecha     { font-size: 12px; color: var(--text-muted); }
.ped-total     { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ped-row-right { display: flex; align-items: center; gap: 12px; }
.ped-thumbs    { display: flex; gap: 4px; align-items: center; }
.ped-thumb     { width: 36px; height: 36px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-soft, #f0f0f0); background: var(--bg-base); }
.ped-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 2px; display: block; }
.ped-thumb-more { font-size: 11px; color: var(--text-muted); font-weight: 600; }
.ped-row-arrow { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.estado-pill { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; white-space: nowrap; }
.estado-recibido   { background: rgba(55,138,221,0.12); color: #378ADD; }
.estado-preparando { background: rgba(239,159,39,0.12); color: #EF9F27; }
.estado-en-camino  { background: rgba(124,58,237,0.12); color: #7C3AED; }
.estado-entregado  { background: rgba(29,158,117,0.12); color: #1D9E75; }
.estado-devuelto   { background: rgba(226,75,74,0.12); color: #E24B4A; }
.ped-detalle       { display: flex; flex-direction: column; gap: 20px; }
.ped-detalle-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pd-box { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; padding: 16px; }
.pd-box-title { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.pd-box-val { font-size: 15px; color: var(--text-primary); }
.pd-resumen { display: flex; flex-direction: column; gap: 6px; }
.pd-res-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); }
.pd-res-row.total { font-weight: 700; font-size: 15px; color: var(--text-primary); border-top: 1px solid var(--border-soft); padding-top: 6px; }
.pd-paquete { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; overflow: hidden; }
.pd-paq-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-soft, #f0f0f0); }
.pd-paq-title  { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.pd-item { display: flex; gap: 14px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-soft, #f0f0f0); }
.pd-item:last-child { border-bottom: none; }
.pd-item-img { width: 56px; height: 56px; object-fit: contain; padding: 4px; border-radius: 8px; background: var(--bg-base); flex-shrink: 0; }
.pd-item-info { flex: 1; }
.pd-item-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 2px; }
.pd-item-nombre { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.pd-item-nums { display: flex; gap: 24px; }
.pd-item-nums div p:last-child { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.pd-factura { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; padding: 14px 16px; }
.pdf-header  { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.pdf-num     { font-size: 13px; font-weight: 700; color: #1D9E75; }
.pdf-btns    { display: flex; gap: 8px; }

/* AUTENTICACION */
.auth-layout { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
.auth-layout .info-card { flex: 1; min-width: 280px; }
.auth-side { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 12px; padding: 20px; min-width: 200px; }
.auth-side-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.auth-side-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
.google-notice { display: flex; gap: 10px; align-items: flex-start; background: rgba(55,138,221,0.08); border-radius: 8px; padding: 12px; font-size: 13px; color: var(--text-secondary); }
.google-notice span { font-size: 18px; }
.pwd-reqs { list-style: none; display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
.req-item { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
.req-item.ok   { color: #1D9E75; }
.req-item.fail { color: var(--text-muted); }
.req-ico { font-size: 14px; }
.sesiones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 16px; }
.sesion-card { background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; padding: 16px; }
.sesion-actual { border-color: rgba(55,138,221,0.3); }
.sesion-badge { font-size: 12px; font-weight: 700; color: #378ADD; margin-bottom: 8px; }
.sesion-tipo  { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.sesion-info  { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }

/* FACTURA MODAL */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 12px; }
.factura-modal { background: var(--bg-card, #fff); border-radius: 16px; width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.fm-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border, #e5e7eb); }
.fm-header h3 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--text-primary); }
.fm-actions { display: flex; gap: 8px; align-items: center; }
.fm-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.fm-doble { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.fm-bloque { background: var(--bg-base, #f5f5f5); border-radius: 8px; padding: 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
.fm-bloque-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #378ADD; margin-bottom: 6px; }
.fm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.fm-table th { background: #1D4E89; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
.fm-table td { padding: 8px 10px; border-bottom: 1px solid var(--border-soft, #f0f0f0); color: var(--text-secondary); }
.fm-table tr:nth-child(even) td { background: rgba(55,138,221,0.04); }
.fm-totales { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
.fm-tot-row { display: flex; gap: 60px; font-size: 13px; color: var(--text-secondary); }
.fm-grand   { font-size: 16px; font-weight: 800; color: #1D4E89; border-top: 2px solid var(--border); padding-top: 6px; }
.fm-letras  { font-size: 11px; color: var(--text-muted); font-style: italic; }

/* ══ FACTURA PDF MODAL ══ */
.factura-pdf-modal { background: var(--bg-card, #fff); border-radius: 14px; width: 96vw; max-width: 1100px; height: 94vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
.fpdf-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; gap: 12px; }
.fpdf-title  { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary); flex: 1; }
.fpdf-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.fpdf-iframe { flex: 1; width: 100%; border: none; background: #f0f0f0; display: block; min-height: 0; }
.btn-prim-sm { background: linear-gradient(135deg, #378ADD, #1D9E75); border: none; border-radius: 7px; padding: 7px 14px; font-size: 12px; font-weight: 600; color: #fff; cursor: pointer; white-space: nowrap; transition: opacity 0.15s; }
.btn-prim-sm:hover { opacity: 0.9; }
.btn-sec-sm  { background: var(--bg-base); border: 1px solid var(--border); border-radius: 7px; padding: 7px 14px; font-size: 12px; color: var(--text-secondary); cursor: pointer; white-space: nowrap; }
.btn-sec-sm:hover { background: var(--bg-card-hover); }
.modal-enter-active, .modal-leave-active { transition: all 0.24s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }

/* RESPONSIVE */
@media (max-width: 768px) {
  .perfil-layout { flex-direction: column; padding: 16px; gap: 16px; }
  .perfil-aside  { width: 100%; position: static; }
  .pa-nav { flex-direction: row; flex-wrap: wrap; gap: 4px; }
  .pa-link { border-left: none; border-bottom: 3px solid transparent; padding: 7px 10px; font-size: 13px; }
  .pa-link.active { border-left: none; border-bottom-color: #378ADD; }
  .ic-grid { grid-template-columns: 1fr; }
  .ic-full { grid-column: 1; }
  .ped-detalle-grid { grid-template-columns: 1fr; }
  .fm-doble { grid-template-columns: 1fr; }
  .tar-form-layout { flex-direction: column; }
  .auth-layout { flex-direction: column; }
}
</style>