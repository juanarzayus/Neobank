<template>
  <div class="wallet-view">
    <header class="wallet-header">
      <div>
        <h1 class="page-title">Billetera</h1>
        <p class="page-description">Tu cuenta principal y tus cuentas de ahorro con intereses del 4% EA.</p>
      </div>
      <button id="btn-new-savings" class="btn btn--accent" type="button" @click="openModal('create')">
        + Nueva cuenta de ahorros
      </button>
    </header>

    <p v-if="error" class="banner banner--error" role="alert">{{ error }}</p>
    <p v-if="notice" class="banner banner--ok" role="status">{{ notice }}</p>

    <div v-if="loading" class="empty">Cargando cuentas…</div>

    <template v-else>
      <section class="summary" aria-label="Resumen">
        <div class="summary__card summary__card--total">
          <span class="summary__label">Saldo total</span>
          <strong class="summary__value">{{ money(totalBalance) }}</strong>
        </div>
        <div class="summary__card">
          <span class="summary__label">Cuenta principal</span>
          <strong class="summary__value">{{ money(checking?.balance ?? 0) }}</strong>
        </div>
        <div class="summary__card">
          <span class="summary__label">En ahorros</span>
          <strong class="summary__value">{{ money(savingsTotal) }}</strong>
        </div>
      </section>

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
            <span class="account__badge">{{ acc.type === 'CHECKING' ? 'Principal' : 'Ahorros' }}</span>
            <span v-if="acc.type === 'SAVINGS'" class="account__rate">{{ (acc.annualRate * 100).toFixed(2) }}% EA</span>
          </div>
          <h2 class="account__name">{{ acc.name }}</h2>
          <p class="account__balance">{{ money(acc.balance) }}</p>

          <div class="account__actions" @click.stop>
            <template v-if="acc.type === 'CHECKING'">
              <button class="chip" type="button" @click="openModal('deposit', acc)">Depositar</button>
              <button class="chip" type="button" @click="openModal('withdraw', acc)">Retirar</button>
              <button class="chip" type="button" :disabled="savings.length === 0" @click="openModal('transfer', acc)">
                Enviar a ahorros
              </button>
            </template>
            <template v-else>
              <button class="chip" type="button" @click="openModal('transfer', acc)">Transferir</button>
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
    </template>

    <!-- Modal de acciones -->
    <div v-if="modal" class="overlay" @click.self="closeModal">
      <form class="modal" :class="{ 'modal--wide': modal.kind === 'withdraw' }" @submit.prevent="submitModal">
        <h3 class="modal__title">{{ modalTitle }}</h3>

        <label v-if="modal.kind === 'create'" class="field">
          <span>Nombre de la cuenta</span>
          <input id="field-name" v-model="form.name" type="text" maxlength="100" placeholder="Ej. Fondo de emergencia" />
        </label>

        <template v-else>
          <label v-if="modal.kind === 'transfer'" class="field">
            <span>Destino</span>
            <select id="field-target" v-model="form.targetId" required>
              <option v-for="t in transferTargets" :key="t.id" :value="t.id">{{ t.name }} ({{ money(t.balance) }})</option>
            </select>
          </label>
          <label class="field">
            <span>Monto (COP)</span>
            <input id="field-amount" :value="form.amount" @input="form.amount = onMoneyInput($event)" type="text" inputmode="decimal" placeholder="Ej: 1,500.00" required autofocus />
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
          <button id="btn-confirm" class="btn btn--accent" type="submit" :disabled="submitting">
            {{ submitting ? 'Procesando…' : 'Confirmar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { accountService } from '@/services/accountService';
import type { Account } from '@/types/accounts';
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

type ModalKind = 'create' | 'deposit' | 'withdraw' | 'transfer';

const router = useRouter();
const accounts = ref<Account[]>([]);
const loading = ref(true);
const error = ref('');
const notice = ref('');

const modal = ref<{ kind: ModalKind; account?: Account } | null>(null);
const modalError = ref('');
const submitting = ref(false);
const form = reactive({
  name: '',
  amount: '' as string | number,
  targetId: '',
  category: 'CASH' as SpendingCategoryId,
  description: '',
});

const money = (value: number) =>
  '$' + formatAmount(value);

const checking = computed(() => accounts.value.find((a) => a.type === 'CHECKING'));
const savings = computed(() => accounts.value.filter((a) => a.type === 'SAVINGS'));
const totalBalance = computed(() => accounts.value.reduce((sum, a) => sum + a.balance, 0));
const savingsTotal = computed(() => savings.value.reduce((sum, a) => sum + a.balance, 0));

const interestClaimed = (acc: Account) => {
  if (!acc.lastInterestAt) return false;
  const last = new Date(acc.lastInterestAt);
  const now = new Date();
  return last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
};

const transferTargets = computed(() => {
  const from = modal.value?.account;
  if (!from) return [];
  // Principal -> ahorros; ahorros -> cualquier otra cuenta propia.
  return accounts.value.filter((a) => a.id !== from.id && (from.type === 'SAVINGS' || a.type === 'SAVINGS'));
});

const modalTitle = computed(() => {
  const name = modal.value?.account?.name ?? '';
  switch (modal.value?.kind) {
    case 'create': return 'Nueva cuenta de ahorros';
    case 'deposit': return `Depositar en ${name}`;
    case 'withdraw': return `Retirar de ${name}`;
    case 'transfer': return `Transferir desde ${name}`;
    default: return '';
  }
});

const errorMessage = (e: any) => e?.response?.data?.message ?? 'No se pudo completar la operación';

function goToMovements(accountId: string) {
  router.push({ path: '/transactions', query: { account: accountId } });
}

async function refresh() {
  accounts.value = await accountService.list();
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
  form.category = 'CASH';
  form.description = '';
  if (kind === 'transfer') form.targetId = transferTargets.value[0]?.id ?? '';
}

const closeModal = () => (modal.value = null);

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
        const destName = accounts.value.find(a => a.id === form.targetId)?.name ?? 'otra cuenta';
        await accountService.transfer(account!.id, form.targetId, amount);
        pushNotification({ title: 'Transferencia exitosa', message: `Transferiste ${money(amount)} de «${account!.name}» a «${destName}».`, type: 'success' });
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
.wallet-view { padding: 1.5rem; color: #e5e7eb; max-width: 1100px; margin: 0 auto; }
.wallet-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
.page-title { font-size: 1.6rem; font-weight: 700; color: #f0f4ff; margin: 0 0 0.35rem; }
.page-description { color: rgba(255,255,255,0.5); font-size: 0.95rem; margin: 0; }

.btn { border: none; border-radius: 10px; padding: 0.65rem 1.1rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: transform 0.15s, opacity 0.15s, background 0.15s; }
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--accent { background: linear-gradient(135deg, #00e5c0, #2563eb); color: #06101c; }
.btn--ghost { background: rgba(255,255,255,0.06); color: #e5e7eb; }

.banner { padding: 0.7rem 1rem; border-radius: 10px; font-size: 0.875rem; margin: 0 0 1rem; }
.banner--error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: #fca5a5; }
.banner--ok { background: rgba(0,229,192,0.1); border: 1px solid rgba(0,229,192,0.35); color: #5eead4; }

.empty { padding: 2rem; text-align: center; color: rgba(255,255,255,0.4); }

.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.summary__card { background: #131a26; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.35rem; }
.summary__card--total { background: linear-gradient(135deg, rgba(0,229,192,0.16), rgba(37,99,235,0.2)); border-color: rgba(0,229,192,0.3); }
.summary__label { font-size: 0.78rem; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.04em; }
.summary__value { font-size: 1.45rem; color: #fff; }

.accounts { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.75rem; }
.account { background: #131a26; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.25rem; cursor: pointer; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
.account:hover { transform: translateY(-2px); border-color: rgba(0,229,192,0.35); }
.account__top { display: flex; justify-content: space-between; align-items: center; }
.account__badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; background: rgba(37,99,235,0.2); color: #93c5fd; }
.account--savings .account__badge { background: rgba(0,229,192,0.15); color: #5eead4; }
.account__rate { font-size: 0.78rem; font-weight: 700; color: #00e5c0; }
.account__name { margin: 0.8rem 0 0.2rem; font-size: 1rem; color: #e5e7eb; font-weight: 600; }
.account__balance { margin: 0 0 1rem; font-size: 1.7rem; font-weight: 700; color: #fff; }
.account__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.chip { border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); color: #e5e7eb; border-radius: 999px; padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.chip:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
.chip:disabled { opacity: 0.45; cursor: not-allowed; }
.chip--accent { border-color: rgba(0,229,192,0.45); color: #5eead4; }

.overlay { position: fixed; inset: 0; background: rgba(5,8,15,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem; }
.modal { width: 100%; max-width: 400px; max-height: 90vh; overflow-y: auto; background: #131a26; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.modal--wide { max-width: 460px; }
.modal__title { margin: 0; font-size: 1.1rem; color: #f0f4ff; }
.modal__actions { display: flex; justify-content: flex-end; gap: 0.6rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; color: rgba(255,255,255,0.6); }
.field input, .field select { background: #0d1117; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0.65rem 0.8rem; color: #fff; font-size: 0.95rem; }
.field input:focus, .field select:focus { outline: none; border-color: #00e5c0; }
.hint { margin: -0.4rem 0 0; font-size: 0.78rem; color: rgba(255,255,255,0.45); }

.cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.45rem; margin-top: 0.15rem; }
.cat-option { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.55rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: #0d1117; color: rgba(255,255,255,0.75); font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; text-align: left; }
.cat-option:hover { border-color: rgba(255,255,255,0.25); color: #fff; }
.cat-option--active { color: #fff; }
.cat-option__icon { font-size: 0.95rem; line-height: 1; flex-shrink: 0; }
.cat-option__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
