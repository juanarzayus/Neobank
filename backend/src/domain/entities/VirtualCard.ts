import { BusinessRuleError, ValidationError } from '../errors/DomainError';
import { Money, roundMoney } from '../value-objects/Money';
import { parseSpendingCategoryList, type SpendingCategory } from '../value-objects/SpendingCategory';

export const CARD_STATUSES = ['ACTIVE', 'FROZEN', 'CANCELLED'] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export interface SpendingRules {
  /** 0 = sin límite mensual. */
  monthlyLimit: number;
  /** null = sin límite diario. */
  dailyLimit: number | null;
  internationalAllowed: boolean;
  blockedCategories: SpendingCategory[];
  /** Si es true, cuando el saldo prepago no alcance se debita el faltante de la cuenta principal. */
  autoDebitFromAccount: boolean;
}

export interface VirtualCardProps {
  id: string;
  userId: string;
  /** Token criptográfico único que identifica la tarjeta (ej. tok_np_...). */
  cardToken: string;
  /** Últimos 4 dígitos del PAN (ej. 1234). */
  last4: string;
  /** PAN sellado en la bóveda criptográfica (AES-256-GCM). */
  encryptedPan: string;
  /** CVV sellado en la bóveda criptográfica (AES-256-GCM). */
  encryptedCvv: string;
  cardholderName: string;
  expirationDate: string;
  status: CardStatus;
  /** Saldo prepago cargado en la tarjeta. */
  prepaidBalance: number;
  rules: SpendingRules;
  /** Gasto acumulado dentro de spendingPeriod. */
  currentSpending: number;
  /** Mes al que corresponde currentSpending (YYYY-MM-01). */
  spendingPeriod: string;
  createdAt: Date;
}

export type NewVirtualCard = Omit<VirtualCardProps, 'id' | 'status' | 'currentSpending' | 'createdAt'>;

export interface SpendingRulesInput {
  monthlyLimit: number;
  dailyLimit: number | null;
  internationalAllowed: boolean;
  blockedCategories: string[];
  autoDebitFromAccount?: boolean;
}

export interface PurchaseAttempt {
  amount: number;
  category: SpendingCategory;
  isInternational: boolean;
  /** Lo que la tarjeta ya gastó hoy (solo importa si tiene límite diario). */
  spentToday: number;
}

export type PurchaseDecision = { approved: true } | { approved: false; reason: string };

const MAX_HOLDER_NAME_LENGTH = 100;
const MAX_MERCHANT_NAME_LENGTH = 100;
const DEFAULT_MERCHANT_NAME = 'Comercio';

const reject = (reason: string): PurchaseDecision => ({ approved: false, reason });

export class VirtualCard {
  readonly id: string;
  readonly userId: string;
  readonly cardToken: string;
  readonly last4: string;
  readonly encryptedPan: string;
  readonly encryptedCvv: string;
  readonly cardholderName: string;
  readonly expirationDate: string;
  readonly createdAt: Date;
  private _status: CardStatus;
  private _prepaidBalance: number;
  private _rules: SpendingRules;
  private _currentSpending: number;
  private _spendingPeriod: string;

  constructor(props: VirtualCardProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.cardToken = props.cardToken;
    this.last4 = props.last4;
    this.encryptedPan = props.encryptedPan;
    this.encryptedCvv = props.encryptedCvv;
    this.cardholderName = props.cardholderName;
    this.expirationDate = props.expirationDate;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._prepaidBalance = roundMoney(props.prepaidBalance);
    this._rules = { ...props.rules, blockedCategories: [...props.rules.blockedCategories] };
    this._currentSpending = props.currentSpending;
    this._spendingPeriod = props.spendingPeriod;
  }

  get status(): CardStatus {
    return this._status;
  }

  get prepaidBalance(): number {
    return this._prepaidBalance;
  }

  get rules(): SpendingRules {
    return { ...this._rules, blockedCategories: [...this._rules.blockedCategories] };
  }

  get currentSpending(): number {
    return this._currentSpending;
  }

  get spendingPeriod(): string {
    return this._spendingPeriod;
  }

  get maskedNumber(): string {
    return `**** **** **** ${this.last4}`;
  }

  get hasDailyLimit(): boolean {
    return this._rules.dailyLimit !== null && this._rules.dailyLimit > 0;
  }

  // ---------- Reglas de creación / validación ----------

  static normalizeCardholderName(raw: string): string {
    const name = raw.trim();
    if (!name) throw new ValidationError('El nombre del titular es obligatorio');
    if (name.length > MAX_HOLDER_NAME_LENGTH) throw new ValidationError('El nombre del titular es demasiado largo');
    return name.toUpperCase();
  }

  static createRules(input: SpendingRulesInput): SpendingRules {
    return {
      monthlyLimit: Money.spendingLimit(input.monthlyLimit, 'Límite mensual'),
      dailyLimit: input.dailyLimit === null ? null : Money.spendingLimit(input.dailyLimit, 'Límite diario'),
      internationalAllowed: input.internationalAllowed,
      blockedCategories: parseSpendingCategoryList(input.blockedCategories),
      autoDebitFromAccount: input.autoDebitFromAccount ?? false,
    };
  }

  static parseStatus(value: string): CardStatus {
    if (!(CARD_STATUSES as readonly string[]).includes(value)) {
      throw new ValidationError(`Estado inválido (${CARD_STATUSES.join(', ')})`);
    }
    return value as CardStatus;
  }

  static normalizeMerchantName(raw: string | undefined): string {
    const name = raw?.trim() || DEFAULT_MERCHANT_NAME;
    if (name.length > MAX_MERCHANT_NAME_LENGTH) {
      throw new ValidationError('El nombre del comercio es demasiado largo');
    }
    return name;
  }

  // ---------- Comportamiento ----------

  updateRules(changes: Partial<SpendingRulesInput>): void {
    const merged: SpendingRulesInput = { ...this._rules, ...changes };
    this._rules = VirtualCard.createRules(merged);
  }

  changeStatus(status: CardStatus): void {
    if (this._status === 'CANCELLED' && status !== 'CANCELLED') {
      throw new BusinessRuleError('Una tarjeta cancelada no puede reactivarse');
    }
    this._status = status;
  }

  /** Carga saldo prepago en la tarjeta. */
  topUp(amount: number): void {
    if (this._status === 'CANCELLED') {
      throw new BusinessRuleError('No se puede recargar una tarjeta cancelada');
    }
    this._prepaidBalance = roundMoney(this._prepaidBalance + amount);
  }

  /** Descarga saldo prepago de la tarjeta para devolverlo a la cuenta principal. */
  unload(amount: number): void {
    if (this._prepaidBalance < amount) {
      throw new BusinessRuleError(`Saldo prepago insuficiente en la tarjeta (disponible: $${this._prepaidBalance.toFixed(2)})`);
    }
    this._prepaidBalance = roundMoney(this._prepaidBalance - amount);
  }

  /** Extrae todo el saldo prepago remanente (p. ej. al cancelar o eliminar la tarjeta). */
  drainPrepaidBalance(): number {
    const remaining = this._prepaidBalance;
    this._prepaidBalance = 0;
    return remaining;
  }

  /**
   * Si cambió el mes, reinicia el gasto acumulado. Devuelve true si hubo reinicio
   * (es decir, si la tarjeta debe persistirse).
   */
  rollSpendingPeriod(currentPeriod: string): boolean {
    if (this._spendingPeriod >= currentPeriod) return false;
    this._spendingPeriod = currentPeriod;
    this._currentSpending = 0;
    return true;
  }

  /** Aplica las reglas de la tarjeta a una compra, en orden. No modifica el estado. */
  evaluatePurchase(attempt: PurchaseAttempt): PurchaseDecision {
    const { monthlyLimit, dailyLimit, internationalAllowed, blockedCategories, autoDebitFromAccount } = this._rules;

    if (this._status === 'CANCELLED') return reject('Tarjeta cancelada');
    if (this._status === 'FROZEN') return reject('Tarjeta congelada');
    if (attempt.isInternational && !internationalAllowed) {
      return reject('Compras internacionales desactivadas en esta tarjeta');
    }
    if (blockedCategories.includes(attempt.category)) {
      return reject('Categoría de comercio bloqueada en esta tarjeta');
    }
    if (monthlyLimit > 0 && roundMoney(this._currentSpending + attempt.amount) > monthlyLimit) {
      return reject(`Límite mensual superado ($${monthlyLimit.toFixed(2)})`);
    }
    if (this.hasDailyLimit && dailyLimit !== null && roundMoney(attempt.spentToday + attempt.amount) > dailyLimit) {
      return reject(`Límite diario superado ($${dailyLimit.toFixed(2)})`);
    }
    if (!autoDebitFromAccount && this._prepaidBalance < attempt.amount) {
      return reject(
        `Saldo prepago insuficiente en la tarjeta (disponible: $${this._prepaidBalance.toFixed(2)}). Recárgala o habilita el débito automático de cuenta`
      );
    }
    return { approved: true };
  }

  /** Calcula cuánto se cubre con el saldo prepago de la tarjeta y cuánto debe cubrir la cuenta principal. */
  splitPayment(amount: number): { fromPrepaid: number; fromAccount: number } {
    const fromPrepaid = roundMoney(Math.min(this._prepaidBalance, amount));
    const fromAccount = roundMoney(amount - fromPrepaid);
    return { fromPrepaid, fromAccount };
  }

  registerPurchase(amount: number, fromPrepaid: number = 0): void {
    if (fromPrepaid > 0) {
      this._prepaidBalance = roundMoney(Math.max(0, this._prepaidBalance - fromPrepaid));
    }
    this._currentSpending = roundMoney(this._currentSpending + amount);
  }

  /** Descripción del movimiento de pago (el frontend la interpreta: "Pago: <comercio> [<id>]"). */
  paymentDescription(merchantName: string): string {
    return `Pago: ${merchantName} [${this.id}]`;
  }

  topUpDescription(): string {
    return `Recarga tarjeta prepago •••• ${this.last4}`;
  }

  unloadDescription(): string {
    return `Descarga tarjeta prepago •••• ${this.last4}`;
  }

  refundOnCloseDescription(): string {
    return `Reembolso cierre tarjeta prepago •••• ${this.last4}`;
  }
}
