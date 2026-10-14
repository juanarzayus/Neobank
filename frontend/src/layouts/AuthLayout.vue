<template>
  <div class="auth-layout min-h-screen flex items-center justify-center bg-blue-50">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <div class="text-center mb-6 font-bold text-2xl">Neobanco</div>
      <!-- Aquí se inyecta LoginView.vue o RegisterView.vue -->
      <router-view />
    </div>
  </div>
</template>