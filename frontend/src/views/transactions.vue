<template>
  <div class="transactions-view">
    <header class="tx-header">
      <h1 class="page-title">Movimientos</h1>
      <p class="page-description">Historial detallado de los movimientos de tus cuentas y tarjetas virtuales.</p>
    </header>

    <p v-if="error" class="banner banner--error" role="alert">{{ error }}</p>

    <div v-if="loading" class="empty">Cargando cuentas…</div>

    <template v-else>
      <div class="toolbar">
        <nav class="filters" aria-label="Filtrar por origen">
          <button
            id="filter-all"
            class="chip"
            :class="{ 'chip--active': selectedId === ALL }"
            type="button"
            @click="selectAccount(ALL)"
          >
            Todas las cuentas
          </button>
          <button
            v-for="acc in accounts"
            :key="acc.id"
            :id="`filter-${acc.id}`"
            class="chip"
            :class="{ 'chip--active': selectedId === acc.id }"
            type="button"
            @click="selectAccount(acc.id)"
          >
            {{ acc.name }}
          </button>
          <button
            id="filter-cards"
            class="chip chip--cards"
            :class="{ 'chip--active': selectedId === CARDS }"
            type="button"
            @click="selectAccount(CARDS)"
          >
            💳 Tarjetas virtuales
          </button>
        </nav>

        <select v-model="selectedCategory" class="category-select" aria-label="Filtrar por categoría">
          <option value="ALL">Todas las categorías</option>
          <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
            {{ cat.icon }} {{ cat.label }}
          </option>
        </select>
      </div>

      <!-- Sub-filtro opcional por tarjeta virtual cuando la pestaña Tarjetas virtuales está activa -->
      <nav
        v-if="selectedId === CARDS && cards.length > 0"
        class="subfilters"
        aria-label="Filtrar por tarjeta virtual"
      >
        <button
          type="button"
          class="subchip"
          :class="{ 'subchip--active': selectedCardId === ALL_CARDS }"
          @click="selectCardFilter(ALL_CARDS)"
        >
          Todas las tarjetas ({{ cards.length }})
        </button>
        <button
          v-for="card in cards"
          :key="card.id"
          type="button"
          class="subchip"
          :class="{ 'subchip--active': selectedCardId === card.id }"
          @click="selectCardFilter(card.id)"
        >
          •••• {{ card.last4 }}<template v-if="card.cardholderName"> · {{ card.cardholderName }}</template>
        </button>
      </nav>

      <section class="movements" aria-label="Movimientos">
        <h2 class="movements__title">
          Movimientos <small>· {{ sectionSubtitle }}</small>
        </h2>
        <div v-if="movementsLoading" class="empty">Cargando movimientos…</div>
        <div v-else-if="filteredMovements.length === 0" class="empty">
          {{ selectedId === CARDS ? 'Aún no hay movimientos realizados con tarjetas virtuales.' : 'Aún no hay movimientos con este filtro.' }}
        </div>
        <ul v-else class="movements__list">
          <li v-for="m in filteredMovements" :key="m.id" class="movement">
            <div class="movement__icon" :class="isCredit(m) ? 'movement__icon--in' : 'movement__icon--out'">
              {{ isCredit(m) ? '↓' : resolveMovementCategory(m).icon }}
            </div>
            <div class="movement__info">
              <div class="movement__top">
                <span class="movement__label">{{ formatMovementLabel(m, typeLabel[m.type]) }}</span>
                <span
                  v-if="!isCredit(m)"
                  class="movement__cat"
                  :style="{
                    color: resolveMovementCategory(m).color,
                    background: resolveMovementCategory(m).color + '1a',
                    borderColor: resolveMovementCategory(m).color + '44',
                  }"
                >
                  {{ resolveMovementCategory(m).label }}
                </span>
              </div>
              <span class="movement__date">
                {{ formatDate(m.createdAt) }}
                <template v-if="cardLabelForMovement(m)"> · 💳 {{ cardLabelForMovement(m) }}</template>
                <template v-if="selectedId === ALL"> · {{ accountName(m.accountId) }}</template>
              </span>
            </div>
            <div class="movement__amounts">
              <span :class="isCredit(m) ? 'amount--in' : 'amount--out'">
                {{ isCredit(m) ? '+' : '−' }}{{ money(m.amount) }}
              </span>
              <span class="movement__after">Saldo {{ money(m.balanceAfter) }}</span>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
// Vista de transacciones y movimientos
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { accountService } from '@/services/accountService';
import { api } from '@/services/api';
import type { Account, AccountMovement, AccountMovementType } from '@/types/accounts';
import { formatAmount } from '@/utils/numberFormat';
import {
  ALL_SPENDING_CATEGORIES,
  CARD_SPENDING_CATEGORIES,
  resolveMovementCategory,
  formatMovementLabel,
  extractCardPaymentInfo,
  isCardMovement,
} from '@/utils/spendingCategories';

interface CardSummary {
  id: string;
  last4: string;
  cardholderName: string;
}

const ALL = 'all';
const CARDS = 'cards';
const ALL_CARDS = 'all';

const route = useRoute();
const router = useRouter();
const accounts = ref<Account[]>([]);
const cards = ref<CardSummary[]>([]);
const movements = ref<AccountMovement[]>([]);
const selectedId = ref<string>(ALL);
const selectedCardId = ref<string>(ALL_CARDS);
const selectedCategory = ref<string>('ALL');
const loading = ref(true);
const movementsLoading = ref(false);
const error = ref('');

const typeLabel: Record<AccountMovementType, string> = {
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Retiro',
  TRANSFER_IN: 'Transferencia recibida',
  TRANSFER_OUT: 'Transferencia enviada',
  INTEREST: 'Intereses mensuales',
};

const money = (value: number) => '$' + formatAmount(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

const isCredit = (m: AccountMovement) => ['DEPOSIT', 'TRANSFER_IN', 'INTEREST'].includes(m.type);

const selected = computed(() => accounts.value.find((a) => a.id === selectedId.value));
const selectedCard = computed(() => cards.value.find((c) => c.id === selectedCardId.value));
const accountName = (id: string) => accounts.value.find((a) => a.id === id)?.name ?? '';

const availableCategories = computed(() =>
  selectedId.value === CARDS ? CARD_SPENDING_CATEGORIES : ALL_SPENDING_CATEGORIES
);

const sectionSubtitle = computed(() => {
  if (selectedId.value === CARDS) {
    if (selectedCard.value) {
      return `Tarjeta •••• ${selectedCard.value.last4}`;
    }
    return 'Tarjetas virtuales';
  }
  return selected.value?.name ?? 'Todas las cuentas';
});

const cardLabelForMovement = (m: AccountMovement): string | null => {
  const info = extractCardPaymentInfo(m);
  if (!info) return null;
  const found = cards.value.find((c) => c.id === info.cardId);
  if (found) return `•••• ${found.last4}`;
  return `•••• ${info.cardId.slice(-4)}`;
};

const filteredMovements = computed(() => {
  let list = movements.value;

  if (selectedId.value === CARDS) {
    list = list.filter((m) => {
      const info = extractCardPaymentInfo(m);
      if (!info) return false;
      if (selectedCardId.value !== ALL_CARDS && info.cardId !== selectedCardId.value) {
        return false;
      }
      return true;
    });
  }

  if (selectedCategory.value !== 'ALL') {
    list = list.filter(
      (m) => !isCredit(m) && resolveMovementCategory(m).id === selectedCategory.value
    );
  }

  return list;
});

const errorMessage = (e: any) => e?.response?.data?.message ?? 'No se pudieron cargar los movimientos';

async function loadMovements(id: string) {
  movementsLoading.value = true;
  error.value = '';
  try {
    if (id === ALL || id === CARDS) {
      const lists = await Promise.all(accounts.value.map((a) => accountService.movements(a.id)));
      const merged = lists
        .flat()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      movements.value = id === CARDS ? merged.filter(isCardMovement) : merged;
    } else {
      movements.value = await accountService.movements(id);
    }
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    movementsLoading.value = false;
  }
}

function syncUrl(accountFilter: string, cardFilter: string) {
  const query: Record<string, string> = {};
  if (accountFilter !== ALL) query.account = accountFilter;
  if (accountFilter === CARDS && cardFilter !== ALL_CARDS) query.card = cardFilter;

  const curAccount = typeof route.query.account === 'string' ? route.query.account : undefined;
  const curCard = typeof route.query.card === 'string' ? route.query.card : undefined;
  if (curAccount !== query.account || curCard !== query.card) {
    router.replace({ path: '/transactions', query });
  }
}

async function selectAccount(id: string) {
  selectedId.value = id;
  if (id !== CARDS) {
    selectedCardId.value = ALL_CARDS;
  } else if (
    selectedCategory.value !== 'ALL' &&
    !CARD_SPENDING_CATEGORIES.some((c) => c.id === selectedCategory.value)
  ) {
    selectedCategory.value = 'ALL';
  }
  syncUrl(id, selectedCardId.value);
  await loadMovements(id);
}

function selectCardFilter(cardId: string) {
  selectedCardId.value = cardId;
  syncUrl(selectedId.value, cardId);
}

function resolveInitialAccount(param: unknown): string {
  if (param === CARDS) return CARDS;
  if (typeof param === 'string' && accounts.value.some((a) => a.id === param)) return param;
  return ALL;
}

watch(
  () => [route.query.account, route.query.card] as const,
  ([accountParam, cardParam]) => {
    if (loading.value) return;
    const nextAccount = resolveInitialAccount(accountParam);
    const nextCard =
      nextAccount === CARDS && typeof cardParam === 'string' && cards.value.some((c) => c.id === cardParam)
        ? cardParam
        : ALL_CARDS;

    selectedCardId.value = nextCard;
    if (nextAccount !== selectedId.value) {
      selectedId.value = nextAccount;
      loadMovements(nextAccount);
    }
  }
);

onMounted(async () => {
  try {
    const [accList, cardResp] = await Promise.all([
      accountService.list(),
      api.get<any[]>('/cards').catch(() => ({ data: [] })),
    ]);
    accounts.value = accList;
    cards.value = (Array.isArray(cardResp.data) ? cardResp.data : []).map((c: any) => {
      const masked = String(c.tokenizedPan || c.maskedNumber || c.id || '');
      return {
        id: String(c.id),
        last4: masked.slice(-4) || '0000',
        cardholderName: String(c.cardholderName || c.cardholder_name || '').trim(),
      };
    });

    const initialAccount = resolveInitialAccount(route.query.account);
    if (
      initialAccount === CARDS &&
      typeof route.query.card === 'string' &&
      cards.value.some((c) => c.id === route.query.card)
    ) {
      selectedCardId.value = route.query.card;
    }
    await selectAccount(initialAccount);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.transactions-view { padding: 1.5rem; color: #e5e7eb; max-width: 1100px; margin: 0 auto; }
.tx-header { margin-bottom: 1.25rem; }
.page-title { font-size: 1.6rem; font-weight: 700; color: #f0f4ff; margin: 0 0 0.35rem; }
.page-description { color: rgba(255,255,255,0.5); font-size: 0.95rem; margin: 0; }

.banner { padding: 0.7rem 1rem; border-radius: 10px; font-size: 0.875rem; margin: 0 0 1rem; }
.banner--error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: #fca5a5; }

.empty { padding: 2rem; text-align: center; color: rgba(255,255,255,0.4); }

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.85rem; }
.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chip { border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); color: #e5e7eb; border-radius: 999px; padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s; }
.chip:hover { background: rgba(255,255,255,0.12); }
.chip--cards { border-color: rgba(96,165,250,0.3); }
.chip--active { border-color: #00e5c0; color: #5eead4; background: rgba(0,229,192,0.1); }

.subfilters { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; padding: 0.55rem 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }
.subchip { border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.65); border-radius: 999px; padding: 0.28rem 0.7rem; font-size: 0.73rem; font-weight: 600; cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s; }
.subchip:hover { color: #fff; border-color: rgba(255,255,255,0.22); }
.subchip--active { border-color: #60a5fa; color: #93c5fd; background: rgba(59,130,246,0.15); }

.category-select {
  background: #131a26;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 999px;
  color: #e5e7eb;
  padding: 0.4rem 0.9rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.category-select:focus { outline: none; border-color: #00e5c0; }

.movements { background: #131a26; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.25rem; }
.movements__title { margin: 0 0 1rem; font-size: 1.05rem; color: #f0f4ff; }
.movements__title small { color: rgba(255,255,255,0.45); font-weight: 400; }
.movements__list { list-style: none; margin: 0; padding: 0; }
.movement { display: flex; align-items: center; gap: 0.9rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.movement:last-child { border-bottom: none; }
.movement__icon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
.movement__icon--in { background: rgba(0,229,192,0.15); color: #00e5c0; }
.movement__icon--out { background: rgba(248,113,113,0.12); color: #f87171; font-size: 0.95rem; }
.movement__info { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 0.15rem; }
.movement__top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.movement__label { font-size: 0.9rem; color: #e5e7eb; }
.movement__cat { font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 999px; border: 1px solid transparent; }
.movement__date { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
.movement__amounts { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.amount--in { color: #00e5c0; font-weight: 700; }
.amount--out { color: #f87171; font-weight: 700; }
.movement__after { font-size: 0.72rem; color: rgba(255,255,255,0.4); }
</style>
