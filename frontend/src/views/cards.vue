<template>
  <div class="cards-view">

    <!-- ===== HEADER ===== -->
    <section class="cards-header">
      <div class="cards-header__text">
        <h1 class="cards-header__title">Tarjetas Virtuales</h1>
        <p class="cards-header__sub">Emisión de tarjetas virtuales y control de límites por categoría.</p>
      </div>
      <button class="btn-issue" @click="openIssueModal" id="btn-issue-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Emitir tarjeta
      </button>
    </section>

    <!-- ===== STATS ROW ===== -->
    <section class="stats-row">
      <div class="mini-stat">
        <div class="mini-stat__icon mini-stat__icon--teal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <path d="M2 10h20" /><path d="M6 15h4" stroke-linecap="round" />
          </svg>
        </div>
        <div class="mini-stat__info">
          <span class="mini-stat__label">Total emitidas</span>
          <span class="mini-stat__value">{{ cards.length }}</span>
        </div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat__icon mini-stat__icon--green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div class="mini-stat__info">
          <span class="mini-stat__label">Activas</span>
          <span class="mini-stat__value">{{ activeCount }}</span>
        </div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat__icon mini-stat__icon--blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
        <div class="mini-stat__info">
          <span class="mini-stat__label">Congeladas</span>
          <span class="mini-stat__value">{{ frozenCount }}</span>
        </div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat__icon mini-stat__icon--orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div class="mini-stat__info">
          <span class="mini-stat__label">Gasto mensual</span>
          <span class="mini-stat__value">${{ formatAmount(monthlySpend) }}</span>
        </div>
      </div>
    </section>

    <!-- ===== MAIN GRID ===== -->
    <section class="cards-grid">

      <!-- LEFT: Card showcase -->
      <div class="showcase-panel">
        <div class="panel-head">
          <h2 class="panel-head__title">Mis Tarjetas</h2>
          <div class="filter-tabs">
            <button
              v-for="tab in filterTabs"
              :key="tab.value"
              class="filter-tab"
              :class="{ 'filter-tab--active': activeFilter === tab.value }"
              @click="activeFilter = tab.value"
            >{{ tab.label }}</button>
          </div>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="card-list">
          <div class="card-skeleton" v-for="n in 3" :key="n"></div>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredCards.length === 0" class="empty-state">
          <div class="empty-state__icon">💳</div>
          <p class="empty-state__title">{{ cards.length === 0 ? 'Sin tarjetas virtuales' : 'No hay tarjetas con este filtro' }}</p>
          <p class="empty-state__text">
            {{ cards.length === 0 ? 'No tienes tarjetas emitidas aún. Crea una desde cero con tus propios límites.' : 'Prueba cambiando de pestaña para ver otras tarjetas.' }}
          </p>
          <button v-if="cards.length === 0" class="btn-issue btn-issue--sm" @click="openIssueModal" id="btn-issue-first">
            Emitir primera tarjeta
          </button>
        </div>

        <!-- Card list -->
        <div v-else class="card-list">
          <div
            v-for="(card, i) in filteredCards"
            :key="card.id"
            class="vcard"
            :class="[
              `vcard--${themes[i % themes.length]}`,
              { 'vcard--selected': selectedCard?.id === card.id },
              { 'vcard--frozen': card.status === 'FROZEN' },
              { 'vcard--cancelled': card.status === 'CANCELLED' }
            ]"
            @click="selectedCard = card"
          >
            <!-- Frost overlay for frozen cards -->
            <div v-if="card.status === 'FROZEN'" class="vcard__frost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2v20M17 7l-10 10M7 7l10 10M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke-linecap="round" />
              </svg>
            </div>

            <div class="vcard__top">
              <img :src="logo" alt="NOVA" class="vcard__logo" />
              <span class="vcard__badge" :class="`vcard__badge--${card.status.toLowerCase()}`">
                {{ statusLabel(card.status) }}
              </span>
            </div>
            <div class="vcard__pan">{{ card.tokenizedPan }}</div>
            <div class="vcard__holder" v-if="card.cardholderName">{{ card.cardholderName }}</div>
            <div class="vcard__bottom">
              <div class="vcard__field">
                <span class="vcard__field-label">Vence</span>
                <span class="vcard__field-value">{{ card.expirationDate }}</span>
              </div>
              <div class="vcard__field">
                <span class="vcard__field-label">Límite mensual</span>
                <span class="vcard__field-value">
                  {{ card.spendingRules.monthlyLimit ? '$' + card.spendingRules.monthlyLimit.toLocaleString() : (card.spendingRules.dailyLimit ? '$' + card.spendingRules.dailyLimit.toLocaleString() + '/d' : 'Sin límite') }}
                </span>
              </div>
              <div class="vcard__chip">
                <div class="vcard__chip-lines"><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Card detail & actions -->
      <div class="detail-panel">
        <!-- No card selected -->
        <div v-if="!selectedCard" class="detail-empty">
          <div class="detail-empty__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <path d="M2 10h20" /><path d="M6 15h4" stroke-linecap="round" />
            </svg>
          </div>
          <p class="detail-empty__title">{{ cards.length === 0 ? 'Panel de Tarjetas' : 'Selecciona una tarjeta' }}</p>
          <p class="detail-empty__text">
            {{ cards.length === 0 ? 'Aquí podrás administrar los límites, compras y seguridad de tu tarjeta una vez que la emitas.' : 'Haz clic en una tarjeta de la lista para ver sus detalles.' }}
          </p>
          <button v-if="cards.length === 0" class="btn-issue btn-issue--sm" @click="openIssueModal">
            Emitir tarjeta ahora
          </button>
        </div>

        <!-- Card selected -->
        <template v-else>
          <!-- Detail header -->
          <div class="detail-header">
            <div class="detail-header__info">
              <h3 class="detail-header__title">{{ selectedCard.cardholderName || 'Detalles de Tarjeta' }}</h3>
              <span class="detail-header__pan">{{ selectedCard.tokenizedPan }}</span>
            </div>
            <span class="detail-header__badge" :class="`detail-header__badge--${selectedCard.status.toLowerCase()}`">
              {{ statusLabel(selectedCard.status) }}
            </span>
          </div>

          <!-- Quick actions -->
          <div class="quick-actions">
            <button
              v-if="selectedCard.status === 'ACTIVE'"
              class="action-btn action-btn--freeze"
              @click="toggleFreeze(selectedCard)"
              id="btn-freeze-card"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 7l-10 10M7 7l10 10" stroke-linecap="round" />
              </svg>
              Congelar
            </button>
            <button
              v-if="selectedCard.status === 'FROZEN'"
              class="action-btn action-btn--unfreeze"
              @click="toggleFreeze(selectedCard)"
              id="btn-unfreeze-card"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83" stroke-linecap="round" />
              </svg>
              Descongelar
            </button>
            <button
              v-if="selectedCard.status !== 'CANCELLED'"
              class="action-btn action-btn--limits"
              @click="openLimitsModal(selectedCard)"
              id="btn-edit-limits"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              Límites
            </button>
            <button
              v-if="selectedCard.status !== 'CANCELLED'"
              class="action-btn action-btn--cancel"
              @click="cancelCard(selectedCard)"
              id="btn-cancel-card"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round" />
              </svg>
              Cancelar
            </button>
            <button
              class="action-btn action-btn--delete"
              @click="deleteCard(selectedCard)"
              id="btn-delete-card"
              title="Eliminar tarjeta"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Eliminar
            </button>
          </div>

          <!-- Spending rules info -->
          <div class="rules-panel">
            <h4 class="rules-panel__title">Reglas de gasto</h4>
            <div class="rules-grid">
              <div class="rule-item">
                <span class="rule-item__label">Límite diario</span>
                <span class="rule-item__value">
                  {{ selectedCard.spendingRules.dailyLimit ? '$' + selectedCard.spendingRules.dailyLimit.toLocaleString() : 'Sin límite' }}
                </span>
              </div>
              <div class="rule-item">
                <span class="rule-item__label">Límite mensual</span>
                <span class="rule-item__value">
                  {{ selectedCard.spendingRules.monthlyLimit ? '$' + selectedCard.spendingRules.monthlyLimit.toLocaleString() : 'Sin límite' }}
                </span>
              </div>
              <div class="rule-item">
                <span class="rule-item__label">Internacional</span>
                <span class="rule-item__value" :class="selectedCard.spendingRules.internationalAllowed ? 'rule-item__value--ok' : 'rule-item__value--no'">
                  {{ selectedCard.spendingRules.internationalAllowed ? 'Permitido' : 'Bloqueado' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card info -->
          <div class="info-panel">
            <h4 class="info-panel__title">Información</h4>
            <div class="info-rows">
              <div class="info-row" v-if="selectedCard.cardholderName">
                <span class="info-row__label">Titular</span>
                <span class="info-row__value">{{ selectedCard.cardholderName }}</span>
              </div>
              <div class="info-row">
                <span class="info-row__label">ID de tarjeta</span>
                <span class="info-row__value">{{ selectedCard.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-row__label">Wallet</span>
                <span class="info-row__value">{{ selectedCard.walletId }}</span>
              </div>
              <div class="info-row">
                <span class="info-row__label">Emitida</span>
                <span class="info-row__value">{{ formatDate(selectedCard.issuedAt) }}</span>
              </div>
              <div class="info-row">
                <span class="info-row__label">Vencimiento</span>
                <span class="info-row__value">{{ selectedCard.expirationDate }}</span>
              </div>
            </div>
          </div>

          <!-- Recent transactions for this card -->
          <div class="card-txns">
            <h4 class="card-txns__title">Últimos movimientos</h4>
            <div v-if="cardTransactions.length === 0" class="card-txns__empty">
              Sin movimientos registrados para esta tarjeta
            </div>
            <div v-else class="card-txns__list">
              <div v-for="txn in cardTransactions" :key="txn.id" class="card-txn-item">
                <div class="card-txn-item__icon" :class="`card-txn-item__icon--${txnColor(txn)}`">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path v-if="txn.type === 'DEPOSIT'" d="M12 5v14M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round" />
                    <path v-else d="M12 19V5M5 12l7 7 7-7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <div class="card-txn-item__info">
                  <span class="card-txn-item__name">{{ txn.merchantName || txnTypeLabel(txn.type) }}</span>
                  <span class="card-txn-item__date">{{ formatDate(txn.createdAt) }}</span>
                </div>
                <span class="card-txn-item__amount" :class="txn.type === 'DEPOSIT' ? 'card-txn-item__amount--credit' : ''">
                  {{ txn.type === 'DEPOSIT' ? '+' : '-' }}${{ formatAmount(txn.amount) }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- ===== ISSUE CARD MODAL ===== -->
    <transition name="modal-fade">
      <div v-if="issueModalOpen" class="modal-overlay" @click.self="issueModalOpen = false">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="5" width="20" height="14" rx="3" />
                  <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Emitir nueva tarjeta</h3>
                <p class="modal-subtitle">Se creará una tarjeta virtual vinculada a tu billetera</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="issueModalOpen = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="issueCard" class="modal-form">
            <div class="form-group">
              <label class="form-label" for="issue-cardholder">Nombre del titular *</label>
              <input
                id="issue-cardholder"
                v-model="issueForm.cardholderName"
                type="text"
                class="form-input"
                placeholder="Ej: JUAN PÉREZ"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="issue-monthly">Límite mensual (USD)</label>
              <input id="issue-monthly" v-model.number="issueForm.monthlyLimit" type="number" class="form-input" placeholder="Ej: 3000" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label" for="issue-daily">Límite diario (USD, opcional)</label>
              <input id="issue-daily" v-model.number="issueForm.dailyLimit" type="number" class="form-input" placeholder="Ej: 500" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Compras internacionales</label>
              <div class="toggle-row">
                <button type="button" class="toggle-btn" :class="{ 'toggle-btn--on': issueForm.internationalAllowed }" @click="issueForm.internationalAllowed = !issueForm.internationalAllowed">
                  <span class="toggle-btn__dot"></span>
                </button>
                <span class="toggle-label">{{ issueForm.internationalAllowed ? 'Permitidas' : 'Bloqueadas' }}</span>
              </div>
            </div>

            <div v-if="issueErrorMsg" class="form-error">
              <span>{{ issueErrorMsg }}</span>
            </div>

            <div v-if="issueSuccessMsg" class="form-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ issueSuccessMsg }}</span>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn--secondary" @click="issueModalOpen = false">Cancelar</button>
              <button type="submit" class="btn btn--primary" :disabled="issuing">
                {{ issuing ? 'Emitiendo...' : 'Emitir tarjeta' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- ===== LIMITS MODAL ===== -->
    <transition name="modal-fade">
      <div v-if="limitsModalOpen" class="modal-overlay" @click.self="limitsModalOpen = false">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-icon-wrap modal-icon-wrap--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Control de límites</h3>
                <p class="modal-subtitle">Tarjeta {{ limitsForm.pan }}</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="limitsModalOpen = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveLimits" class="modal-form">
            <div class="form-group">
              <label class="form-label" for="limit-daily">Límite diario (USD)</label>
              <input id="limit-daily" v-model.number="limitsForm.dailyLimit" type="number" class="form-input" placeholder="Sin límite si vacío" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label" for="limit-monthly">Límite mensual (USD)</label>
              <input id="limit-monthly" v-model.number="limitsForm.monthlyLimit" type="number" class="form-input" placeholder="Sin límite si vacío" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Compras internacionales</label>
              <div class="toggle-row">
                <button type="button" class="toggle-btn" :class="{ 'toggle-btn--on': limitsForm.internationalAllowed }" @click="limitsForm.internationalAllowed = !limitsForm.internationalAllowed">
                  <span class="toggle-btn__dot"></span>
                </button>
                <span class="toggle-label">{{ limitsForm.internationalAllowed ? 'Permitidas' : 'Bloqueadas' }}</span>
              </div>
            </div>

            <div v-if="limitsSuccessMsg" class="form-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ limitsSuccessMsg }}</span>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn--secondary" @click="limitsModalOpen = false">Cancelar</button>
              <button type="submit" class="btn btn--primary">Guardar cambios</button>
            </div>
          </form>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue';
import type { VirtualCard, MerchantCategory } from '@/types/cards';
import type { Transaction } from '@/types/transactions';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import logo from '@/assets/LOGONOVA.png';

const authStore = useAuthStore();

const getStorageKey = () => {
  const uid = authStore.user?.id;
  return uid ? `nova_custom_cards_${uid}` : null;
};

const loading = ref(true);
const cards = ref<VirtualCard[]>([]);
const transactions = ref<Transaction[]>([]);
const selectedCard = ref<VirtualCard | null>(null);
const activeFilter = ref<string>('ALL');

const themes = ['teal', 'indigo', 'rose', 'amber'];

const filterTabs = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Activas', value: 'ACTIVE' },
  { label: 'Congeladas', value: 'FROZEN' },
  { label: 'Canceladas', value: 'CANCELLED' },
];

// Normalizer for backend / local cards
const normalizeCard = (c: any): VirtualCard => {
  const pan = c.tokenizedPan || c.maskedNumber || ('**** **** **** ' + (c.id ? String(c.id).slice(-4) : '7788'));
  const exp = c.expirationDate || c.expiration_date || '12/28';
  const monthly = c.spendingRules?.monthlyLimit ?? (typeof c.monthlyLimit === 'number' ? c.monthlyLimit : null);
  const daily = c.spendingRules?.dailyLimit ?? (typeof c.dailyLimit === 'number' ? c.dailyLimit : null);
  const intl = c.spendingRules?.internationalAllowed ?? (c.internationalAllowed ?? c.international_allowed ?? true);
  const blocked = c.spendingRules?.blockedCategories ?? (c.blockedCategories ?? c.blocked_categories ?? []);

  return {
    id: String(c.id),
    walletId: c.walletId || 'w1',
    tokenizedPan: pan,
    cardholderName: c.cardholderName || c.cardholder_name || (authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}`.trim().toUpperCase() : 'TITULAR'),
    expirationDate: exp,
    cvv: c.cvv,
    status: c.status || 'ACTIVE',
    spendingRules: {
      dailyLimit: daily,
      monthlyLimit: monthly,
      internationalAllowed: intl,
      blockedCategories: blocked,
    },
    issuedAt: c.issuedAt || c.createdAt || new Date().toISOString(),
  };
};

const persistCards = () => {
  const key = getStorageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(cards.value));
  } catch {
    // silent
  }
};

// Computed
const filteredCards = computed(() => {
  if (activeFilter.value === 'ALL') return cards.value;
  return cards.value.filter(c => c.status === activeFilter.value);
});

const activeCount = computed(() => cards.value.filter(c => c.status === 'ACTIVE').length);
const frozenCount = computed(() => cards.value.filter(c => c.status === 'FROZEN').length);
const monthlySpend = computed(() => {
  return transactions.value
    .filter(t => t.type === 'CARD_PAYMENT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);
});

const cardTransactions = computed(() => {
  if (!selectedCard.value) return [];
  return transactions.value
    .filter(t => t.cardId === selectedCard.value!.id || (t.type === 'CARD_PAYMENT'))
    .slice(0, 5);
});

// Issue modal state
const issueModalOpen = ref(false);
const issuing = ref(false);
const issueSuccessMsg = ref('');
const issueErrorMsg = ref('');
const issueForm = reactive({
  cardholderName: '',
  dailyLimit: null as number | null,
  monthlyLimit: null as number | null,
  internationalAllowed: true,
  blockedCategories: [] as MerchantCategory[],
});

// Limits modal state
const limitsModalOpen = ref(false);
const limitsSuccessMsg = ref('');
const limitsForm = reactive({
  cardId: '',
  pan: '',
  dailyLimit: null as number | null,
  monthlyLimit: null as number | null,
  internationalAllowed: true,
  blockedCategories: [] as MerchantCategory[],
});

// Helpers
const formatAmount = (n: number) =>
  n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-CO', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
};

const statusLabel = (s: string) => ({
  ACTIVE: 'Activa',
  FROZEN: 'Congelada',
  CANCELLED: 'Cancelada',
}[s] ?? s);

const txnTypeLabel = (type: string) => ({
  DEPOSIT: 'Depósito', WITHDRAWAL: 'Retiro',
  TRANSFER: 'Transferencia', CARD_PAYMENT: 'Pago con tarjeta',
  CURRENCY_EXCHANGE: 'Cambio de divisa',
}[type] ?? type);

const txnColor = (txn: Transaction) => {
  if (txn.status === 'FAILED' || txn.status === 'REJECTED_BY_RULE') return 'red';
  if (txn.type === 'DEPOSIT') return 'green';
  return 'blue';
};

// Actions
const openIssueModal = () => {
  issueSuccessMsg.value = '';
  issueErrorMsg.value = '';
  const fullName = [authStore.user?.firstName, authStore.user?.lastName].filter(Boolean).join(' ').toUpperCase();
  issueForm.cardholderName = fullName || '';
  issueForm.dailyLimit = null;
  issueForm.monthlyLimit = null;
  issueForm.internationalAllowed = true;
  issueForm.blockedCategories = [];
  issueModalOpen.value = true;
};

const issueCard = async () => {
  if (!issueForm.cardholderName.trim()) {
    issueErrorMsg.value = 'El nombre del titular es obligatorio';
    return;
  }

  issuing.value = true;
  issueErrorMsg.value = '';
  issueSuccessMsg.value = '';

  const holder = issueForm.cardholderName.trim().toUpperCase();
  const mLimit = typeof issueForm.monthlyLimit === 'number' && issueForm.monthlyLimit >= 0 ? issueForm.monthlyLimit : 0;
  const dLimit = issueForm.dailyLimit || null;

  try {
    const resp = await api.post<any>('/cards', {
      cardholderName: holder,
      monthlyLimit: mLimit,
      dailyLimit: dLimit,
      internationalAllowed: issueForm.internationalAllowed,
      blockedCategories: issueForm.blockedCategories,
    });
    const createdCard = normalizeCard(resp.data);
    cards.value.unshift(createdCard);
    selectedCard.value = createdCard;
    persistCards();
    issueSuccessMsg.value = '¡Tarjeta emitida exitosamente!';
    setTimeout(() => { issueModalOpen.value = false; }, 1200);
  } catch {
    // Local creation fallback (works offline or without backend)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 4);
    const expMonth = String(futureDate.getMonth() + 1).padStart(2, '0');
    const expYear = String(futureDate.getFullYear()).slice(-2);

    const newCard: VirtualCard = {
      id: 'c_' + Date.now().toString(36),
      walletId: 'w1',
      tokenizedPan: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
      cardholderName: holder,
      expirationDate: `${expMonth}/${expYear}`,
      status: 'ACTIVE',
      spendingRules: {
        dailyLimit: dLimit,
        monthlyLimit: mLimit || null,
        internationalAllowed: issueForm.internationalAllowed,
        blockedCategories: [...issueForm.blockedCategories],
      },
      issuedAt: new Date().toISOString(),
    };

    cards.value.unshift(newCard);
    selectedCard.value = newCard;
    persistCards();
    issueSuccessMsg.value = '¡Tarjeta emitida exitosamente!';
    setTimeout(() => { issueModalOpen.value = false; }, 1200);
  } finally {
    issuing.value = false;
  }
};

const toggleFreeze = async (card: VirtualCard) => {
  const newStatus = card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
  try {
    await api.patch(`/cards/${card.id}/status`, { status: newStatus });
  } catch {
    // fallback
  }
  card.status = newStatus;
  persistCards();
};

const cancelCard = async (card: VirtualCard) => {
  if (!confirm('¿Estás seguro de cancelar esta tarjeta? Esta acción no se puede deshacer.')) return;
  try {
    await api.patch(`/cards/${card.id}/status`, { status: 'CANCELLED' });
  } catch {
    // fallback
  }
  card.status = 'CANCELLED';
  persistCards();
};

const deleteCard = async (card: VirtualCard) => {
  if (!confirm('¿Deseas eliminar esta tarjeta? Se borrará de tu lista.')) return;
  try {
    await api.delete(`/cards/${card.id}`);
  } catch {
    // fallback si es tarjeta local u offline
  }
  cards.value = cards.value.filter(c => c.id !== card.id);
  if (selectedCard.value?.id === card.id) {
    selectedCard.value = cards.value[0] || null;
  }
  persistCards();
};

const openLimitsModal = (card: VirtualCard) => {
  limitsSuccessMsg.value = '';
  limitsForm.cardId = card.id;
  limitsForm.pan = card.tokenizedPan;
  limitsForm.dailyLimit = card.spendingRules.dailyLimit;
  limitsForm.monthlyLimit = card.spendingRules.monthlyLimit;
  limitsForm.internationalAllowed = card.spendingRules.internationalAllowed;
  limitsForm.blockedCategories = [...card.spendingRules.blockedCategories];
  limitsModalOpen.value = true;
};

const saveLimits = async () => {
  const card = cards.value.find(c => c.id === limitsForm.cardId);
  if (!card) return;
  const newRules = {
    dailyLimit: limitsForm.dailyLimit || null,
    monthlyLimit: limitsForm.monthlyLimit || null,
    internationalAllowed: limitsForm.internationalAllowed,
    blockedCategories: [...limitsForm.blockedCategories],
  };
  try {
    const res = await api.patch(`/cards/${card.id}/limits`, {
      monthlyLimit: newRules.monthlyLimit ?? 0,
      dailyLimit: newRules.dailyLimit,
      internationalAllowed: newRules.internationalAllowed,
      blockedCategories: newRules.blockedCategories,
    });
    if (res.data) {
      const updated = normalizeCard(res.data);
      Object.assign(card, updated);
    }
  } catch {
    // fallback
  }
  card.spendingRules = newRules;
  if (selectedCard.value?.id === card.id) {
    selectedCard.value = { ...card };
  }
  persistCards();
  limitsSuccessMsg.value = '¡Límites actualizados!';
  setTimeout(() => { limitsModalOpen.value = false; }, 900);
};

// Data fetch logic
const fetchCardsData = async () => {
  loading.value = true;
  // Clean up any old mock data or legacy shared key
  localStorage.removeItem('nova_cards_demo');
  localStorage.removeItem('nova_custom_cards');

  try {
    const [cardsRes, txnRes] = await Promise.allSettled([
      api.get<any[]>('/cards'),
      api.get<Transaction[]>('/transactions'),
    ]);

    if (cardsRes.status === 'fulfilled' && Array.isArray(cardsRes.value.data)) {
      // Backend returned cards specifically for this authenticated user
      cards.value = cardsRes.value.data.map(normalizeCard);
      persistCards();
    } else {
      // Load user-created cards only from user's isolated local storage
      const key = getStorageKey();
      if (key) {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              // Filter out any hardcoded demo cards (c1, c2, c3, c4)
              cards.value = parsed.filter(c => !['c1', 'c2', 'c3', 'c4'].includes(c.id)).map(normalizeCard);
            } else {
              cards.value = [];
            }
          } catch {
            cards.value = [];
          }
        } else {
          cards.value = [];
        }
      } else {
        cards.value = [];
      }
    }

    if (txnRes.status === 'fulfilled' && Array.isArray(txnRes.value.data)) {
      transactions.value = txnRes.value.data;
    } else {
      transactions.value = [];
    }
  } catch {
    cards.value = [];
    transactions.value = [];
  } finally {
    selectedCard.value = cards.value[0] || null;
    loading.value = false;
  }
};

onMounted(fetchCardsData);

watch(() => authStore.user?.id, () => {
  fetchCardsData();
});
</script>

<style scoped>
/* ===== ROOT ===== */
.cards-view {
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100%;
  color: #e5e7eb;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

/* ===== HEADER ===== */
.cards-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.cards-header__title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #f0f4ff;
  line-height: 1.1;
  letter-spacing: -0.03em;
}
.cards-header__sub {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.4);
  margin-top: 0.25rem;
}
.btn-issue {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #00e5c0, #0ea5e9);
  color: #0a1220;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(0,229,192,0.3);
  transition: transform 0.15s, box-shadow 0.15s;
}
.btn-issue:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,229,192,0.4); }
.btn-issue svg { width: 16px; height: 16px; }
.btn-issue--sm { font-size: 0.8rem; padding: 0.5rem 1rem; }

/* ===== STATS ROW ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.mini-stat {
  background: #131b2a;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255,255,255,0.06);
  transition: transform 0.15s;
}
.mini-stat:hover { transform: translateY(-2px); }
.mini-stat__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mini-stat__icon svg { width: 20px; height: 20px; }
.mini-stat__icon--teal { background: rgba(0,229,192,0.12); color: #00e5c0; }
.mini-stat__icon--green { background: rgba(34,197,94,0.12); color: #22c55e; }
.mini-stat__icon--blue { background: rgba(96,165,250,0.12); color: #60a5fa; }
.mini-stat__icon--orange { background: rgba(249,115,22,0.12); color: #f97316; }
.mini-stat__info { display: flex; flex-direction: column; gap: 2px; }
.mini-stat__label { font-size: 0.72rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; }
.mini-stat__value { font-size: 1.15rem; font-weight: 800; color: #f0f4ff; }

/* ===== MAIN GRID ===== */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  flex: 1;
}

/* ===== SHOWCASE PANEL ===== */
.showcase-panel {
  background: #131b2a;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.panel-head__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f0f4ff;
}

/* Filter tabs */
.filter-tabs { display: flex; gap: 4px; }
.filter-tab {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-tab:hover { color: #fff; background: rgba(255,255,255,0.06); }
.filter-tab--active {
  background: rgba(0,229,192,0.15);
  color: #00e5c0;
}

/* Card list */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  flex: 1;
  max-height: 580px;
  padding-right: 4px;
}
.card-list::-webkit-scrollbar { width: 4px; }
.card-list::-webkit-scrollbar-track { background: transparent; }
.card-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

/* ===== VIRTUAL CARD ===== */
.vcard {
  position: relative;
  border-radius: 18px;
  padding: 1.25rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  min-height: 155px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.vcard:hover { transform: translateY(-2px); }
.vcard--selected {
  box-shadow: 0 0 0 2px #00e5c0, 0 16px 40px rgba(0,0,0,0.35);
}
.vcard--teal { background: linear-gradient(135deg, #0d4f46 0%, #064e3b 50%, #0b3a5e 100%); }
.vcard--indigo { background: linear-gradient(135deg, #1e1b4b 0%, #1d2c6b 50%, #312e81 100%); }
.vcard--rose { background: linear-gradient(135deg, #4c0519 0%, #881337 50%, #9d174d 100%); }
.vcard--amber { background: linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%); }

/* Glow overlay */
.vcard::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 20%, rgba(255,255,255,0.08), transparent 60%);
  pointer-events: none;
}

/* Frost overlay */
.vcard__frost {
  position: absolute;
  inset: 0;
  background: rgba(96,165,250,0.08);
  backdrop-filter: blur(1px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: none;
}
.vcard__frost svg {
  width: 48px;
  height: 48px;
  color: rgba(96,165,250,0.3);
  animation: frost-pulse 3s ease-in-out infinite;
}
@keyframes frost-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.vcard--cancelled { opacity: 0.5; filter: grayscale(0.6); }

.vcard__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 3;
}
.vcard__logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(255,255,255,0.9);
  padding: 2px;
}
.vcard__badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.vcard__badge--active { background: rgba(0,229,192,0.2); color: #00e5c0; }
.vcard__badge--frozen { background: rgba(96,165,250,0.2); color: #60a5fa; }
.vcard__badge--cancelled { background: rgba(239,68,68,0.2); color: #f87171; }

.vcard__pan {
  font-family: 'Courier New', monospace;
  font-size: 1.05rem;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.12em;
  margin: 0.5rem 0 0.2rem 0;
  position: relative;
  z-index: 3;
}
.vcard__holder {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.8);
  margin-bottom: 0.6rem;
  position: relative;
  z-index: 3;
}
.vcard__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  position: relative;
  z-index: 3;
}
.vcard__field { display: flex; flex-direction: column; }
.vcard__field-label { font-size: 0.6rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; }
.vcard__field-value { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.85); }
.vcard__chip {
  width: 32px;
  height: 24px;
  background: linear-gradient(135deg, #f5cc5a, #d4a017);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vcard__chip-lines { display: flex; flex-direction: column; gap: 3px; }
.vcard__chip-lines span { display: block; width: 18px; height: 1.5px; background: rgba(0,0,0,0.35); border-radius: 2px; }

/* Skeleton */
.card-skeleton {
  height: 155px;
  border-radius: 18px;
  background: linear-gradient(90deg, #1a2436 25%, #223048 50%, #1a2436 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  color: rgba(255,255,255,0.4);
  text-align: center;
}
.empty-state__icon { font-size: 3rem; }
.empty-state__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f0f4ff;
  margin: 0;
}
.empty-state__text {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.4);
  max-width: 300px;
  line-height: 1.4;
  margin: 0;
}

/* ===== DETAIL PANEL ===== */
.detail-panel {
  background: #131b2a;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
  max-height: calc(100vh - 260px);
}
.detail-panel::-webkit-scrollbar { width: 4px; }
.detail-panel::-webkit-scrollbar-track { background: transparent; }
.detail-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex: 1;
  color: rgba(255,255,255,0.3);
  text-align: center;
  padding: 2rem 1rem;
}
.detail-empty__icon svg { width: 56px; height: 56px; color: rgba(255,255,255,0.2); }
.detail-empty__title {
  font-size: 1rem;
  font-weight: 700;
  color: #f0f4ff;
  margin: 0;
}
.detail-empty__text {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.4);
  max-width: 280px;
  line-height: 1.4;
  margin: 0;
}

/* Detail header */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.detail-header__title {
  font-size: 1rem;
  font-weight: 700;
  color: #f0f4ff;
}
.detail-header__pan {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.08em;
  margin-top: 2px;
}
.detail-header__badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.detail-header__badge--active { background: rgba(0,229,192,0.15); color: #00e5c0; }
.detail-header__badge--frozen { background: rgba(96,165,250,0.15); color: #60a5fa; }
.detail-header__badge--cancelled { background: rgba(239,68,68,0.15); color: #f87171; }

/* Quick actions */
.quick-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
}
.action-btn svg { width: 14px; height: 14px; }
.action-btn:hover { transform: translateY(-1px); }

.action-btn--freeze {
  background: rgba(96,165,250,0.12);
  color: #60a5fa;
  border: 1px solid rgba(96,165,250,0.2);
}
.action-btn--freeze:hover { background: rgba(96,165,250,0.2); }

.action-btn--unfreeze {
  background: rgba(0,229,192,0.12);
  color: #00e5c0;
  border: 1px solid rgba(0,229,192,0.2);
}
.action-btn--unfreeze:hover { background: rgba(0,229,192,0.2); }

.action-btn--limits {
  background: rgba(139,92,246,0.12);
  color: #a78bfa;
  border: 1px solid rgba(139,92,246,0.2);
}
.action-btn--limits:hover { background: rgba(139,92,246,0.2); }

.action-btn--cancel {
  background: rgba(239,68,68,0.1);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.15);
}
.action-btn--cancel:hover { background: rgba(239,68,68,0.18); }

.action-btn--delete {
  background: rgba(239,68,68,0.1);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.2);
}
.action-btn--delete:hover {
  background: rgba(239,68,68,0.22);
}

/* Rules panel */
.rules-panel {
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  padding: 1.25rem;
  border: 1px solid rgba(255,255,255,0.05);
}
.rules-panel__title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #f0f4ff;
  margin-bottom: 0.75rem;
}
.rules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.rule-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rule-item__label {
  font-size: 0.68rem;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.rule-item__value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e5e7eb;
}
.rule-item__value--ok { color: #00e5c0; }
.rule-item__value--no { color: #f87171; }

/* Info panel */
.info-panel {
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  padding: 1.25rem;
  border: 1px solid rgba(255,255,255,0.05);
}
.info-panel__title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #f0f4ff;
  margin-bottom: 0.75rem;
}
.info-rows { display: flex; flex-direction: column; gap: 0.5rem; }
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info-row__label {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
}
.info-row__value {
  font-size: 0.78rem;
  font-weight: 600;
  color: #e5e7eb;
  font-family: 'Courier New', monospace;
}

/* Card transactions */
.card-txns__title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #f0f4ff;
  margin-bottom: 0.75rem;
}
.card-txns__empty {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.3);
  text-align: center;
  padding: 1rem;
}
.card-txns__list { display: flex; flex-direction: column; gap: 0.35rem; }
.card-txn-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.5rem;
  border-radius: 10px;
  transition: background 0.12s;
}
.card-txn-item:hover { background: rgba(255,255,255,0.04); }
.card-txn-item__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-txn-item__icon svg { width: 14px; height: 14px; }
.card-txn-item__icon--green { background: rgba(0,229,192,0.12); color: #00e5c0; }
.card-txn-item__icon--blue { background: rgba(37,99,235,0.12); color: #60a5fa; }
.card-txn-item__icon--red { background: rgba(239,68,68,0.12); color: #f87171; }
.card-txn-item__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.card-txn-item__name { font-size: 0.8rem; font-weight: 600; color: #e5e7eb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-txn-item__date { font-size: 0.68rem; color: rgba(255,255,255,0.35); }
.card-txn-item__amount { font-size: 0.82rem; font-weight: 700; color: #e5e7eb; white-space: nowrap; }
.card-txn-item__amount--credit { color: #00e5c0; }

/* ===== MODALS ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5,10,18,0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 1rem;
}
.modal-card {
  background: #0d1624;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 45px rgba(0,0,0,0.65), 0 0 25px rgba(0,229,192,0.08);
  padding: 1.5rem;
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
  background: rgba(0,229,192,0.12);
  color: #00e5c0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.modal-icon-wrap svg { width: 20px; height: 20px; }
.modal-icon-wrap--blue { background: rgba(96,165,250,0.12); color: #60a5fa; }
.modal-title {
  font-size: 1.1rem;
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
.modal-close-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
.modal-close-btn svg { width: 18px; height: 18px; }

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
  width: 100%;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: #e5e7eb;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input:focus {
  outline: none;
  border-color: #00e5c0;
  box-shadow: 0 0 0 3px rgba(0,229,192,0.15);
}
.form-input::placeholder { color: rgba(255,255,255,0.25); }

/* Toggle */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.toggle-btn {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: rgba(255,255,255,0.12);
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}
.toggle-btn--on { background: #00e5c0; }
.toggle-btn__dot {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-btn--on .toggle-btn__dot { transform: translateX(20px); }
.toggle-label {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.6);
}

/* Category chips */
.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.category-chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.55);
  cursor: pointer;
  transition: all 0.15s;
}
.category-chip:hover {
  border-color: rgba(239,68,68,0.3);
  color: #f87171;
}
.category-chip--blocked {
  background: rgba(239,68,68,0.12);
  border-color: rgba(239,68,68,0.3);
  color: #f87171;
}

/* Form error & success message */
.form-error {
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.25);
  color: #f87171;
  font-size: 0.82rem;
  font-weight: 600;
}

.form-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  background: rgba(0,229,192,0.1);
  border: 1px solid rgba(0,229,192,0.2);
  color: #00e5c0;
  font-size: 0.82rem;
  font-weight: 600;
}
.form-success svg { width: 16px; height: 16px; flex-shrink: 0; }

/* Buttons */
.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}
.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.15s, box-shadow 0.15s;
  font-family: inherit;
}
.btn:hover { transform: translateY(-1px); }
.btn--primary {
  background: linear-gradient(135deg, #00e5c0, #0ea5e9);
  color: #0a1220;
  box-shadow: 0 4px 16px rgba(0,229,192,0.3);
}
.btn--primary:hover { box-shadow: 0 8px 24px rgba(0,229,192,0.4); }
.btn--primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn--secondary {
  background: rgba(255,255,255,0.08);
  color: #e5e7eb;
  border: 1px solid rgba(255,255,255,0.12);
}
.btn--secondary:hover { background: rgba(255,255,255,0.14); }

/* ===== MODAL TRANSITIONS ===== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1100px) {
  .cards-grid { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .cards-view { padding: 1rem; }
  .cards-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .stats-row { grid-template-columns: 1fr; }
  .quick-actions { flex-direction: column; }
  .rules-grid { grid-template-columns: 1fr; }
}
</style>
