<template>
  <div class="main-layout flex h-screen bg-gray-50">
    <!-- Sidebar de Navegación -->
    <aside class="w-64 bg-white border-r">
      <div class="p-4 font-bold text-xl">Neobanco</div>
      <nav class="flex flex-col p-4 gap-2">
        <router-link to="/dashboard" class="p-2 hover:bg-gray-100 rounded">Dashboard</router-link>
        <router-link to="/wallet" class="p-2 hover:bg-gray-100 rounded">Billetera</router-link>
        <router-link to="/cards" class="p-2 hover:bg-gray-100 rounded">Tarjetas Virtuales</router-link>
        <router-link to="/transactions" class="p-2 hover:bg-gray-100 rounded">Movimientos</router-link>
      </nav>
    </aside>

    <!-- Área de Contenido Principal -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="h-16 bg-white border-b flex items-center justify-between px-6">
        <span class="text-gray-700">Bienvenido, {{ authStore.user?.firstName }}</span>
        <AppButton variant="secondary" @click="handleLogout">Cerrar Sesión</AppButton>
      </header>
      
      <!-- Vista Activa inyectada por Vue Router -->
      <section class="flex-1 overflow-y-auto p-6">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>