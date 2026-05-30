<template>
  <div class="page-root">
    <div class="bg-grid"></div>
    <div class="page-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">Facturas</h1>
          <p class="page-sub">Gestiona las facturas generadas del sistema</p>
        </div>
      </div>
      <div class="empty-state">
        <span>🧾</span>
        <p>Las facturas se generan desde la vista de Pedidos</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page-root    { min-height: 100vh; background: var(--bg-base); font-family: 'DM Sans', sans-serif; position: relative; }
.bg-grid      { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 100%); }
.page-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
.page-header  { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.page-title   { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.page-sub     { font-size: 14px; color: var(--text-muted); }
.empty-state  { text-align: center; padding: 80px; color: var(--text-muted); }
.empty-state span { font-size: 52px; display: block; margin-bottom: 12px; }
</style>