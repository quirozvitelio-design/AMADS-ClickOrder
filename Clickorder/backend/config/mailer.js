const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'clickorder.noreply@gmail.com',
    pass: 'kryg bgsv daxf muxw'
  }
})

// ── Verificación de cuenta (ya existía) ──────────────────────
const enviarCorreoVerificacion = async (correoUsuario, nombreUsuario, token) => {
  const urlActivacion = `http://localhost:5173/verificar-cuenta?token=${token}`
  await transporter.sendMail({
    from: '"ClickOrder Platform" <clickorder.noreply@gmail.com>',
    to: correoUsuario,
    subject: '✅ Activa tu cuenta en ClickOrder',
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:30px;border:1px solid #e2e8f0;border-radius:16px;background:#fff">
        <div style="text-align:center;margin-bottom:24px">
          <span style="background:linear-gradient(135deg,#378ADD,#1D9E75);color:#fff;padding:8px 16px;border-radius:8px;font-weight:700;font-size:18px">◆ clickorder</span>
        </div>
        <h2 style="color:#1a202c">¡Hola, ${nombreUsuario}! 👋</h2>
        <p style="color:#4a5568;line-height:1.6">Activa tu cuenta presionando el botón:</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${urlActivacion}" style="background:linear-gradient(135deg,#378ADD,#1D9E75);color:#fff;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;display:inline-block">
            Activar Mi Cuenta →
          </a>
        </div>
        <p style="color:#718096;font-size:13px;border-top:1px solid #edf2f7;padding-top:16px">
          Válido por <strong>24 horas</strong>.
        </p>
      </div>
    `
  })
}

// ── Confirmación de pedido ────────────────────────────────────
const enviarConfirmacionPedido = async (correoUsuario, nombreUsuario, grupo, items, total, direccion) => {
  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#374151">${i.producto}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#374151;text-align:center">${i.cantidad}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#374151;text-align:right">$${parseFloat(i.precio * i.cantidad).toFixed(2)}</td>
    </tr>
  `).join('')

  await transporter.sendMail({
    from: '"ClickOrder" <clickorder.noreply@gmail.com>',
    to: correoUsuario,
    subject: `🛍️ Pedido confirmado — ${grupo.slice(-12)}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:30px;border:1px solid #e2e8f0;border-radius:16px;background:#fff">
        <div style="text-align:center;margin-bottom:24px">
          <span style="background:linear-gradient(135deg,#378ADD,#1D9E75);color:#fff;padding:8px 16px;border-radius:8px;font-weight:700;font-size:18px">◆ clickorder</span>
        </div>
        <h2 style="color:#1a202c">¡Pedido confirmado! 🎉</h2>
        <p style="color:#4a5568">Hola <strong>${nombreUsuario}</strong>, recibimos tu orden correctamente.</p>
        <div style="background:#f8fafc;border-radius:10px;padding:14px;margin:16px 0">
          <p style="font-size:12px;color:#9ca3af;margin:0 0 4px">Número de orden</p>
          <p style="font-size:14px;font-weight:700;color:#111827;margin:0">${grupo}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:linear-gradient(135deg,#378ADD,#1D9E75)">
              <th style="padding:10px;color:#fff;text-align:left;font-size:12px">Producto</th>
              <th style="padding:10px;color:#fff;text-align:center;font-size:12px">Cant.</th>
              <th style="padding:10px;color:#fff;text-align:right;font-size:12px">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align:right;padding:10px 0;border-top:2px solid #e5e7eb">
          <span style="font-size:18px;font-weight:800;color:#1D9E75">Total: $${parseFloat(total).toFixed(2)}</span>
        </div>
        ${direccion ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-top:16px">
          <p style="font-size:12px;color:#9ca3af;margin:0 0 4px">📍 Dirección de entrega</p>
          <p style="font-size:14px;color:#111827;margin:0">${direccion}</p>
        </div>` : ''}
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center">
          Puedes seguir el estado de tu pedido en <strong>Mis Pedidos</strong> dentro de ClickOrder.
        </p>
      </div>
    `
  })
}

// ── Notificación de cambio de estado ─────────────────────────
const enviarNotificacionEstado = async (correoUsuario, nombreUsuario, grupo, estado) => {
  const estadoConfig = {
    'Preparando': {
      emoji: '📦',
      color: '#EF9F27',
      msg: 'Tu pedido está siendo preparado por nuestro equipo.'
    },
    'En camino/Listo para retirar': {
      emoji: '🚚',
      color: '#7C3AED',
      msg: 'Tu pedido está en camino. ¡Pronto lo recibirás!'
    },
    'Entregado': {
      emoji: '✅',
      color: '#1D9E75',
      msg: '¡Tu pedido fue entregado exitosamente! Gracias por comprar en ClickOrder.'
    },
    'Devuelto': {
      emoji: '↩️',
      color: '#E24B4A',
      msg: 'Se procesó la devolución de tu pedido.'
    }
  }

  const cfg = estadoConfig[estado] || { emoji: '🔔', color: '#378ADD', msg: `El estado de tu pedido cambió a: ${estado}` }

  await transporter.sendMail({
    from: '"ClickOrder" <clickorder.noreply@gmail.com>',
    to: correoUsuario,
    subject: `${cfg.emoji} Tu pedido — ${estado}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:30px;border:1px solid #e2e8f0;border-radius:16px;background:#fff">
        <div style="text-align:center;margin-bottom:24px">
          <span style="background:linear-gradient(135deg,#378ADD,#1D9E75);color:#fff;padding:8px 16px;border-radius:8px;font-weight:700;font-size:18px">◆ clickorder</span>
        </div>
        <div style="text-align:center;margin:24px 0">
          <span style="font-size:48px">${cfg.emoji}</span>
          <h2 style="color:${cfg.color};margin:8px 0">${estado}</h2>
        </div>
        <p style="color:#4a5568;text-align:center;font-size:15px">
          Hola <strong>${nombreUsuario}</strong>, ${cfg.msg}
        </p>
        <div style="background:#f8fafc;border-radius:10px;padding:14px;margin:20px 0;text-align:center">
          <p style="font-size:12px;color:#9ca3af;margin:0 0 4px">Orden</p>
          <p style="font-size:13px;font-weight:700;color:#111827;margin:0">${grupo}</p>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center">
          Consulta el detalle en <strong>Mis Pedidos</strong> dentro de ClickOrder.
        </p>
      </div>
    `
  })
}

module.exports = {
  enviarCorreoVerificacion,
  enviarConfirmacionPedido,
  enviarNotificacionEstado
}