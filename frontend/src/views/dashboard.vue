<template>
  <div class="dashboard">

    <!-- ===== GREETING ===== -->
    <section class="dashboard__greeting">
      <div class="greeting__text">
        <p class="greeting__sub">{{ greetingLabel }}, 👋</p>
        <h1 class="greeting__name">{{ authStore.user?.preferredName || `${authStore.user?.firstName ?? ''} ${authStore.user?.lastName ?? ''}`.trim() || 'Usuario' }}</h1>
        <p class="greeting__date">{{ currentDate }}</p>
      </div>
      <router-link to="/cards" class="greeting__cta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Nueva tarjeta
      </router-link>
    </section>

    <!-- ===== BALANCE CARDS ROW ===== -->
    <section class="stat-grid">
      <!-- Main balance hero -->
      <div class="balance-hero">
        <div class="balance-hero__orb orb-a"></div>
        <div class="balance-hero__orb orb-b"></div>
        <div class="balance-hero__body">
          <span class="balance-hero__label">Saldo total disponible</span>
          <div class="balance-hero__amount">
            <span class="balance-hero__currency">{{ walletData.currency }}</span>
            <span class="balance-hero__number">{{ formatAmount(walletData.balance) }}</span>
          </div>
          <div class="balance-hero__change" :class="walletData.change >= 0 ? 'positive' : 'negative'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path v-if="walletData.change >= 0" d="M5 15l7-7 7 7" stroke-linecap="round" stroke-linejoin="round" />
              <path v-else d="M5 9l7 7 7-7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ Math.abs(walletData.change) }}% este mes
          </div>
          <div class="balance-hero__actions">
            <router-link to="/wallet" class="hero-btn hero-btn--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Depositar
            </router-link>
            <router-link to="/transactions" class="hero-btn hero-btn--ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Transferir
            </router-link>
          </div>
        </div>
        <!-- mini chart area -->
        <div class="balance-hero__chart">
          <svg viewBox="0 0 200 80" preserveAspectRatio="none" class="sparkline">
            <defs>
              <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#00e5c0" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#00e5c0" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 60 C20 55, 30 30, 50 35 S80 20, 100 25 S140 10, 160 15 S185 8, 200 5" stroke="#00e5c0" stroke-width="2" fill="none" />
            <path d="M0 60 C20 55, 30 30, 50 35 S80 20, 100 25 S140 10, 160 15 S185 8, 200 5 L200 80 L0 80 Z" fill="url(#spark-grad)" />
          </svg>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="quick-stats">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round" />
            </svg>
          </div>
          <div class="stat-card__info">
            <span class="stat-card__label">Ingresos del mes</span>
            <span class="stat-card__value">+$3,420</span>
            <span class="stat-card__sub positive">▲ 12.4%</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M20 12V8H4v4M4 8l8-4 8 4" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M4 12v8h16v-8" stroke-linecap="round" />
            </svg>
          </div>
          <div class="stat-card__info">
            <span class="stat-card__label">Gastos del mes</span>
            <span class="stat-card__value">-$1,280</span>
            <span class="stat-card__sub negative">▼ 5.1%</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <path d="M2 10h20" />
              <path d="M6 15h4" stroke-linecap="round" />
            </svg>
          </div>
          <div class="stat-card__info">
            <span class="stat-card__label">Tarjetas activas</span>
            <span class="stat-card__value">{{ activeCards }}</span>
            <span class="stat-card__sub neutral">de {{ totalCards }} emitidas</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== VIRTUAL CARDS CAROUSEL + TRANSACTIONS ===== -->
    <section class="mid-grid">
      <!-- Virtual Cards -->
      <div class="cards-panel">
        <div class="panel-header">
          <h2 class="panel-title">Mis Tarjetas</h2>
          <router-link to="/cards" class="panel-link">Ver todas →</router-link>
        </div>

        <div v-if="loading" class="cards-carousel cards-carousel--loading">
          <div class="card-skeleton" v-for="n in 2" :key="n"></div>
        </div>

        <div v-else-if="cards.length === 0" class="cards-empty">
          <div class="cards-empty__icon">💳</div>
          <p>No tienes tarjetas emitidas aún</p>
          <router-link to="/cards" class="hero-btn hero-btn--primary">Emitir primera tarjeta</router-link>
        </div>

        <div v-else class="cards-carousel" :style="{ '--card-offset': cardOffset + 'px' }">
          <div
            v-for="(card, i) in cards.slice(0, 3)"
            :key="card.id"
            class="virtual-card"
            :class="[`virtual-card--${cardThemes[i % cardThemes.length]}`, { 'virtual-card--active': activeCardIdx === i }]"
            @click="activeCardIdx = i"
          >
            <div class="vc-top">
              <img :src="logo" alt="NOVA" class="vc-logo" />
              <span class="vc-status" :class="`vc-status--${card.status.toLowerCase()}`">
                {{ card.status === 'ACTIVE' ? 'Activa' : card.status === 'FROZEN' ? 'Congelada' : 'Cancelada' }}
              </span>
            </div>
            <div class="vc-pan">{{ card.tokenizedPan }}</div>
            <div class="vc-bottom">
              <div class="vc-info">
                <span class="vc-info__label">Vence</span>
                <span class="vc-info__value">{{ card.expirationDate }}</span>
              </div>
              <div class="vc-info">
                <span class="vc-info__label">Límite diario</span>
                <span class="vc-info__value">
                  {{ card.spendingRules.dailyLimit ? '$' + card.spendingRules.dailyLimit.toLocaleString() : 'Sin límite' }}
                </span>
              </div>
              <div class="vc-chip">
                <div class="vc-chip__lines">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dots navigation -->
        <div class="cards-dots" v-if="cards.length > 1">
          <button
            v-for="(_, i) in cards.slice(0, 3)"
            :key="i"
            class="cards-dot"
            :class="{ 'cards-dot--active': activeCardIdx === i }"
            @click="activeCardIdx = i"
          ></button>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="transactions-panel">
        <div class="panel-header">
          <h2 class="panel-title">Movimientos recientes</h2>
          <router-link to="/transactions" class="panel-link">Ver todos →</router-link>
        </div>

        <div v-if="loading" class="txn-skeleton-list">
          <div class="txn-skeleton" v-for="n in 5" :key="n"></div>
        </div>

        <div v-else-if="transactions.length === 0" class="txn-empty">
          <span>No hay movimientos registrados</span>
        </div>

        <ul v-else class="txn-list">
          <li v-for="txn in transactions.slice(0, 6)" :key="txn.id" class="txn-item">
            <div class="txn-icon" :class="`txn-icon--${txnColor(txn)}`">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path v-if="txn.type === 'DEPOSIT'" d="M12 5v14M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round" />
                <path v-else-if="txn.type === 'WITHDRAWAL' || txn.type === 'CARD_PAYMENT'" d="M12 19V5M5 12l7 7 7-7" stroke-linecap="round" stroke-linejoin="round" />
                <path v-else d="M7 16l-4-4m0 0l4-4m-4 4h14" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="txn-details">
              <span class="txn-name">{{ txn.merchantName || txnTypeLabel(txn.type) }}</span>
              <span class="txn-date">{{ formatDate(txn.createdAt) }}</span>
            </div>
            <div class="txn-amount" :class="txn.type === 'DEPOSIT' ? 'txn-amount--credit' : 'txn-amount--debit'">
              {{ txn.type === 'DEPOSIT' ? '+' : '-' }}{{ txn.currency }} {{ formatAmount(txn.amount) }}
            </div>
            <div class="txn-status" :class="`txn-status--${txn.status.toLowerCase()}`">
              {{ statusLabel(txn.status) }}
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- ===== SPENDING BREAKDOWN ===== -->
    <section class="bottom-grid">
      <div class="spending-panel">
        <div class="panel-header">
          <h2 class="panel-title">Distribución de gastos</h2>
          <span class="panel-link">Este mes</span>
        </div>
        <div class="spending-list">
          <div v-for="cat in spendingCategories" :key="cat.name" class="spending-item">
            <div class="spending-item__icon" :style="{ background: cat.color + '22', color: cat.color }">{{ cat.icon }}</div>
            <div class="spending-item__info">
              <span class="spending-item__name">{{ cat.name }}</span>
              <div class="spending-item__bar-wrap">
                <div class="spending-item__bar" :style="{ width: cat.pct + '%', background: cat.color }"></div>
              </div>
            </div>
            <span class="spending-item__pct">{{ cat.pct }}%</span>
          </div>
        </div>
      </div>

      <div class="activity-panel">
        <div class="panel-header">
          <h2 class="panel-title">Actividad semanal</h2>
          <span class="panel-link">Últimos 7 días</span>
        </div>
        <div class="bar-chart">
          <div v-for="(bar, i) in weeklyActivity" :key="i" class="bar-chart__col">
            <div class="bar-chart__bar-wrap">
              <div
                class="bar-chart__bar"
                :style="{ height: bar.pct + '%' }"
                :class="{ 'bar-chart__bar--highlight': bar.today }"
              ></div>
            </div>
            <span class="bar-chart__label">{{ bar.day }}</span>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import type { VirtualCard } from '@/types/cards';
import type { Transaction } from '@/types/transactions';
import { api } from '@/services/api';
import logo from '@/assets/LOGONOVA.png';

const authStore = useAuthStore();

const loading = ref(true);
const cards = ref<VirtualCard[]>([]);
const transactions = ref<Transaction[]>([]);
const activeCardIdx = ref(0);
const cardOffset = computed(() => activeCardIdx.value * 0);

const cardThemes = ['teal', 'indigo', 'rose'];

// Wallet data (mock mientras no haya endpoint de resumen)
const walletData = ref({ currency: 'USD', balance: 8_420.50, change: 7.3 });
const activeCards = computed(() => cards.value.filter(c => c.status === 'ACTIVE').length);
const totalCards = computed(() => cards.value.length);

// Greeting
const greetingLabel = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
});

const currentDate = computed(() => {
  return new Intl.DateTimeFormat('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
});

// Spending categories (visual demo)
const spendingCategories = [
  { name: 'Restaurantes', icon: '🍔', pct: 38, color: '#f97316' },
  { name: 'Entretenimiento', icon: '🎮', pct: 25, color: '#8b5cf6' },
  { name: 'Viajes', icon: '✈️', pct: 20, color: '#00e5c0' },
  { name: 'Supermercado', icon: '🛒', pct: 12, color: '#2563eb' },
  { name: 'Otros', icon: '📦', pct: 5, color: '#6b7280' },
];

// Weekly activity
const weeklyActivity = [
  { day: 'Lun', pct: 45, today: false },
  { day: 'Mar', pct: 72, today: false },
  { day: 'Mié', pct: 30, today: false },
  { day: 'Jue', pct: 85, today: false },
  { day: 'Vie', pct: 60, today: false },
  { day: 'Sáb', pct: 90, today: false },
  { day: 'Hoy', pct: 55, today: true },
];

// Helpers
const formatAmount = (n: number) =>
  n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const txnTypeLabel = (type: string) => ({
  DEPOSIT: 'Depósito', WITHDRAWAL: 'Retiro',
  TRANSFER: 'Transferencia', CARD_PAYMENT: 'Pago con tarjeta',
  CURRENCY_EXCHANGE: 'Cambio de divisa',
}[type] ?? type);

const statusLabel = (s: string) => ({
  PENDING: 'Pendiente', COMPLETED: 'Completado',
  FAILED: 'Fallido', REJECTED_BY_RULE: 'Rechazado',
}[s] ?? s);

const txnColor = (txn: Transaction) => {
  if (txn.status === 'FAILED' || txn.status === 'REJECTED_BY_RULE') return 'red';
  if (txn.type === 'DEPOSIT') return 'green';
  return 'blue';
};

// Data fetch
onMounted(async () => {
  try {
    const [cardsRes, txnRes] = await Promise.allSettled([
      api.get<VirtualCard[]>('/cards'),
      api.get<Transaction[]>('/transactions'),
    ]);
    if (cardsRes.status === 'fulfilled') cards.value = cardsRes.value.data;
    if (txnRes.status === 'fulfilled') transactions.value = txnRes.value.data;
  } catch (_) {
    // Silencioso: si el backend no responde, mostramos vacío
  } finally {
    // Demo data si está vacío
    if (cards.value.length === 0) {
      cards.value = [
        { id: '1', walletId: 'w1', tokenizedPan: '**** **** **** 4231', expirationDate: '08/27', status: 'ACTIVE', spendingRules: { dailyLimit: 500, monthlyLimit: 3000, internationalAllowed: true, blockedCategories: [] }, issuedAt: new Date().toISOString() },
        { id: '2', walletId: 'w1', tokenizedPan: '**** **** **** 9810', expirationDate: '03/26', status: 'FROZEN', spendingRules: { dailyLimit: null, monthlyLimit: null, internationalAllowed: false, blockedCategories: [] }, issuedAt: new Date().toISOString() },
      ];
    }
    if (transactions.value.length === 0) {
      transactions.value = [
        { id: '1', walletId: 'w1', type: 'DEPOSIT', status: 'COMPLETED', amount: 1500, currency: 'USD', merchantName: 'Nómina Empresa', referenceCode: 'REF001', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', walletId: 'w1', type: 'CARD_PAYMENT', status: 'COMPLETED', amount: 45.99, currency: 'USD', merchantName: 'Netflix', referenceCode: 'REF002', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', walletId: 'w1', type: 'CARD_PAYMENT', status: 'COMPLETED', amount: 128.5, currency: 'USD', merchantName: 'Amazon', referenceCode: 'REF003', createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: '4', walletId: 'w1', type: 'TRANSFER', status: 'COMPLETED', amount: 200, currency: 'USD', merchantName: 'Juan García', referenceCode: 'REF004', createdAt: new Date(Date.now() - 259200000).toISOString() },
        { id: '5', walletId: 'w1', type: 'CARD_PAYMENT', status: 'REJECTED_BY_RULE', amount: 999, currency: 'USD', merchantName: 'Casino Online', referenceCode: 'REF005', createdAt: new Date(Date.now() - 345600000).toISOString() },
        { id: '6', walletId: 'w1', type: 'WITHDRAWAL', status: 'COMPLETED', amount: 300, currency: 'USD', merchantName: undefined, referenceCode: 'REF006', createdAt: new Date(Date.now() - 432000000).toISOString() },
      ];
    }
    loading.value = false;
  }
});
</script>

<style scoped>
/* ===== DASHBOARD ROOT ===== */
.dashboard {
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100%;
  color: #e5e7eb;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

/* ===== GREETING ===== */
.dashboard__greeting {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.greeting__sub {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.45);
  margin-bottom: 0.2rem;
}
.greeting__name {
  font-size: 1.75rem;
  font-weight: 800;
  color: #f0f4ff;
  line-height: 1.1;
  letter-spacing: -0.03em;
}
.greeting__date {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.35);
  margin-top: 0.25rem;
  text-transform: capitalize;
}
.greeting__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #00e5c0, #0ea5e9);
  color: #0a1220;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  text-decoration: none;
  box-shadow: 0 6px 24px rgba(0,229,192,0.3);
  transition: transform 0.15s, box-shadow 0.15s;
}
.greeting__cta:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,229,192,0.4); }
.greeting__cta svg { width: 16px; height: 16px; }

/* ===== STAT GRID ===== */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1.25rem;
}

/* Balance Hero */
.balance-hero {
  position: relative;
  background: linear-gradient(145deg, #0d2552 0%, #0a1a3c 60%, #0b3a5e 100%);
  border-radius: 20px;
  padding: 2rem;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border: 1px solid rgba(255,255,255,0.08);
}
.balance-hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.6;
  animation: float 8s ease-in-out infinite;
}
.orb-a { width: 260px; height: 260px; background: #00e5c0; top: -100px; right: -80px; }
.orb-b { width: 200px; height: 200px; background: #2563eb; bottom: -80px; left: -60px; animation-delay: -4s; }
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(20px) scale(1.05); }
}
.balance-hero__body { position: relative; z-index: 1; }
.balance-hero__label {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.balance-hero__amount {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin: 0.5rem 0;
}
.balance-hero__currency {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
}
.balance-hero__number {
  font-size: 3rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.04em;
  line-height: 1;
}
.balance-hero__change {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  margin-bottom: 1.5rem;
}
.balance-hero__change svg { width: 14px; height: 14px; }
.positive { background: rgba(0,229,192,0.18); color: #00e5c0; }
.negative { background: rgba(239,68,68,0.18); color: #f87171; }
.neutral  { color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.07); }
.balance-hero__actions { display: flex; gap: 0.75rem; }
.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.825rem;
  font-weight: 600;
  padding: 0.55rem 1.1rem;
  border-radius: 9px;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;
  border: none;
}
.hero-btn svg { width: 14px; height: 14px; }
.hero-btn--primary {
  background: #00e5c0;
  color: #0a1220;
  box-shadow: 0 4px 16px rgba(0,229,192,0.35);
}
.hero-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,229,192,0.45); }
.hero-btn--ghost {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.15);
}
.hero-btn--ghost:hover { background: rgba(255,255,255,0.18); }

.balance-hero__chart {
  position: relative;
  z-index: 1;
  width: 200px;
  height: 80px;
  align-self: flex-end;
  opacity: 0.75;
}
.sparkline { width: 100%; height: 100%; }

/* Quick Stats */
.quick-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.stat-card {
  background: #131b2a;
  border-radius: 16px;
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255,255,255,0.06);
  transition: transform 0.15s;
}
.stat-card:hover { transform: translateX(3px); }
.stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-card__icon svg { width: 20px; height: 20px; }
.stat-card__icon--green { background: rgba(0,229,192,0.12); color: #00e5c0; }
.stat-card__icon--red   { background: rgba(239,68,68,0.12); color: #f87171; }
.stat-card__icon--blue  { background: rgba(37,99,235,0.15); color: #60a5fa; }
.stat-card__info { display: flex; flex-direction: column; gap: 2px; }
.stat-card__label { font-size: 0.72rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; }
.stat-card__value { font-size: 1.15rem; font-weight: 800; color: #f0f4ff; }
.stat-card__sub { font-size: 0.72rem; font-weight: 600; }

/* ===== MID GRID ===== */
.mid-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1.25rem;
}

/* Panel common */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.panel-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f0f4ff;
}
.panel-link {
  font-size: 0.78rem;
  color: #00e5c0;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
}
.panel-link:hover { text-decoration: underline; }

/* Cards Panel */
.cards-panel {
  background: #131b2a;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.06);
}

/* Virtual Card */
.cards-carousel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.virtual-card {
  position: relative;
  border-radius: 18px;
  padding: 1.25rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  min-height: 148px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.virtual-card:hover { transform: translateY(-2px); }
.virtual-card--active { box-shadow: 0 0 0 2px #00e5c0, 0 16px 40px rgba(0,0,0,0.35); }

.virtual-card--teal {
  background: linear-gradient(135deg, #0d4f46 0%, #064e3b 50%, #0b3a5e 100%);
}
.virtual-card--indigo {
  background: linear-gradient(135deg, #1e1b4b 0%, #1d2c6b 50%, #312e81 100%);
}
.virtual-card--rose {
  background: linear-gradient(135deg, #4c0519 0%, #881337 50%, #9d174d 100%);
}

/* Glow overlay */
.virtual-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 20%, rgba(255,255,255,0.08), transparent 60%);
  pointer-events: none;
}

.vc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.vc-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(255,255,255,0.9);
  padding: 2px;
}
.vc-status {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.vc-status--active   { background: rgba(0,229,192,0.2); color: #00e5c0; }
.vc-status--frozen   { background: rgba(96,165,250,0.2); color: #60a5fa; }
.vc-status--cancelled { background: rgba(239,68,68,0.2); color: #f87171; }

.vc-pan {
  font-family: 'Courier New', monospace;
  font-size: 1.05rem;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.12em;
  margin: 0.5rem 0;
}
.vc-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.vc-info { display: flex; flex-direction: column; }
.vc-info__label { font-size: 0.6rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; }
.vc-info__value { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.85); }
.vc-chip {
  width: 32px;
  height: 24px;
  background: linear-gradient(135deg, #f5cc5a, #d4a017);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vc-chip__lines { display: flex; flex-direction: column; gap: 3px; }
.vc-chip__lines span { display: block; width: 18px; height: 1.5px; background: rgba(0,0,0,0.35); border-radius: 2px; }

/* Dots */
.cards-dots { display: flex; gap: 6px; justify-content: center; margin-top: 0.75rem; }
.cards-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: none; cursor: pointer;
  transition: background 0.15s, width 0.15s;
}
.cards-dot--active { background: #00e5c0; width: 18px; border-radius: 3px; }

/* Skeleton */
.card-skeleton {
  height: 140px;
  border-radius: 18px;
  background: linear-gradient(90deg, #1a2436 25%, #223048 50%, #1a2436 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Empty */
.cards-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: rgba(255,255,255,0.3);
  text-align: center;
  font-size: 0.875rem;
}
.cards-empty__icon { font-size: 2.5rem; }

/* ===== TRANSACTIONS ===== */
.transactions-panel {
  background: #131b2a;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.06);
}
.txn-list { list-style: none; display: flex; flex-direction: column; gap: 0.25rem; }
.txn-item {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
  transition: background 0.12s;
}
.txn-item:hover { background: rgba(255,255,255,0.04); }
.txn-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.txn-icon svg { width: 16px; height: 16px; }
.txn-icon--green { background: rgba(0,229,192,0.12); color: #00e5c0; }
.txn-icon--blue  { background: rgba(37,99,235,0.12); color: #60a5fa; }
.txn-icon--red   { background: rgba(239,68,68,0.12); color: #f87171; }
.txn-details { display: flex; flex-direction: column; min-width: 0; }
.txn-name { font-size: 0.85rem; font-weight: 600; color: #e5e7eb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.txn-date { font-size: 0.72rem; color: rgba(255,255,255,0.35); }
.txn-amount { font-size: 0.85rem; font-weight: 700; white-space: nowrap; }
.txn-amount--credit { color: #00e5c0; }
.txn-amount--debit  { color: #e5e7eb; }
.txn-status {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.18rem 0.5rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.txn-status--completed      { background: rgba(0,229,192,0.12); color: #00e5c0; }
.txn-status--pending        { background: rgba(250,204,21,0.12); color: #fbbf24; }
.txn-status--failed         { background: rgba(239,68,68,0.12); color: #f87171; }
.txn-status--rejected_by_rule { background: rgba(239,68,68,0.12); color: #f87171; }

.txn-skeleton { height: 54px; border-radius: 12px; background: linear-gradient(90deg, #1a2436 25%, #223048 50%, #1a2436 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; margin-bottom: 6px; }
.txn-empty { text-align: center; color: rgba(255,255,255,0.3); font-size: 0.875rem; padding: 2rem; }

/* ===== BOTTOM GRID ===== */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

/* Spending Panel */
.spending-panel {
  background: #131b2a;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.06);
}
.spending-list { display: flex; flex-direction: column; gap: 0.9rem; }
.spending-item { display: flex; align-items: center; gap: 0.875rem; }
.spending-item__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.spending-item__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.spending-item__name { font-size: 0.8rem; font-weight: 600; color: #d1d5db; }
.spending-item__bar-wrap { height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
.spending-item__bar { height: 100%; border-radius: 3px; transition: width 1s cubic-bezier(.4,0,.2,1); }
.spending-item__pct { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.45); min-width: 32px; text-align: right; }

/* Activity Panel */
.activity-panel {
  background: #131b2a;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.06);
}
.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
  height: 130px;
  padding-top: 0.5rem;
}
.bar-chart__col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
}
.bar-chart__bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.bar-chart__bar {
  width: 100%;
  max-width: 28px;
  border-radius: 6px 6px 3px 3px;
  background: rgba(255,255,255,0.1);
  transition: height 1s cubic-bezier(.4,0,.2,1);
  min-height: 6px;
}
.bar-chart__bar--highlight { background: linear-gradient(180deg, #00e5c0, #0ea5e9); box-shadow: 0 0 14px rgba(0,229,192,0.4); }
.bar-chart__label { font-size: 0.65rem; color: rgba(255,255,255,0.35); font-weight: 600; }

/* ===== RESPONSIVE ===== */
@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: 1fr; }
  .quick-stats { flex-direction: row; }
  .stat-card { flex: 1; }
}
@media (max-width: 900px) {
  .mid-grid { grid-template-columns: 1fr; }
  .bottom-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .dashboard { padding: 1rem; }
  .quick-stats { flex-direction: column; }
  .balance-hero__number { font-size: 2.2rem; }
  .balance-hero__chart { display: none; }
}
</style>
