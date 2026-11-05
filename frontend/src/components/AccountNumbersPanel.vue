<template>
  <section class="acc-numbers" aria-labelledby="acc-numbers-title">
    <header class="acc-numbers__header">
      <div>
        <h2 id="acc-numbers-title" class="acc-numbers__title">Tus números de cuenta</h2>
        <p class="acc-numbers__sub">Compártelos para recibir transferencias.</p>
      </div>
      <button
        v-if="accounts.length > 0"
        type="button"
        class="acc-numbers__copy-all"
        @click="copyAll"
      >
        {{ copiedKey === 'all' ? '✓ Datos copiados' : 'Copiar datos para compartir' }}
      </button>
    </header>

    <p v-if="loading" class="acc-numbers__empty">Cargando…</p>
    <p v-else-if="accounts.length === 0" class="acc-numbers__empty">Aún no tienes cuentas.</p>

    <ul v-else class="acc-numbers__list">
      <li v-for="acc in accounts" :key="acc.id" class="acc-row">
        <div class="acc-row__info">
          <span class="acc-row__badge" :class="{ 'acc-row__badge--savings': acc.type === 'SAVINGS' }">
            {{ acc.type === 'CHECKING' ? 'Principal' : 'Ahorros' }}
          </span>
          <span class="acc-row__name">{{ acc.name }}</span>
        </div>
        <span class="acc-row__number" :aria-label="`Número de cuenta ${acc.accountNumber}`">
          {{ formatAccountNumber(acc.accountNumber) }}
        </span>
        <button
          type="button"
          class="acc-row__copy"
          :class="{ 'acc-row__copy--done': copiedKey === acc.id }"
          :aria-label="`Copiar número de cuenta de ${acc.name}`"
          @click="copyOne(acc)"
        >
          <svg v-if="copiedKey !== acc.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ copiedKey === acc.id ? 'Copiado' : 'Copiar' }}
        </button>
      </li>
    </ul>

    <p v-if="copyError" class="acc-numbers__error" role="alert">{{ copyError }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Account } from '@/types/accounts';
import { copyToClipboard, formatAccountNumber } from '@/utils/accountNumber';

const props = withDefaults(
  defineProps<{ accounts: Account[]; holderName?: string; loading?: boolean }>(),
  { holderName: '', loading: false }
);

const copiedKey = ref<string | null>(null);
const copyError = ref('');
let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function copy(text: string, key: string) {
  copyError.value = '';
  if (await copyToClipboard(text)) {
    copiedKey.value = key;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => (copiedKey.value = null), 2000);
  } else {
    copyError.value = `No se pudo copiar automáticamente. Tu número es ${text}`;
  }
}

/** Copia solo los dígitos: es lo que se pega en "Enviar a otra cuenta". */
const copyOne = (acc: Account) => copy(acc.accountNumber, acc.id);

/** Texto listo para pegar en un chat. */
const copyAll = () => {
  const lines = props.accounts.map(
    (a) => `${a.type === 'CHECKING' ? 'Cuenta principal' : `Ahorros (${a.name})`}: ${a.accountNumber}`
  );
  const header = props.holderName ? `Titular: ${props.holderName} · NOVA` : 'NOVA';
  return copy([header, ...lines].join('\n'), 'all');
};
</script>

<style scoped>
.acc-numbers {
  background: #131a26;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 18px;
  padding: 1.25rem 1.4rem;
}
.acc-numbers__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
}
.acc-numbers__title { margin: 0; font-size: 1rem; font-weight: 700; color: #f0f4ff; }
.acc-numbers__sub { margin: 0.2rem 0 0; font-size: 0.8rem; color: rgba(255, 255, 255, 0.45); }
.acc-numbers__copy-all {
  border: 1px solid rgba(0, 229, 192, 0.4);
  background: rgba(0, 229, 192, 0.08);
  color: #5eead4;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.acc-numbers__copy-all:hover { background: rgba(0, 229, 192, 0.16); }
.acc-numbers__empty { margin: 0; font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); }
.acc-numbers__error { margin: 0.75rem 0 0; font-size: 0.8rem; color: #fca5a5; }

.acc-numbers__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.acc-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.acc-row__info { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
.acc-row__badge {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.2);
  color: #93c5fd;
}
.acc-row__badge--savings { background: rgba(0, 229, 192, 0.15); color: #5eead4; }
.acc-row__name { font-size: 0.88rem; color: #e5e7eb; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.acc-row__number {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  user-select: all;
}
.acc-row__copy {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #e5e7eb;
  border-radius: 999px;
  padding: 0.38rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  min-width: 6.2rem;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.acc-row__copy:hover { background: rgba(255, 255, 255, 0.12); }
.acc-row__copy svg { width: 14px; height: 14px; }
.acc-row__copy--done { border-color: rgba(0, 229, 192, 0.5); color: #5eead4; background: rgba(0, 229, 192, 0.1); }

@media (max-width: 560px) {
  .acc-row { grid-template-columns: 1fr auto; }
  .acc-row__info { grid-column: 1 / -1; }
}
</style>
