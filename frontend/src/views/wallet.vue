<template>
  <div class="wallet-view">
    <header class="wallet-header">
      <div>
        <h1 class="page-title">Billetera</h1>
        <p class="page-description">
          Tu cuenta principal en COP, cuentas de ahorro (4% EA) y bolsillos multimoneda con tasas de cambio internas.
        </p>
      </div>
      <button id="btn-new-savings" class="btn btn--accent" type="button" @click="openModal('create')">
        + Nueva cuenta de ahorros
      </button>
    </header>

    <p v-if="error" class="banner banner--error" role="alert">{{ error }}</p>
    <p v-if="notice" class="banner banner--ok" role="status">{{ notice }}</p>

    <div v-if="loading" class="empty">Cargando billetera…</div>

    <template v-else>
      <!-- ===== RESUMEN PATRIMONIAL ===== -->
      <section class="summary" aria-label="Resumen">
        <div class="summary__card summary__card--total">
          <span class="summary__label">Patrimonio consolidado (COP)</span>
          <strong class="summary__value">{{ money(consolidatedBalanceCop) }}</strong>
          <span v-if="totalForeignInCop > 0" class="summary__sub">
            Incluye {{ money(totalForeignInCop) }} en divisas
          </span>
        </div>
        <div class="summary__card">
          <span class="summary__label">Cuenta principal (COP)</span>
          <strong class="summary__value">{{ money(checking?.balance ?? 0) }}</strong>
        </div>
        <div class="summary__card">
          <span class="summary__label">En ahorros (COP)</span>
          <strong class="summary__value">{{ money(savingsTotal) }}</strong>
        </div>
        <div class="summary__card summary__card--fx">
          <span class="summary__label">Billetera multimoneda</span>
          <strong class="summary__value">{{ money(totalForeignInCop) }}</strong>
          <span class="summary__sub">
            {{ currencyWallets.length }} {{ currencyWallets.length === 1 ? 'divisa activa' : 'divisas activas' }}
          </span>
        </div>
      </section>

      <!-- ===== CUENTAS EN PESOS (COP) ===== -->
      <div class="section-heading">
        <div>
          <h2 class="section-heading__title">🇨🇴 Cuentas en Pesos (COP)</h2>
          <p class="section-heading__sub">Depósitos, retiros, transferencias e intereses mensuales.</p>
        </div>
      </div>

      <section class="accounts" aria-label="Cuentas">
        <article
          v-for="acc in accounts"
          :key="acc.id"
          :id="`account-${acc.id}`"
          class="account"
          :class="{ 'account--savings': acc.type === 'SAVINGS' }"
          title="Ver movimientos de esta cuenta"
          @click="goToMovements(acc.id)"
        >
          <div class="account__top">
            <span class="account__badge">{{ acc.type === 'CHECKING' ? 'Principal · COP' : 'Ahorros · COP' }}</span>
            <span v-if="acc.type === 'SAVINGS'" class="account__rate">{{ (acc.annualRate * 100).toFixed(2) }}% EA</span>
          </div>
          <h2 class="account__name">{{ acc.name }}</h2>
          <p class="account__number" @click.stop>
            <span>N.º {{ formatAccountNumber(acc.accountNumber) }}</span>
            <button class="account__copy" type="button" title="Copiar número de cuenta" @click="copyAccountNumber(acc.accountNumber)">
              Copiar
            </button>
          </p>
          <p class="account__balance">{{ money(acc.balance) }}</p>

          <div class="account__actions" @click.stop>
            <template v-if="acc.type === 'CHECKING'">
              <button class="chip" type="button" @click="openModal('deposit', acc)">Depositar</button>
              <button class="chip" type="button" @click="openModal('withdraw', acc)">Retirar</button>
              <button class="chip" type="button" :disabled="savings.length === 0" @click="openModal('transfer', acc)">
                Enviar a ahorros
              </button>
              <button class="chip chip--send" type="button" @click="openModal('external', acc)">Enviar a otra cuenta</button>
              <button class="chip chip--accent" type="button" @click="openExchangeModal('COP', 'USD')">
                ⇄ Comprar divisas
              </button>
            </template>
            <template v-else>
              <button class="chip" type="button" @click="openModal('transfer', acc)">Transferir</button>
              <button class="chip chip--send" type="button" @click="openModal('external', acc)">Enviar a otra cuenta</button>
              <button
                class="chip chip--accent"
                type="button"
                :disabled="interestClaimed(acc)"
                :title="interestClaimed(acc) ? 'Ya acreditaste los intereses de este mes' : ''"
                @click="claimInterest(acc)"
              >
                {{ interestClaimed(acc) ? 'Intereses al día' : 'Acreditar intereses' }}
              </button>
            </template>
          </div>
        </article>
      </section>

      <!-- ===== BILLETERA MULTIMONEDA Y TASAS INTERNAS ===== -->
      <section class="fx-section" aria-labelledby="fx-section-title">
        <div class="section-heading">
          <div>
            <h2 id="fx-section-title" class="section-heading__title">🌐 Billetera Multimoneda</h2>
            <p class="section-heading__sub">
              Mantén saldos en monedas extranjeras y convierte al instante con las tasas de cambio internas de NOVA.
            </p>
          </div>
          <div class="fx-section__actions">
            <router-link :to="{ path: '/transactions', query: { account: 'fx' } }" class="fx-movements-link">
              Ver conversiones →
            </router-link>
            <button
              class="btn btn--teal btn--sm"
              type="button"
              @click="openExchangeModal('COP', currencyWallets[0]?.currency ?? 'USD')"
            >
              ⇄ Nueva conversión
            </button>
          </div>
        </div>

        <div class="fx-layout">
          <!-- Columna izquierda: Bolsillos de divisas -->
          <div class="fx-wallets-col">
            <div v-if="currencyWallets.length === 0" class="fx-empty">
              <div class="fx-empty__icon">💱</div>
              <h3 class="fx-empty__title">Activa tu primera billetera en divisas</h3>
              <p class="fx-empty__desc">
                Abre un bolsillo sin costo de manejo en dólares, euros, libras, pesos mexicanos o reales, o realiza directamente tu primera conversión desde COP.
              </p>
              <div class="fx-quick-pills">
                <button
                  v-for="code in FOREIGN_CURRENCY_LIST"
                  :key="code"
                  type="button"
                  class="fx-pill"
                  :disabled="quickOpening === code"
                  @click="quickOpenCurrency(code)"
                >
                  <span>{{ CURRENCY_META[code].flag }}</span>
                  <strong>{{ code }}</strong>
                  <span class="fx-pill__plus">+ Abrir</span>
                </button>
              </div>
            </div>

            <div v-else class="fx-wallets-grid">
              <article
                v-for="w in currencyWallets"
                :key="w.id"
                :id="`fx-wallet-${w.currency}`"
                class="fx-card fx-card--clickable"
                :style="{ '--fx-accent': CURRENCY_META[w.currency].accent }"
                title="Ver conversiones de esta divisa en Movimientos"
                @click="goToFxMovements(w.currency)"
              >
                <div class="fx-card__top">
                  <div class="fx-card__identity">
                    <span class="fx-card__flag">{{ CURRENCY_META[w.currency].flag }}</span>
                    <div>
                      <strong class="fx-card__code">{{ w.currency }}</strong>
                      <span class="fx-card__name">{{ w.name }}</span>
                    </div>
                  </div>
                  <span class="fx-card__rate-tag">
                    1 {{ w.currency }} ≈ {{ money(w.midCopRate) }}
                  </span>
                </div>

                <div class="fx-card__balances">
                  <p class="fx-card__balance">{{ formatCurrency(w.balance, w.currency) }}</p>
                  <p class="fx-card__equiv">Equivalente estimado: {{ money(w.copEquivalent) }} COP</p>
                </div>

                <div class="fx-card__actions" @click.stop>
                  <button
                    type="button"
                    class="chip chip--accent"
                    @click="openExchangeModal('COP', w.currency)"
                  >
                    + Agregar fondos
                  </button>
                  <button
                    type="button"
                    class="chip"
                    :disabled="w.balance <= 0"
                    @click="openExchangeModal(w.currency, 'COP')"
                  >
                    ⇄ Convertir
                  </button>
                  <button
                    v-if="w.balance === 0"
                    type="button"
                    class="chip chip--danger"
                    title="Cerrar bolsillo sin saldo"
                    @click="closeCurrencyWallet(w)"
                  >
                    Cerrar
                  </button>
                </div>
              </article>

              <button
                v-if="availableCurrenciesToOpen.length > 0"
                type="button"
                class="fx-card fx-card--add"
                @click="openModal('openWallet')"
              >
                <span class="fx-card__add-plus">+</span>
                <strong>Abrir otra divisa</strong>
                <span class="fx-card__add-sub">
                  Disponibles: {{ availableCurrenciesToOpen.join(' · ') }}
                </span>
              </button>
            </div>
          </div>

          <!-- Columna derecha: Tabla de Tasas de Cambio Internas -->
          <aside class="fx-rates-panel" aria-label="Tasas de cambio internas">
            <div class="fx-rates-panel__header">
              <div>
                <h3 class="fx-rates-panel__title">Tasas de cambio internas</h3>
                <p class="fx-rates-panel__sub">Tesorería NOVA · Base COP sin comisiones ocultas</p>
              </div>
              <span class="fx-live-badge">INTERNA</span>
            </div>

            <div class="fx-rates-table">
              <div class="fx-rates-row fx-rates-row--head">
                <span>Divisa</span>
                <span class="text-right">Compra (COP)</span>
                <span class="text-right">Venta (COP)</span>
                <span></span>
              </div>
              <div
                v-for="r in internalRates"
                :key="r.currency"
                class="fx-rates-row"
              >
                <div class="fx-rates-currency">
                  <span class="fx-rates-currency__flag">{{ CURRENCY_META[r.currency].flag }}</span>
                  <div>
                    <strong>{{ r.currency }}</strong>
                    <small>Margen {{ r.spreadPercent.toFixed(2) }}%</small>
                  </div>
                </div>
                <span class="fx-rates-val text-right" title="Precio en COP para comprar 1 unidad">
                  {{ money(r.buyCopRate) }}
                </span>
                <span class="fx-rates-val text-right" title="COP recibidos al vender 1 unidad">
                  {{ money(r.sellCopRate) }}
                </span>
                <button
                  type="button"
                  class="fx-mini-btn"
                  :title="`Convertir ${r.currency}`"
                  @click="openExchangeModal('COP', r.currency)"
                >
                  Cambiar
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </template>

    <!-- ===== MODAL DE ACCIONES ===== -->
    <div v-if="modal" class="overlay" @click.self="closeModal">
      <form
        class="modal"
        :class="{ 'modal--wide': modal.kind === 'withdraw' || modal.kind === 'exchange' || modal.kind === 'openWallet' }"
        @submit.prevent="submitModal"
      >
        <h3 class="modal__title">{{ modalTitle }}</h3>

        <!-- 1. Crear cuenta de ahorros COP -->
        <label v-if="modal.kind === 'create'" class="field">
          <span>Nombre de la cuenta</span>
          <input id="field-name" v-model="form.name" type="text" maxlength="100" placeholder="Ej. Fondo de emergencia" />
        </label>

        <!-- 2. Abrir bolsillo en divisa extranjera -->
        <div v-else-if="modal.kind === 'openWallet'" class="open-fx-grid" role="radiogroup" aria-label="Seleccionar divisa">
          <button
            v-for="code in availableCurrenciesToOpen"
            :key="code"
            type="button"
            class="open-fx-option"
            :class="{ 'open-fx-option--active': fxForm.newCurrency === code }"
            @click="fxForm.newCurrency = code"
          >
            <span class="open-fx-option__flag">{{ CURRENCY_META[code].flag }}</span>
            <div class="open-fx-option__info">
              <strong>{{ code }} · {{ CURRENCY_META[code].name }}</strong>
              <small v-if="rateFor(code)">
                Tasa interna ref.: {{ money(rateFor(code)!.copRate) }} COP
              </small>
            </div>
            <span class="open-fx-option__symbol">{{ CURRENCY_META[code].symbol }}</span>
          </button>
        </div>

        <!-- 3. Conversor multimoneda con tasas internas -->
        <div v-else-if="modal.kind === 'exchange'" class="fx-converter">
          <div class="fx-converter__selectors">
            <label class="field">
              <span>Desde (origen)</span>
              <select id="field-fx-from" v-model="fxForm.fromCurrency">
                <option v-for="code in allCurrencies" :key="code" :value="code">
                  {{ CURRENCY_META[code].flag }} {{ code }} — {{ CURRENCY_META[code].name }}
                </option>
              </select>
              <small class="fx-avail">
                Disponible: <strong>{{ formatCurrency(availableForCurrency(fxForm.fromCurrency), fxForm.fromCurrency) }}</strong>
              </small>
            </label>

            <button
              type="button"
              class="fx-swap-btn"
              title="Invertir monedas de origen y destino"
              @click="swapExchangeCurrencies"
            >
              ⇅
            </button>

            <label class="field">
              <span>Hacia (destino)</span>
              <select id="field-fx-to" v-model="fxForm.toCurrency">
                <option
                  v-for="code in allCurrencies.filter((c) => c !== fxForm.fromCurrency)"
                  :key="code"
                  :value="code"
                >
                  {{ CURRENCY_META[code].flag }} {{ code }} — {{ CURRENCY_META[code].name }}
                </option>
              </select>
              <small class="fx-avail">
                <template v-if="fxForm.toCurrency !== 'COP' && !hasWallet(fxForm.toCurrency)">
                  Se abrirá tu bolsillo {{ fxForm.toCurrency }} automáticamente
                </template>
                <template v-else>
                  Saldo actual: {{ formatCurrency(availableForCurrency(fxForm.toCurrency), fxForm.toCurrency) }}
                </template>
              </small>
            </label>
          </div>

          <div class="field">
            <div class="field__row">
              <span>Monto a convertir ({{ fxForm.fromCurrency }})</span>
              <button
                v-if="availableForCurrency(fxForm.fromCurrency) > 0"
                type="button"
                class="fx-max-btn"
                @click="fillMaxExchangeAmount"
              >
                Usar disponible
              </button>
            </div>
            <input
              id="field-fx-amount"
              :value="fxForm.amount"
              type="text"
              inputmode="decimal"
              :placeholder="fxForm.fromCurrency === 'COP' ? 'Ej: 100,000.00' : 'Ej: 50.00'"
              required
              autofocus
              @input="fxForm.amount = onMoneyInput($event)"
            />
          </div>

          <!-- Resumen de cotización interna en tiempo real -->
          <div v-if="activeQuote" class="fx-quote-box">
            <div class="fx-quote-box__row">
              <span>Tasa interna aplicada</span>
              <strong>{{ formatQuoteRateLine(activeQuote) }}</strong>
            </div>
            <div class="fx-quote-box__row">
              <span>Tasa media de referencia</span>
              <span>{{ formatMidRateLine(activeQuote) }}</span>
            </div>
            <div class="fx-quote-box__row">
              <span>Margen operativo interno</span>
              <span>{{ activeQuote.spreadPercent.toFixed(2) }}% (incluido)</span>
            </div>
            <div class="fx-quote-box__result">
              <span>Recibirás en {{ activeQuote.toCurrency === 'COP' ? 'Cuenta principal' : `Billetera ${activeQuote.toCurrency}` }}</span>
              <strong>{{ formatCurrency(activeQuote.toAmount, activeQuote.toCurrency) }}</strong>
            </div>
          </div>
          <p v-else-if="quoteHint" class="hint">{{ quoteHint }}</p>
        </div>

        <!-- 4. Operaciones en cuentas COP existentes -->
        <template v-else>
          <label v-if="modal.kind === 'transfer'" class="field">
            <span>Destino</span>
            <select id="field-target" v-model="form.targetId" required>
              <option v-for="t in transferTargets" :key="t.id" :value="t.id">{{ t.name }} ({{ money(t.balance) }})</option>
            </select>
          </label>

          <template v-if="modal.kind === 'external'">
            <label class="field">
              <span>Número de cuenta de destino</span>
              <input
                id="field-account-number"
                v-model="form.accountNumber"
                type="text"
                inputmode="numeric"
                maxlength="12"
                placeholder="10 dígitos"
                autocomplete="off"
                required
                autofocus
              />
            </label>
            <p v-if="lookingUp" class="hint">Buscando cuenta…</p>
            <p v-else-if="recipient" class="recipient">
              <span class="recipient__label">Titular</span>
              <strong>{{ recipient.holderName }}</strong>
              <span class="recipient__type">
                {{ recipient.accountType === 'CHECKING' ? 'Cuenta principal' : 'Cuenta de ahorros' }} ·
                {{ formatAccountNumber(recipient.accountNumber) }}
              </span>
            </p>
            <p v-else-if="recipientError" class="hint hint--error">{{ recipientError }}</p>
          </template>
          <label class="field">
            <span>Monto (COP)</span>
            <input id="field-amount" :value="form.amount" @input="form.amount = onMoneyInput($event)" type="text" inputmode="decimal" placeholder="Ej: 1,500.00" required :autofocus="modal.kind !== 'external'" />
          </label>
          <p v-if="modal.account && modal.kind !== 'deposit'" class="hint">
            Disponible: {{ money(modal.account.balance) }}
          </p>

          <template v-if="modal.kind === 'withdraw'">
            <div class="field">
              <span>Categoría del gasto</span>
              <div class="cat-grid" role="radiogroup" aria-label="Categoría del gasto">
                <button
                  v-for="cat in WALLET_SPENDING_CATEGORIES"
                  :key="cat.id"
                  type="button"
                  class="cat-option"
                  :class="{ 'cat-option--active': form.category === cat.id }"
                  :style="form.category === cat.id ? { borderColor: cat.color, background: cat.color + '1c' } : {}"
                  @click="form.category = cat.id"
                >
                  <span class="cat-option__icon">{{ cat.icon }}</span>
                  <span class="cat-option__label">{{ cat.label }}</span>
                </button>
              </div>
            </div>

            <label class="field">
              <span>Concepto (opcional)</span>
              <input
                id="field-description"
                v-model="form.description"
                type="text"
                maxlength="120"
                placeholder="Ej. Supermercado, Uber, Recibo de luz…"
              />
            </label>
          </template>
        </template>

        <p v-if="modalError" class="banner banner--error">{{ modalError }}</p>

        <div class="modal__actions">
          <button class="btn btn--ghost" type="button" @click="closeModal">Cancelar</button>
          <button
            id="btn-confirm"
            class="btn btn--accent"
            type="submit"
            :disabled="
              submitting ||
              (modal.kind === 'external' && !recipient) ||
              (modal.kind === 'exchange' && !activeQuote)
            "
          >
            {{ submitting ? 'Procesando…' : modalConfirmLabel }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { accountService } from '@/services/accountService';
import { walletService } from '@/services/walletService';
import type { Account, AccountHolderInfo } from '@/types/accounts';
import {
  CURRENCY_META,
  FOREIGN_CURRENCY_LIST,
  type CurrencyCode,
  type CurrencyWallet,
  type ExchangeQuote,
  type ForeignCurrencyCode,
  type InternalExchangeRate,
} from '@/types/wallet';
import { copyToClipboard, formatAccountNumber } from '@/utils/accountNumber';
import { formatAmount, formatMoneyInput, parseMoney } from '@/utils/numberFormat';
import { pushNotification } from '@/utils/notifications';
import {
  WALLET_SPENDING_CATEGORIES,
  getCategoryById,
  type SpendingCategoryId,
} from '@/utils/spendingCategories';

const onMoneyInput = (e: Event): string => {
  const el = e.target as HTMLInputElement;
  return (el.value = formatMoneyInput(el.value));
};

type ModalKind =
  | 'create'
  | 'deposit'
  | 'withdraw'
  | 'transfer'
  | 'external'
  | 'openWallet'
  | 'exchange';

const allCurrencies: CurrencyCode[] = ['COP', ...FOREIGN_CURRENCY_LIST];

const router = useRouter();
const accounts = ref<Account[]>([]);
const currencyWallets = ref<CurrencyWallet[]>([]);
const internalRates = ref<InternalExchangeRate[]>([]);
const totalForeignInCop = ref(0);

const loading = ref(true);
const quickOpening = ref<ForeignCurrencyCode | null>(null);
const error = ref('');
const notice = ref('');

const modal = ref<{ kind: ModalKind; account?: Account } | null>(null);
const modalError = ref('');
const submitting = ref(false);

const form = reactive({
  name: '',
  amount: '' as string | number,
  targetId: '',
  accountNumber: '',
  category: 'CASH' as SpendingCategoryId,
  description: '',
});

const fxForm = reactive({
  newCurrency: 'USD' as ForeignCurrencyCode,
  fromCurrency: 'COP' as CurrencyCode,
  toCurrency: 'USD' as CurrencyCode,
  amount: '' as string | number,
});

const remoteQuote = ref<ExchangeQuote | null>(null);
let quoteTimer: ReturnType<typeof setTimeout> | undefined;

// Transferencia a otra cuenta: se busca el titular en cuanto hay 10 dígitos.
const recipient = ref<AccountHolderInfo | null>(null);
const recipientError = ref('');
const lookingUp = ref(false);
const accountDigits = computed(() => form.accountNumber.replace(/\D/g, ''));

watch(accountDigits, async (digits) => {
  recipient.value = null;
  recipientError.value = '';
  if (digits.length !== 10) return;
  lookingUp.value = true;
  try {
    const found = await accountService.lookup(digits);
    if (accountDigits.value === digits) recipient.value = found;
  } catch (e) {
    if (accountDigits.value === digits) recipientError.value = errorMessage(e);
  } finally {
    lookingUp.value = false;
  }
});

// Garantiza que origen y destino nunca queden iguales al cambiar de moneda.
watch(
  () => fxForm.fromCurrency,
  (from) => {
    if (fxForm.toCurrency === from) {
      fxForm.toCurrency = from === 'COP' ? 'USD' : 'COP';
    }
  }
);

async function copyAccountNumber(n: string) {
  flash((await copyToClipboard(n)) ? 'Número de cuenta copiado' : `Tu número de cuenta es ${n}`);
}

const money = (value: number) => '$' + formatAmount(value);

const formatCurrency = (value: number, currency: CurrencyCode): string => {
  const meta = CURRENCY_META[currency];
  if (currency === 'COP') return '$' + formatAmount(value);
  return `${meta.symbol} ${formatAmount(value)}`;
};

const checking = computed(() => accounts.value.find((a) => a.type === 'CHECKING'));
const savings = computed(() => accounts.value.filter((a) => a.type === 'SAVINGS'));
const totalCopAccounts = computed(() => accounts.value.reduce((sum, a) => sum + a.balance, 0));
const savingsTotal = computed(() => savings.value.reduce((sum, a) => sum + a.balance, 0));
const consolidatedBalanceCop = computed(() => totalCopAccounts.value + totalForeignInCop.value);

const availableCurrenciesToOpen = computed(() => {
  const opened = new Set(currencyWallets.value.map((w) => w.currency));
  return FOREIGN_CURRENCY_LIST.filter((c) => !opened.has(c));
});

const hasWallet = (code: CurrencyCode): boolean =>
  code === 'COP' || currencyWallets.value.some((w) => w.currency === code);

const rateFor = (code: ForeignCurrencyCode): InternalExchangeRate | undefined =>
  internalRates.value.find((r) => r.currency === code);

const availableForCurrency = (code: CurrencyCode): number => {
  if (code === 'COP') return checking.value?.balance ?? 0;
  return currencyWallets.value.find((w) => w.currency === code)?.balance ?? 0;
};

/**
 * Calcula al instante la cotización usando las tasas internas cargadas, y la sincroniza
 * con el endpoint `/wallets/quote` del backend.
 */
const localQuote = computed<ExchangeQuote | null>(() => {
  const amount = parseMoney(fxForm.amount);
  if (!amount || amount <= 0 || fxForm.fromCurrency === fxForm.toCurrency) return null;

  const from = fxForm.fromCurrency;
  const to = fxForm.toCurrency;

  let midMarketRate = 0;
  let effectiveRate = 0;
  let spreadPercent = 0;

  if (from === 'COP') {
    const target = rateFor(to as ForeignCurrencyCode);
    if (!target) return null;
    midMarketRate = 1 / target.copRate;
    effectiveRate = 1 / target.buyCopRate;
    spreadPercent = target.spreadPercent;
  } else if (to === 'COP') {
    const source = rateFor(from as ForeignCurrencyCode);
    if (!source) return null;
    midMarketRate = source.copRate;
    effectiveRate = source.sellCopRate;
    spreadPercent = source.spreadPercent;
  } else {
    const source = rateFor(from as ForeignCurrencyCode);
    const target = rateFor(to as ForeignCurrencyCode);
    if (!source || !target) return null;
    midMarketRate = source.copRate / target.copRate;
    spreadPercent = (source.spreadPercent + target.spreadPercent) / 2;
    effectiveRate = midMarketRate * (1 - spreadPercent / 100);
  }

  const toAmount = Math.round(amount * effectiveRate * 100) / 100;
  if (toAmount <= 0) return null;

  return {
    fromCurrency: from,
    toCurrency: to,
    fromAmount: amount,
    toAmount,
    midMarketRate,
    effectiveRate,
    inverseRate: 1 / effectiveRate,
    spreadPercent,
    updatedAt: new Date().toISOString(),
  };
});

watch(
  () => [modal.value?.kind, fxForm.fromCurrency, fxForm.toCurrency, fxForm.amount] as const,
  ([kind, from, to, rawAmount]) => {
    remoteQuote.value = null;
    clearTimeout(quoteTimer);
    if (kind !== 'exchange' || from === to) return;
    const amount = parseMoney(rawAmount);
    if (!amount || amount <= 0) return;

    quoteTimer = setTimeout(async () => {
      try {
        const q = await walletService.quote(from, to, amount);
        if (
          modal.value?.kind === 'exchange' &&
          fxForm.fromCurrency === from &&
          fxForm.toCurrency === to &&
          parseMoney(fxForm.amount) === amount
        ) {
          remoteQuote.value = q;
        }
      } catch {
        // Fallback silencioso a localQuote
      }
    }, 220);
  }
);

const activeQuote = computed<ExchangeQuote | null>(() => remoteQuote.value ?? localQuote.value);

const quoteHint = computed(() => {
  const amount = parseMoney(fxForm.amount);
  if (!amount || amount <= 0) return 'Ingresa un monto para cotizar con la tasa interna.';
  if (!activeQuote.value) return 'El monto es muy bajo para generar al menos 0.01 en la moneda destino.';
  return '';
});

function formatQuoteRateLine(q: ExchangeQuote): string {
  if (q.fromCurrency === 'COP') {
    return `1 ${q.toCurrency} = ${money(q.inverseRate)} COP`;
  }
  if (q.toCurrency === 'COP') {
    return `1 ${q.fromCurrency} = ${money(q.effectiveRate)} COP`;
  }
  return `1 ${q.fromCurrency} = ${q.effectiveRate.toFixed(4)} ${q.toCurrency}`;
}

function formatMidRateLine(q: ExchangeQuote): string {
  if (q.fromCurrency === 'COP') {
    return `1 ${q.toCurrency} = ${money(1 / q.midMarketRate)} COP`;
  }
  if (q.toCurrency === 'COP') {
    return `1 ${q.fromCurrency} = ${money(q.midMarketRate)} COP`;
  }
  return `1 ${q.fromCurrency} = ${q.midMarketRate.toFixed(4)} ${q.toCurrency}`;
}

const interestClaimed = (acc: Account) => {
  if (!acc.lastInterestAt) return false;
  const last = new Date(acc.lastInterestAt);
  const now = new Date();
  return last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
};

const transferTargets = computed(() => {
  const from = modal.value?.account;
  if (!from) return [];
  return accounts.value.filter((a) => a.id !== from.id && (from.type === 'SAVINGS' || a.type === 'SAVINGS'));
});

const modalTitle = computed(() => {
  const name = modal.value?.account?.name ?? '';
  switch (modal.value?.kind) {
    case 'create': return 'Nueva cuenta de ahorros';
    case 'openWallet': return 'Abrir bolsillo en moneda extranjera';
    case 'exchange': return 'Convertir divisas con tasa interna';
    case 'deposit': return `Depositar en ${name}`;
    case 'withdraw': return `Retirar de ${name}`;
    case 'transfer': return `Transferir desde ${name}`;
    case 'external': return `Enviar a otra cuenta desde ${name}`;
    default: return '';
  }
});

const modalConfirmLabel = computed(() => {
  if (modal.value?.kind === 'openWallet') return `Activar ${fxForm.newCurrency}`;
  if (modal.value?.kind === 'exchange') return 'Confirmar conversión';
  return 'Confirmar';
});

const errorMessage = (e: any) => e?.response?.data?.message ?? 'No se pudo completar la operación';

function goToMovements(accountId: string) {
  router.push({ path: '/transactions', query: { account: accountId } });
}

function goToFxMovements(currency: ForeignCurrencyCode) {
  router.push({ path: '/transactions', query: { account: 'fx', currency } });
}

async function refresh() {
  const [accList, fxOverview] = await Promise.all([
    accountService.list(),
    walletService.overview(),
  ]);
  accounts.value = accList;
  currencyWallets.value = fxOverview.wallets;
  internalRates.value = fxOverview.rates;
  totalForeignInCop.value = fxOverview.totalForeignInCop;
}

function flash(message: string) {
  notice.value = message;
  setTimeout(() => (notice.value = ''), 4000);
}

function openModal(kind: ModalKind, account?: Account) {
  modal.value = { kind, account };
  modalError.value = '';
  form.name = '';
  form.amount = '';
  form.targetId = '';
  form.accountNumber = '';
  recipient.value = null;
  recipientError.value = '';
  form.category = 'CASH';
  form.description = '';
  if (kind === 'transfer') form.targetId = transferTargets.value[0]?.id ?? '';
  if (kind === 'openWallet') {
    fxForm.newCurrency = availableCurrenciesToOpen.value[0] ?? 'USD';
  }
}

function openExchangeModal(from: CurrencyCode, to: CurrencyCode) {
  modal.value = { kind: 'exchange' };
  modalError.value = '';
  fxForm.fromCurrency = from;
  fxForm.toCurrency = to === from ? (from === 'COP' ? 'USD' : 'COP') : to;
  fxForm.amount = '';
  remoteQuote.value = null;
}

function swapExchangeCurrencies() {
  const prevFrom = fxForm.fromCurrency;
  fxForm.fromCurrency = fxForm.toCurrency;
  fxForm.toCurrency = prevFrom;
  fxForm.amount = '';
  remoteQuote.value = null;
}

function fillMaxExchangeAmount() {
  const avail = availableForCurrency(fxForm.fromCurrency);
  if (avail > 0) {
    fxForm.amount = formatMoneyInput(avail);
  }
}

const closeModal = () => {
  modal.value = null;
  remoteQuote.value = null;
};

async function quickOpenCurrency(currency: ForeignCurrencyCode) {
  error.value = '';
  quickOpening.value = currency;
  try {
    await walletService.openWallet(currency);
    flash(`Billetera en ${currency} activada`);
    pushNotification({
      title: `Billetera ${currency} abierta`,
      message: `Activaste tu bolsillo en ${CURRENCY_META[currency].name} (${currency}).`,
      type: 'success',
    });
    await refresh();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    quickOpening.value = null;
  }
}

async function closeCurrencyWallet(w: CurrencyWallet) {
  error.value = '';
  try {
    await walletService.closeWallet(w.currency);
    flash(`Billetera en ${w.currency} cerrada`);
    await refresh();
  } catch (e) {
    error.value = errorMessage(e);
  }
}

async function submitModal() {
  if (!modal.value) return;
  const { kind, account } = modal.value;
  modalError.value = '';
  submitting.value = true;
  try {
    if (kind === 'create') {
      const created = await accountService.createSavings(form.name || undefined);
      flash('Cuenta de ahorros creada');
      pushNotification({
        title: 'Nueva cuenta de ahorros',
        message: `Se creó la cuenta «${created.name}» exitosamente.`,
        type: 'success',
      });
    } else if (kind === 'openWallet') {
      const opened = await walletService.openWallet(fxForm.newCurrency);
      flash(`Billetera en ${opened.currency} activada`);
      pushNotification({
        title: `Billetera ${opened.currency} abierta`,
        message: `Ya puedes mantener saldo y convertir en ${opened.name}.`,
        type: 'success',
      });
    } else if (kind === 'exchange') {
      const amount = parseMoney(fxForm.amount) ?? NaN;
      if (!Number.isFinite(amount) || amount <= 0) {
        throw { response: { data: { message: 'Ingresa un monto válido para convertir' } } };
      }
      const res = await walletService.exchange(fxForm.fromCurrency, fxForm.toCurrency, amount);
      const fromText = formatCurrency(res.conversion.fromAmount, res.conversion.fromCurrency);
      const toText = formatCurrency(res.conversion.toAmount, res.conversion.toCurrency);
      flash(`Convertiste ${fromText} → ${toText}`);
      pushNotification({
        title: 'Conversión multimoneda exitosa',
        message: `Cambiaste ${fromText} y recibiste ${toText} con tasa interna NOVA.`,
        type: 'success',
      });
    } else {
      const amount = parseMoney(form.amount) ?? NaN;
      if (!Number.isFinite(amount) || amount <= 0) throw { response: { data: { message: 'Ingresa un monto válido' } } };
      if (kind === 'deposit') {
        await accountService.deposit(account!.id, amount);
        pushNotification({ title: 'Depósito exitoso', message: `Ingresaste ${money(amount)} en «${account!.name}».`, type: 'success' });
      }
      if (kind === 'withdraw') {
        const catMeta = getCategoryById(form.category);
        const autoDesc = form.category === 'CASH' ? 'Retiro en efectivo' : `Gasto en ${catMeta?.label ?? 'Otros'}`;
        const finalDesc = form.description.trim() || autoDesc;
        await accountService.withdraw(account!.id, amount, {
          category: form.category,
          description: finalDesc,
        });
        pushNotification({
          title: 'Gasto / retiro registrado',
          message: `Retiraste ${money(amount)} (${catMeta?.label ?? 'Efectivo'}) de «${account!.name}».`,
          type: 'info',
        });
      }
      if (kind === 'transfer') {
        const destName = accounts.value.find((a) => a.id === form.targetId)?.name ?? 'otra cuenta';
        await accountService.transfer(account!.id, form.targetId, amount);
        pushNotification({ title: 'Transferencia exitosa', message: `Transferiste ${money(amount)} de «${account!.name}» a «${destName}».`, type: 'success' });
      }
      if (kind === 'external') {
        if (!recipient.value) throw { response: { data: { message: 'Verifica el número de cuenta de destino' } } };
        const { to } = await accountService.transferExternal(account!.id, accountDigits.value, amount);
        pushNotification({
          title: 'Transferencia enviada',
          message: `Enviaste ${money(amount)} a ${to.holderName} (cta ${formatAccountNumber(to.accountNumber)}).`,
          type: 'success',
        });
      }
      flash('Operación realizada');
    }
    closeModal();
    await refresh();
  } catch (e) {
    modalError.value = errorMessage(e);
  } finally {
    submitting.value = false;
  }
}

async function claimInterest(acc: Account) {
  error.value = '';
  try {
    const { interest } = await accountService.creditInterest(acc.id);
    flash(`Se acreditaron ${money(interest)} de intereses`);
    pushNotification({
      title: 'Intereses acreditados',
      message: `Se abonaron ${money(interest)} de intereses mensuales en «${acc.name}».`,
      type: 'success',
    });
    await refresh();
  } catch (e) {
    error.value = errorMessage(e);
  }
}

onMounted(async () => {
  try {
    await refresh();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.wallet-view { padding: 1.5rem; color: #e5e7eb; max-width: 1140px; margin: 0 auto; }
.wallet-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.35rem; }
.page-title { font-size: 1.6rem; font-weight: 700; color: #f0f4ff; margin: 0 0 0.35rem; }
.page-description { color: rgba(255,255,255,0.5); font-size: 0.92rem; margin: 0; max-width: 620px; }

.btn { border: none; border-radius: 10px; padding: 0.65rem 1.05rem; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: transform 0.15s, opacity 0.15s, background 0.15s, border-color 0.15s; }
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn--sm { padding: 0.5rem 0.9rem; font-size: 0.8rem; }
.btn--accent { background: linear-gradient(135deg, #00e5c0, #2563eb); color: #06101c; }
.btn--teal { background: rgba(0,229,192,0.14); border: 1px solid rgba(0,229,192,0.45); color: #5eead4; }
.btn--teal:hover:not(:disabled) { background: rgba(0,229,192,0.22); }
.btn--ghost { background: rgba(255,255,255,0.06); color: #e5e7eb; }

.banner { padding: 0.7rem 1rem; border-radius: 10px; font-size: 0.875rem; margin: 0 0 1rem; }
.banner--error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: #fca5a5; }
.banner--ok { background: rgba(0,229,192,0.1); border: 1px solid rgba(0,229,192,0.35); color: #5eead4; }

.empty { padding: 2rem; text-align: center; color: rgba(255,255,255,0.4); }

.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.75rem; }
.summary__card { background: #131a26; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.3rem; }
.summary__card--total { background: linear-gradient(135deg, rgba(0,229,192,0.16), rgba(37,99,235,0.2)); border-color: rgba(0,229,192,0.3); }
.summary__card--fx { background: linear-gradient(135deg, rgba(56,189,248,0.1), rgba(99,102,241,0.14)); border-color: rgba(96,165,250,0.28); }
.summary__label { font-size: 0.75rem; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.04em; }
.summary__value { font-size: 1.4rem; color: #fff; }
.summary__sub { font-size: 0.74rem; color: rgba(255,255,255,0.5); }

.section-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
.section-heading__title { margin: 0; font-size: 1.12rem; font-weight: 700; color: #f0f4ff; }
.section-heading__sub { margin: 0.2rem 0 0; font-size: 0.83rem; color: rgba(255,255,255,0.45); }

.accounts { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1rem; margin-bottom: 2.2rem; }
.account { background: #131a26; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.25rem; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
.account:hover { transform: translateY(-2px); border-color: rgba(0,229,192,0.35); }
.account__top { display: flex; justify-content: space-between; align-items: center; }
.account__badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; background: rgba(37,99,235,0.2); color: #93c5fd; }
.account--savings .account__badge { background: rgba(0,229,192,0.15); color: #5eead4; }
.account__rate { font-size: 0.78rem; font-weight: 700; color: #00e5c0; }
.account__name { margin: 0.8rem 0 0.2rem; font-size: 1rem; color: #e5e7eb; font-weight: 600; }
.account__number { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.35rem; font-size: 0.8rem; color: rgba(255,255,255,0.55); font-variant-numeric: tabular-nums; letter-spacing: 0.02em; cursor: default; }
.account__copy { border: none; background: transparent; color: #5eead4; font-size: 0.72rem; font-weight: 600; cursor: pointer; padding: 0.1rem 0.3rem; border-radius: 6px; }
.account__copy:hover { background: rgba(0,229,192,0.12); }
.account__balance { margin: 0 0 1rem; font-size: 1.7rem; font-weight: 700; color: #fff; }
.account__actions { display: flex; flex-wrap: wrap; gap: 0.45rem; }

.chip { border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); color: #e5e7eb; border-radius: 999px; padding: 0.38rem 0.8rem; font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
.chip:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
.chip:disabled { opacity: 0.45; cursor: not-allowed; }
.chip--accent { border-color: rgba(0,229,192,0.45); color: #5eead4; }
.chip--send { border-color: rgba(96,165,250,0.45); color: #93c5fd; }
.chip--danger { border-color: rgba(248,113,113,0.35); color: #fca5a5; }
.chip--danger:hover:not(:disabled) { background: rgba(239,68,68,0.15); }

/* ===== MULTIMONEDA ===== */
.fx-section { padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); }
.fx-section__actions { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; }
.fx-movements-link { font-size: 0.8rem; font-weight: 600; color: #5eead4; text-decoration: none; }
.fx-movements-link:hover { text-decoration: underline; }
.fx-layout { display: grid; grid-template-columns: 1fr 370px; gap: 1.15rem; align-items: start; }

@media (max-width: 920px) {
  .fx-layout { grid-template-columns: 1fr; }
}

.fx-empty { background: #131a26; border: 1px dashed rgba(0,229,192,0.3); border-radius: 18px; padding: 1.8rem 1.5rem; text-align: center; }
.fx-empty__icon { font-size: 2.1rem; margin-bottom: 0.4rem; }
.fx-empty__title { margin: 0 0 0.4rem; font-size: 1.05rem; color: #f0f4ff; }
.fx-empty__desc { margin: 0 auto 1.2rem; max-width: 470px; font-size: 0.84rem; color: rgba(255,255,255,0.52); line-height: 1.5; }
.fx-quick-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.55rem; }
.fx-pill { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.5rem 0.9rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); color: #f0f4ff; font-size: 0.82rem; cursor: pointer; transition: border-color 0.15s, background 0.15s, transform 0.15s; }
.fx-pill:hover:not(:disabled) { border-color: #00e5c0; background: rgba(0,229,192,0.1); transform: translateY(-1px); }
.fx-pill__plus { font-size: 0.72rem; color: #5eead4; font-weight: 600; }

.fx-wallets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.fx-card { position: relative; background: #131a26; border: 1px solid rgba(255,255,255,0.08); border-top: 3px solid var(--fx-accent, #00e5c0); border-radius: 16px; padding: 1.2rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.95rem; transition: transform 0.2s, border-color 0.2s; }
.fx-card--clickable { cursor: pointer; }
.fx-card:hover { transform: translateY(-2px); border-color: rgba(0,229,192,0.3); }
.fx-card__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
.fx-card__identity { display: flex; align-items: center; gap: 0.6rem; }
.fx-card__flag { font-size: 1.55rem; line-height: 1; }
.fx-card__code { display: block; font-size: 0.98rem; color: #fff; letter-spacing: 0.02em; }
.fx-card__name { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.48); }
.fx-card__rate-tag { font-size: 0.68rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 999px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.65); white-space: nowrap; }
.fx-card__balance { margin: 0; font-size: 1.55rem; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
.fx-card__equiv { margin: 0.2rem 0 0; font-size: 0.76rem; color: rgba(255,255,255,0.48); }
.fx-card__actions { display: flex; flex-wrap: wrap; gap: 0.45rem; }

.fx-card--add { border: 1px dashed rgba(255,255,255,0.18); background: rgba(255,255,255,0.02); align-items: center; justify-content: center; text-align: center; cursor: pointer; min-height: 175px; color: #e5e7eb; }
.fx-card--add:hover { border-color: #00e5c0; background: rgba(0,229,192,0.05); }
.fx-card__add-plus { width: 38px; height: 38px; border-radius: 50%; background: rgba(0,229,192,0.14); color: #5eead4; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 700; }
.fx-card__add-sub { font-size: 0.74rem; color: rgba(255,255,255,0.45); }

/* Panel de tasas internas */
.fx-rates-panel { background: #131a26; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.15rem 1.2rem; }
.fx-rates-panel__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.85rem; }
.fx-rates-panel__title { margin: 0; font-size: 0.96rem; color: #f0f4ff; font-weight: 700; }
.fx-rates-panel__sub { margin: 0.15rem 0 0; font-size: 0.73rem; color: rgba(255,255,255,0.45); }
.fx-live-badge { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.06em; padding: 0.18rem 0.5rem; border-radius: 999px; background: rgba(0,229,192,0.14); color: #00e5c0; border: 1px solid rgba(0,229,192,0.3); }

.fx-rates-table { display: flex; flex-direction: column; gap: 0.35rem; }
.fx-rates-row { display: grid; grid-template-columns: 1.2fr 1fr 1fr auto; align-items: center; gap: 0.5rem; padding: 0.55rem 0.4rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; }
.fx-rates-row:last-child { border-bottom: none; }
.fx-rates-row--head { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; color: rgba(255,255,255,0.42); padding-top: 0.15rem; padding-bottom: 0.4rem; }
.fx-rates-currency { display: flex; align-items: center; gap: 0.45rem; }
.fx-rates-currency__flag { font-size: 1.15rem; }
.fx-rates-currency strong { display: block; font-size: 0.82rem; color: #f0f4ff; }
.fx-rates-currency small { display: block; font-size: 0.67rem; color: rgba(255,255,255,0.42); }
.fx-rates-val { font-variant-numeric: tabular-nums; color: #e5e7eb; font-weight: 600; font-size: 0.79rem; }
.text-right { text-align: right; }
.fx-mini-btn { border: 1px solid rgba(0,229,192,0.35); background: rgba(0,229,192,0.08); color: #5eead4; border-radius: 8px; padding: 0.28rem 0.55rem; font-size: 0.7rem; font-weight: 600; cursor: pointer; }
.fx-mini-btn:hover { background: rgba(0,229,192,0.18); }

/* Modales */
.recipient { margin: -0.4rem 0 0; display: flex; flex-direction: column; gap: 0.15rem; padding: 0.65rem 0.8rem; border-radius: 10px; background: rgba(0,229,192,0.08); border: 1px solid rgba(0,229,192,0.3); font-size: 0.85rem; color: #e5e7eb; }
.recipient__label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #5eead4; }
.recipient__type { font-size: 0.75rem; color: rgba(255,255,255,0.55); }
.hint--error { color: #fca5a5; }

.overlay { position: fixed; inset: 0; background: rgba(5,8,15,0.72); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem; }
.modal { width: 100%; max-width: 400px; max-height: 90vh; overflow-y: auto; background: #131a26; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.modal--wide { max-width: 500px; }
.modal__title { margin: 0; font-size: 1.12rem; color: #f0f4ff; }
.modal__actions { display: flex; justify-content: flex-end; gap: 0.6rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; color: rgba(255,255,255,0.65); }
.field__row { display: flex; justify-content: space-between; align-items: center; }
.field input, .field select { background: #0d1117; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0.65rem 0.8rem; color: #fff; font-size: 0.94rem; }
.field input:focus, .field select:focus { outline: none; border-color: #00e5c0; }
.hint { margin: -0.35rem 0 0; font-size: 0.78rem; color: rgba(255,255,255,0.45); }

/* Modal abrir divisa */
.open-fx-grid { display: flex; flex-direction: column; gap: 0.5rem; }
.open-fx-option { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.8rem; padding: 0.75rem 0.9rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: #0d1117; color: #e5e7eb; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.open-fx-option:hover { border-color: rgba(255,255,255,0.28); }
.open-fx-option--active { border-color: #00e5c0; background: rgba(0,229,192,0.1); }
.open-fx-option__flag { font-size: 1.5rem; }
.open-fx-option__info strong { display: block; font-size: 0.9rem; color: #fff; }
.open-fx-option__info small { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
.open-fx-option__symbol { font-size: 0.95rem; font-weight: 700; color: #5eead4; }

/* Modal conversor */
.fx-converter { display: flex; flex-direction: column; gap: 0.95rem; }
.fx-converter__selectors { display: flex; flex-direction: column; gap: 0.55rem; }
.fx-avail { font-size: 0.74rem; color: rgba(255,255,255,0.48); }
.fx-avail strong { color: #e5e7eb; }
.fx-swap-btn { align-self: center; width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(0,229,192,0.4); background: rgba(0,229,192,0.1); color: #00e5c0; font-size: 1rem; font-weight: 700; cursor: pointer; transition: transform 0.2s, background 0.15s; }
.fx-swap-btn:hover { transform: rotate(180deg); background: rgba(0,229,192,0.2); }
.fx-max-btn { border: none; background: transparent; color: #5eead4; font-size: 0.74rem; font-weight: 600; cursor: pointer; padding: 0; }
.fx-max-btn:hover { text-decoration: underline; }

.fx-quote-box { background: rgba(0,229,192,0.06); border: 1px solid rgba(0,229,192,0.28); border-radius: 12px; padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.8rem; }
.fx-quote-box__row { display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.68); }
.fx-quote-box__row strong { color: #f0f4ff; }
.fx-quote-box__result { margin-top: 0.35rem; padding-top: 0.55rem; border-top: 1px solid rgba(0,229,192,0.2); display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
.fx-quote-box__result span { font-size: 0.78rem; color: #5eead4; font-weight: 600; }
.fx-quote-box__result strong { font-size: 1.25rem; color: #00e5c0; font-variant-numeric: tabular-nums; }

.cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.45rem; margin-top: 0.15rem; }
.cat-option { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.55rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: #0d1117; color: rgba(255,255,255,0.75); font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; text-align: left; }
.cat-option:hover { border-color: rgba(255,255,255,0.25); color: #fff; }
.cat-option--active { color: #fff; }
.cat-option__icon { font-size: 0.95rem; line-height: 1; flex-shrink: 0; }
.cat-option__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
