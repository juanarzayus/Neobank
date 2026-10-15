<template>
  <div class="app-shell">
    <!-- ===== SIDEBAR ===== -->
    <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
      <!-- Logo -->
      <div class="sidebar__brand">
        <div class="sidebar__logo-wrap">
          <img :src="logo" alt="NOVA" class="sidebar__logo" />
        </div>
        <span class="sidebar__brand-name">NOVA</span>
        <button class="sidebar__collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed" title="Colapsar menú">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar__nav">
        <div class="sidebar__nav-label">Principal</div>
        <router-link to="/dashboard" class="sidebar__link" active-class="sidebar__link--active">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </span>
          <span class="sidebar__label">Dashboard</span>
        </router-link>
        <router-link to="/wallet" class="sidebar__link" active-class="sidebar__link--active">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
              <circle cx="17" cy="13" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <span class="sidebar__label">Billetera</span>
        </router-link>
        <router-link to="/cards" class="sidebar__link" active-class="sidebar__link--active">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <path d="M2 10h20" />
              <path d="M6 15h4" stroke-linecap="round" />
            </svg>
          </span>
          <span class="sidebar__label">Tarjetas</span>
        </router-link>
        <router-link to="/transactions" class="sidebar__link" active-class="sidebar__link--active">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M4 6h16M4 12h10M4 18h13" stroke-linecap="round" />
            </svg>
          </span>
          <span class="sidebar__label">Movimientos</span>
        </router-link>

        <div class="sidebar__nav-label sidebar__nav-label--mt">Cuenta</div>
        <button class="sidebar__link sidebar__link--logout" @click="handleLogout">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M3 21V3h9" stroke-linecap="round" />
            </svg>
          </span>
          <span class="sidebar__label">Cerrar sesión</span>
        </button>
      </nav>

      <!-- User card at bottom -->
      <div class="sidebar__user">
        <div class="sidebar__avatar">{{ userInitials }}</div>
        <div class="sidebar__user-info">
          <p class="sidebar__user-name">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</p>
          <p class="sidebar__user-email">{{ authStore.user?.email }}</p>
        </div>
      </div>
    </aside>

    <!-- ===== MAIN AREA ===== -->
    <div class="main-area">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar__left">
          <button class="topbar__mobile-menu" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
            </svg>
          </button>
          <div class="topbar__breadcrumb">
            <span class="topbar__route">{{ currentRouteName }}</span>
          </div>
        </div>
        <div class="topbar__right">
          <button class="topbar__icon-btn" title="Notificaciones">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke-linecap="round" />
            </svg>
            <span class="topbar__badge">2</span>
          </button>
          <div class="topbar__avatar">{{ userInitials }}</div>
        </div>
      </header>

      <!-- Content -->
      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useRoute } from 'vue-router';
import logo from '@/assets/LOGONOVA.png';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const sidebarCollapsed = ref(false);

const routeNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/wallet': 'Billetera',
  '/cards': 'Tarjetas Virtuales',
  '/transactions': 'Movimientos',
};
const currentRouteName = computed(() => routeNames[route.path] ?? 'NOVA Neobanco');

const userInitials = computed(() => {
  const f = authStore.user?.firstName?.[0] ?? '';
  const l = authStore.user?.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || 'U';
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
/* ===== ROOT SHELL ===== */
.app-shell {
  display: flex;
  height: 100vh;
  background: #0d1117;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

/* ===== SIDEBAR ===== */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: #0a1220;
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  transition: width 0.28s cubic-bezier(.4,0,.2,1), min-width 0.28s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
}
.sidebar--collapsed {
  width: 72px;
  min-width: 72px;
}
.sidebar--collapsed .sidebar__brand-name,
.sidebar--collapsed .sidebar__label,
.sidebar--collapsed .sidebar__nav-label,
.sidebar--collapsed .sidebar__user-info {
  opacity: 0;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
}
.sidebar--collapsed .sidebar__collapse-btn svg {
  transform: rotate(180deg);
}

/* Brand */
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem 1.25rem 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sidebar__logo-wrap {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0,229,192,0.25);
}
.sidebar__logo { width: 28px; height: 28px; object-fit: contain; }
.sidebar__brand-name {
  font-weight: 800;
  font-size: 1.1rem;
  color: #fff;
  letter-spacing: 0.04em;
  flex: 1;
  transition: opacity 0.2s, width 0.2s;
}
.sidebar__collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.35);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.sidebar__collapse-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
.sidebar__collapse-btn svg { width: 14px; height: 14px; transition: transform 0.28s; }

/* Nav */
.sidebar__nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}
.sidebar__nav-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.28);
  padding: 0.5rem 0.5rem 0.35rem;
  transition: opacity 0.2s, width 0.2s;
  white-space: nowrap;
  overflow: hidden;
}
.sidebar__nav-label--mt { margin-top: 0.5rem; }

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  white-space: nowrap;
}
.sidebar__link:hover { background: rgba(255,255,255,0.07); color: #fff; }
.sidebar__link--active {
  background: linear-gradient(135deg, rgba(0,229,192,0.15) 0%, rgba(37,99,235,0.1) 100%);
  color: #00e5c0 !important;
  box-shadow: inset 0 0 0 1px rgba(0,229,192,0.2);
}
.sidebar__link--logout { color: rgba(255,100,100,0.65); }
.sidebar__link--logout:hover { background: rgba(220,38,38,0.12); color: #f87171; }

.sidebar__icon {
  width: 20px;
  height: 20px;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar__icon svg { width: 18px; height: 18px; }
.sidebar__label { transition: opacity 0.2s, width 0.2s; white-space: nowrap; overflow: hidden; }

/* User card */
.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
}
.sidebar__avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00e5c0, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}
.sidebar__user-info { overflow: hidden; transition: opacity 0.2s, width 0.2s; }
.sidebar__user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.sidebar__user-email {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

/* ===== MAIN AREA ===== */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Topbar */
.topbar {
  height: 64px;
  min-height: 64px;
  background: #0d1117;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}
.topbar__left { display: flex; align-items: center; gap: 1rem; }
.topbar__mobile-menu {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.5);
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.topbar__mobile-menu svg { width: 20px; height: 20px; }
.topbar__breadcrumb {}
.topbar__route {
  font-weight: 700;
  font-size: 1rem;
  color: #f0f4ff;
}
.topbar__right { display: flex; align-items: center; gap: 0.75rem; }
.topbar__icon-btn {
  position: relative;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255,255,255,0.55);
  transition: background 0.15s, color 0.15s;
}
.topbar__icon-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.topbar__icon-btn svg { width: 18px; height: 18px; }
.topbar__badge {
  position: absolute;
  top: 4px; right: 4px;
  width: 14px; height: 14px;
  background: #00e5c0;
  border-radius: 50%;
  font-size: 0.55rem;
  font-weight: 700;
  color: #0a1220;
  display: flex;
  align-items: center;
  justify-content: center;
}
.topbar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00e5c0, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 0 0 2px rgba(0,229,192,0.35);
}

/* Page content */
.page-content {
  flex: 1;
  overflow-y: auto;
  background: #0d1117;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar { position: fixed; z-index: 100; height: 100vh; }
  .topbar__mobile-menu { display: flex; }
}
</style>