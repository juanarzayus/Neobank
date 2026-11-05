import { ValidationError } from '../errors/DomainError';
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
}

export interface VirtualCardProps {
  id: string;
  userId: string;
  cardNumber: string;
  cardholderName: string;
  expirationDate: string;
  cvv: string;
  status: CardStatus;
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
  readonly cardNumber: string;
  readonly cardholderName: string;
  readonly expirationDate: string;
  readonly cvv: string;
  readonly createdAt: Date;
  private _status: CardStatus;
  private _rules: SpendingRules;
  private _currentSpending: number;
  private _spendingPeriod: string;

  constructor(props: VirtualCardProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.cardNumber = props.cardNumber;
    this.cardholderName = props.cardholderName;
    this.expirationDate = props.expirationDate;
    this.cvv = props.cvv;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._rules = { ...props.rules, blockedCategories: [...props.rules.blockedCategories] };
    this._currentSpending = props.currentSpending;
    this._spendingPeriod = props.spendingPeriod;
  }

  get status(): CardStatus {
    return this._status;
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
    return `**** **** **** ${this.cardNumber.slice(-4)}`;
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
    this._status = status;
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
    const { monthlyLimit, dailyLimit, internationalAllowed, blockedCategories } = this._rules;

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
    return { approved: true };
  }

  registerPurchase(amount: number): void {
    this._currentSpending = roundMoney(this._currentSpending + amount);
  }

  /** Descripción del movimiento de pago (el frontend la interpreta: "Pago: <comercio> [<id>]"). */
  paymentDescription(merchantName: string): string {
    return `Pago: ${merchantName} [${this.id}]`;
  }
}
