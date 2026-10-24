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
      </nav>

      <!-- User card at bottom -->
      <div class="sidebar__user">
        <div class="sidebar__avatar">{{ userInitials }}</div>
        <div class="sidebar__user-info">
          <p class="sidebar__user-name">{{ displayName }}</p>
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

          <!-- Avatar con Menú Desplegable -->
          <div class="profile-menu" ref="profileMenuRef">
            <button
              class="topbar__avatar-btn"
              @click="toggleProfileMenu"
              title="Opciones de perfil"
              :aria-expanded="profileMenuOpen"
            >
              <div class="topbar__avatar">{{ userInitials }}</div>
            </button>

            <!-- Menú Desplegable flotante -->
            <transition name="dropdown-fade">
              <div v-if="profileMenuOpen" class="profile-dropdown">
                <div class="profile-dropdown__header">
                  <p class="profile-dropdown__name">{{ displayName }}</p>
                  <p class="profile-dropdown__email">{{ authStore.user?.email }}</p>
                </div>
                <div class="profile-dropdown__divider"></div>
                <button class="profile-dropdown__item" @click="openProfileModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Mis datos</span>
                </button>
                <button class="profile-dropdown__item profile-dropdown__item--danger" @click="handleLogout">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M3 21V3h9" stroke-linecap="round" />
                  </svg>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="page-content">
        <router-view />
      </main>
    </div>

    <!-- ===== MODAL MIS DATOS ===== -->
    <transition name="modal-fade">
      <div v-if="profileModalOpen" class="modal-overlay" @click.self="closeProfileModal">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Mis datos</h3>
                <p class="modal-subtitle">Actualiza tu información personal</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="closeProfileModal" title="Cerrar modal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveProfile" class="modal-form">
            <div class="form-group">
              <label class="form-label" for="preferredName">Nombre preferido</label>
              <input
                id="preferredName"
                v-model="profileForm.preferredName"
                type="text"
                class="form-input"
                placeholder="Ej. Juan o cómo deseas que te llamemos"
                maxlength="50"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="email">Correo electrónico</label>
              <input
                id="email"
                v-model="profileForm.email"
                type="email"
                class="form-input"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="address">Dirección</label>
              <input
                id="address"
                v-model="profileForm.address"
                type="text"
                class="form-input"
                placeholder="Ej. Calle 100 #15-20, Apto 301"
                maxlength="150"
              />
            </div>

            <div v-if="profileSuccessMsg" class="form-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ profileSuccessMsg }}</span>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn--secondary" @click="closeProfileModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn--primary">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

const displayName = computed(() => {
  if (authStore.user?.preferredName) return authStore.user.preferredName;
  const fullName = `${authStore.user?.firstName ?? ''} ${authStore.user?.lastName ?? ''}`.trim();
  return fullName || 'Usuario';
});

const userInitials = computed(() => {
  const name = authStore.user?.preferredName || authStore.user?.firstName || '';
  const last = authStore.user?.lastName || '';
  const f = name[0] ?? '';
  const l = last[0] ?? '';
  return (f + l).toUpperCase() || 'U';
});

// Dropdown de perfil
const profileMenuOpen = ref(false);
const profileMenuRef = ref<HTMLElement | null>(null);

const toggleProfileMenu = () => {
  profileMenuOpen.value = !profileMenuOpen.value;
};

const closeProfileMenu = () => {
  profileMenuOpen.value = false;
};

// Modal "Mis datos"
const profileModalOpen = ref(false);
const profileSuccessMsg = ref('');
const profileForm = ref({
  preferredName: '',
  email: '',
  address: '',
});

const openProfileModal = () => {
  closeProfileMenu();
  profileSuccessMsg.value = '';
  profileForm.value = {
    preferredName: authStore.user?.preferredName || authStore.user?.firstName || '',
    email: authStore.user?.email || '',
    address: authStore.user?.address || '',
  };
  profileModalOpen.value = true;
};

const closeProfileModal = () => {
  profileModalOpen.value = false;
};

const saveProfile = () => {
  authStore.updateProfile({
    preferredName: profileForm.value.preferredName.trim(),
    email: profileForm.value.email.trim(),
    address: profileForm.value.address.trim(),
  });
  profileSuccessMsg.value = '¡Datos actualizados correctamente!';
  setTimeout(() => {
    profileModalOpen.value = false;
    profileSuccessMsg.value = '';
  }, 900);
};

<<<<<<< Updated upstream
const handleLogout = () => {
  closeProfileMenu();
  authStore.logout();
=======
// Dropdown de perfil
const profileMenuOpen = ref(false);
const profileMenuRef = ref<HTMLElement | null>(null);

const toggleProfileMenu = () => {
  profileMenuOpen.value = !profileMenuOpen.value;
};

const closeProfileMenu = () => {
  profileMenuOpen.value = false;
};

// Modal "Mis datos"
const profileModalOpen = ref(false);
const profileSuccessMsg = ref('');
const profileForm = ref({
  preferredName: '',
  email: '',
  address: '',
});

const openProfileModal = () => {
  closeProfileMenu();
  profileSuccessMsg.value = '';
  profileForm.value = {
    preferredName: authStore.user?.preferredName || authStore.user?.firstName || '',
    email: authStore.user?.email || '',
    address: authStore.user?.address || '',
  };
  profileModalOpen.value = true;
};

const closeProfileModal = () => {
  profileModalOpen.value = false;
};

const saveProfile = () => {
  authStore.updateProfile({
    preferredName: profileForm.value.preferredName.trim(),
    email: profileForm.value.email.trim(),
    address: profileForm.value.address.trim(),
  });
  profileSuccessMsg.value = '¡Datos actualizados correctamente!';
  setTimeout(() => {
    profileModalOpen.value = false;
    profileSuccessMsg.value = '';
  }, 900);
};

const handleLogout = async () => {
  closeProfileMenu();
  await authStore.logout();
>>>>>>> Stashed changes
  router.push('/login');
};

const handleClickOutside = (event: MouseEvent) => {
  if (profileMenuRef.value && !profileMenuRef.value.contains(event.target as Node)) {
    closeProfileMenu();
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeProfileMenu();
    closeProfileModal();
  }
};

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('keydown', handleKeyDown);
});
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

/* Avatar button and dropdown */
.profile-menu {
  position: relative;
  display: flex;
  align-items: center;
}

.topbar__avatar-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  outline: none;
  transition: transform 0.15s;
}
.topbar__avatar-btn:hover {
  transform: scale(1.05);
}

.topbar__avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00e5c0, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 0 0 2px rgba(0,229,192,0.35);
  transition: box-shadow 0.2s;
}
.topbar__avatar-btn:hover .topbar__avatar {
  box-shadow: 0 0 0 3px rgba(0,229,192,0.6);
}

/* Profile Dropdown */
.profile-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 220px;
  background: #0e1726;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 229, 192, 0.08);
  padding: 0.5rem;
  z-index: 1000;
}
.profile-dropdown__header {
  padding: 0.5rem 0.65rem 0.4rem;
}
.profile-dropdown__name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #f0f4ff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-dropdown__email {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.45);
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-dropdown__divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 0.4rem 0.25rem;
}
.profile-dropdown__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.75);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-align: left;
}
.profile-dropdown__item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.profile-dropdown__item:hover {
  background: rgba(0, 229, 192, 0.1);
  color: #00e5c0;
}
.profile-dropdown__item--danger {
  color: rgba(248, 113, 113, 0.85);
}
.profile-dropdown__item--danger:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}

/* Animations Dropdown */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ===== MODAL MIS DATOS ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 18, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 1rem;
}
.modal-card {
  background: #0d1624;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.65), 0 0 25px rgba(0, 229, 192, 0.08);
  padding: 1.5rem;
  position: relative;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}
.modal-title-group {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.modal-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 229, 192, 0.12);
  color: #00e5c0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-icon-wrap svg {
  width: 20px;
  height: 20px;
}
.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}
.modal-subtitle {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.45);
  margin: 2px 0 0 0;
}
.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.4);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
}
.modal-close-btn:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}
.modal-close-btn svg {
  width: 18px;
  height: 18px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.form-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
}
.form-input {
  background: #080f1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  color: #f0f4ff;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input:focus {
  outline: none;
  border-color: #00e5c0;
  box-shadow: 0 0 0 2px rgba(0, 229, 192, 0.2);
}
.form-input::placeholder {
  color: rgba(255,255,255,0.25);
}

.form-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 229, 192, 0.12);
  border: 1px solid rgba(0, 229, 192, 0.3);
  color: #00e5c0;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
}
.form-success svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.btn {
  padding: 0.6rem 1.15rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
  border: none;
}
.btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}
.btn:active {
  transform: translateY(0);
}
.btn--secondary {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.75);
}
.btn--secondary:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
.btn--primary {
  background: linear-gradient(135deg, #00e5c0, #00b4d8);
  color: #0a1220;
  box-shadow: 0 0 15px rgba(0, 229, 192, 0.3);
}

/* Animations Modal */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  transform: scale(0.95);
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