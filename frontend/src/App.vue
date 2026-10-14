<template>
  <!-- Renderiza dinámicamente el layout según la ruta activa -->
  <component :is="$route.meta.layout || 'div'">
    <router-view />
  </component>
</template>

<script setup lang="ts">
// No necesitas importar nada adicional aquí, Vue Router inyecta $route
</script>

<style>
/* Aquí puedes importar tu CSS global o Tailwind si no lo tienes en main.ts */
@import './assets/main.css';
</style>