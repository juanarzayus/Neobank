<template>
  <div class="auth-view">
    <h1 class="auth-title">{{ isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo' }}</h1>
    <p class="auth-subtitle">
      {{ isRegister ? 'Regístrate en NOVA en menos de un minuto.' : 'Accede a tu cuenta de NOVA.' }}
    </p>

    <!-- Tabs -->
    <div class="tabs" role="tablist">
      <button id="tab-login" type="button" class="tab" :class="{ active: !isRegister }" @click="setMode(false)">
        Iniciar sesión
      </button>
      <button id="tab-register" type="button" class="tab" :class="{ active: isRegister }" @click="setMode(true)">
        Registrarme
      </button>
    </div>

    <form class="form" novalidate @submit.prevent="onSubmit">
      <div v-if="isRegister" class="row">
        <div class="field">
          <label for="firstName">Nombre</label>
          <input id="firstName" v-model.trim="form.firstName" type="text" autocomplete="given-name" placeholder="Juan" />
          <span v-if="errors.firstName" class="error">{{ errors.firstName }}</span>
        </div>
        <div class="field">
          <label for="lastName">Apellido</label>
          <input id="lastName" v-model.trim="form.lastName" type="text" autocomplete="family-name" placeholder="Pérez" />
          <span v-if="errors.lastName" class="error">{{ errors.lastName }}</span>
        </div>
      </div>

      <div class="field">
        <label for="email">Correo electrónico</label>
        <input id="email" v-model.trim="form.email" type="email" autocomplete="email" placeholder="tu@correo.com" />
        <span v-if="errors.email" class="error">{{ errors.email }}</span>
      </div>

      <div class="field">
        <label for="password">Contraseña</label>
        <div class="password-wrap">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            placeholder="Mínimo 8 caracteres"
          />
          <button id="toggle-password" type="button" class="toggle" @click="showPassword = !showPassword">
            {{ showPassword ? 'Ocultar' : 'Ver' }}
          </button>
        </div>
        <span v-if="errors.password" class="error">{{ errors.password }}</span>
      </div>

      <div v-if="isRegister" class="field">
        <label for="confirmPassword">Confirmar contraseña</label>
        <input id="confirmPassword" v-model="form.confirmPassword" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Repite tu contraseña" />
        <span v-if="errors.confirmPassword" class="error">{{ errors.confirmPassword }}</span>
      </div>

      <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

      <AppButton id="submit-auth" type="submit" class="submit" :is-loading="loading">
        {{ isRegister ? 'Crear cuenta' : 'Entrar' }}
      </AppButton>
    </form>

    <!-- Separador -->
    <div class="divider">
      <span>o</span>
    </div>

    <!-- Acceso demo (sin backend) -->
    <button id="demo-login" type="button" class="demo-btn" @click="handleDemo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Acceder como demo
    </button>

    <p class="switch">
      {{ isRegister ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?' }}
      <a href="#" @click.prevent="setMode(!isRegister)">{{ isRegister ? 'Inicia sesión' : 'Regístrate' }}</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const isRegister = ref(false);
const showPassword = ref(false);
const loading = ref(false);
const serverError = ref('');

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
});
const errors = reactive<Record<string, string>>({});

const setMode = (register: boolean) => {
  isRegister.value = register;
  serverError.value = '';
  Object.keys(errors).forEach((k) => delete errors[k]);
};

const validate = () => {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (isRegister.value) {
    if (!form.firstName) errors.firstName = 'Ingresa tu nombre';
    if (!form.lastName) errors.lastName = 'Ingresa tu apellido';
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Correo no válido';
  if (form.password.length < 8) errors.password = 'Mínimo 8 caracteres';
  if (isRegister.value && form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }
  return Object.keys(errors).length === 0;
};

const onSubmit = async () => {
  serverError.value = '';
  if (!validate()) return;
  loading.value = true;
  try {
    if (isRegister.value) {
      await authStore.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password
      });
    } else {
      await authStore.login(form.email, form.password);
    }
    router.push('/dashboard');
  } catch (e: any) {
    const isNetworkError = !e?.response;
    if (isNetworkError) {
      serverError.value = 'No se pudo conectar con el servidor. Usa el acceso demo para continuar.';
    } else {
      serverError.value = e?.response?.data?.message || 'No pudimos completar la solicitud. Inténtalo de nuevo.';
    }
  } finally {
    loading.value = false;
  }
};

const handleDemo = () => {
  authStore.demoLogin();
  router.push('/dashboard');
};
</script>

<style scoped>
.auth-view { display: flex; flex-direction: column; }
.auth-title { font-size: 1.6rem; font-weight: 800; color: #0a1a3c; letter-spacing: -0.02em; }
.auth-subtitle { color: #64748b; font-size: 0.95rem; margin-top: 0.25rem; }

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #eef2f7;
  padding: 0.3rem;
  border-radius: 0.8rem;
  margin: 1.5rem 0 1.25rem;
}
.tab {
  border: none;
  background: transparent;
  padding: 0.6rem;
  border-radius: 0.6rem;
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab.active { background: #fff; color: #0a1a3c; box-shadow: 0 2px 8px rgba(10, 26, 60, 0.1); }

.form { display: flex; flex-direction: column; gap: 1rem; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field label { font-size: 0.82rem; font-weight: 600; color: #334155; }
.field input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1.5px solid #dbe3ee;
  border-radius: 0.7rem;
  font: inherit;
  font-size: 0.95rem;
  color: #0a1a3c;
  background: #f9fbfd;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.field input:focus { border-color: #00c9a7; background: #fff; box-shadow: 0 0 0 4px rgba(0, 229, 192, 0.18); }
.password-wrap { position: relative; }
.password-wrap input { padding-right: 4.2rem; }
.toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #0a8f7a;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
}
.error { color: #dc2626; font-size: 0.78rem; }
.server-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 0.6rem;
  padding: 0.65rem 0.8rem;
  font-size: 0.85rem;
}

/* Botón principal con la paleta NOVA */
.submit { width: 100%; }
.submit :deep(.base-button),
.form :deep(.base-button--primary) {
  width: 100%;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 0.8rem;
  background: linear-gradient(135deg, #0a1a3c, #14336e);
  color: #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.form :deep(.base-button--primary:hover:not(:disabled)) {
  background: linear-gradient(135deg, #0a1a3c, #0d9488);
  transform: translateY(-1px);
  box-shadow: 0 10px 22px -8px rgba(10, 26, 60, 0.5);
}
.form :deep(.base-button--primary:disabled) { background: #94a3b8; }

.switch { text-align: center; margin-top: 1.25rem; font-size: 0.88rem; color: #64748b; }
.switch a { color: #0a8f7a; font-weight: 700; }
.switch a:hover { text-decoration: underline; }

/* Separador */
.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0 0;
  color: #94a3b8;
  font-size: 0.8rem;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

/* Botón demo */
.demo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  border: 1.5px dashed #cbd5e1;
  background: transparent;
  color: #475569;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
  margin-bottom: 0.25rem;
}
.demo-btn svg { width: 16px; height: 16px; color: #00c9a7; }
.demo-btn:hover {
  border-color: #00c9a7;
  background: rgba(0, 229, 192, 0.06);
  color: #0a1a3c;
}

@media (max-width: 420px) {
  .row { grid-template-columns: 1fr; }
}
</style>
