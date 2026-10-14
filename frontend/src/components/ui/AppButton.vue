<template>
  <button
    :class="['base-button', variantClass]"
    :disabled="isLoading || disabled"
    :type="type"
  >
    <!-- Spinner condicional -->
    <svg v-if="isLoading" class="spinner" viewBox="0 0 24 24">
      <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
      <path class="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
    
    <!-- Texto original (Slot) -->
    <span :class="{ 'opacity-0': isLoading && !showTextWhileLoading }">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface ButtonProps {
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  showTextWhileLoading?: boolean;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  isLoading: false,
  disabled: false,
  type: 'button',
  variant: 'primary',
  showTextWhileLoading: false
});

const variantClass = computed(() => {
  return `base-button--${props.variant}`;
});
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  outline: none;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.base-button--primary {
  background-color: #2563eb;
  color: #ffffff;
}

.base-button--primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.base-button--primary:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.base-button--secondary {
  background-color: #e5e7eb;
  color: #1f2937;
}

.base-button--secondary:hover:not(:disabled) {
  background-color: #d1d5db;
}

.base-button--secondary:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.base-button--danger {
  background-color: #dc2626;
  color: #ffffff;
}

.base-button--danger:hover:not(:disabled) {
  background-color: #b91c1c;
}

.base-button--danger:disabled {
  background-color: #fca5a5;
  cursor: not-allowed;
}

.spinner {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  animation: spin 1s linear infinite;
}

.spinner-circle {
  opacity: 0.25;
}

.spinner-path {
  opacity: 0.75;
}

.opacity-0 {
  opacity: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>