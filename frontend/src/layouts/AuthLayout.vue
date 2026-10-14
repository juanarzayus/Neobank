<template>
  <div class="auth-shell">
    <!-- Panel de marca -->
    <aside class="brand-panel">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="brand-content">
        <div class="brand-logo-wrap">
          <img :src="logo" alt="NOVA Neobanco" class="brand-logo" />
        </div>
        <h2 class="brand-headline">
          Tu dinero, <span class="accent">sin fronteras</span>.
        </h2>
        <p class="brand-text">
          Billetera digital, tarjetas virtuales y movimientos en tiempo real, todo en un solo lugar.
        </p>
        <ul class="brand-features">
          <li><span class="dot"></span>Tarjetas virtuales al instante</li>
          <li><span class="dot"></span>Seguridad de nivel bancario</li>
          <li><span class="dot"></span>Sin comisiones ocultas</li>
        </ul>
      </div>
    </aside>

    <!-- Formulario -->
    <main class="form-panel">
      <div class="form-card">
        <img :src="logo" alt="NOVA" class="mobile-logo" />
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import logo from '@/assets/LOGONOVA.png';
</script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: #f4f7fb;
}

/* ---------- Panel de marca ---------- */
.brand-panel {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 3rem 4rem;
  color: #fff;
  background: linear-gradient(145deg, #0a1a3c 0%, #0d2552 55%, #0b3a5e 100%);
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.55;
  animation: float 9s ease-in-out infinite;
}
.orb-1 { width: 380px; height: 380px; background: #00e5c0; top: -120px; right: -100px; }
.orb-2 { width: 300px; height: 300px; background: #2563eb; bottom: -110px; left: -80px; animation-delay: -4s; }
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(24px) scale(1.06); }
}
.brand-content { position: relative; z-index: 1; max-width: 460px; }
.brand-logo-wrap {
  display: inline-flex;
  background: #fff;
  border-radius: 1.25rem;
  padding: 0.5rem;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.3);
  margin-bottom: 2.5rem;
}
.brand-logo { width: 150px; height: 150px; object-fit: contain; border-radius: 0.9rem; }
.brand-headline { font-size: 2.4rem; line-height: 1.15; font-weight: 800; letter-spacing: -0.02em; }
.accent { color: #00e5c0; }
.brand-text { margin-top: 1rem; color: #b6c4de; font-size: 1.05rem; line-height: 1.6; }
.brand-features { list-style: none; margin-top: 2rem; display: flex; flex-direction: column; gap: 0.8rem; }
.brand-features li { display: flex; align-items: center; gap: 0.75rem; color: #e3ebf8; font-weight: 500; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #00e5c0; box-shadow: 0 0 12px #00e5c0; }

/* ---------- Panel de formulario ---------- */
.form-panel { display: flex; align-items: center; justify-content: center; padding: 2rem 1.25rem; }
.form-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 1.5rem;
  padding: 2.5rem 2.25rem;
  box-shadow: 0 25px 60px -15px rgba(10, 26, 60, 0.18);
  animation: rise 0.5s ease both;
}
.mobile-logo { display: none; width: 90px; height: 90px; object-fit: contain; margin: 0 auto 1rem; }
@keyframes rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .auth-shell { grid-template-columns: 1fr; }
  .brand-panel { display: none; }
  .mobile-logo { display: block; }
}
</style>