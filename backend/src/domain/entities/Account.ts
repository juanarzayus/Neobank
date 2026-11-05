import { BusinessRuleError, ConflictError, ValidationError } from '../errors/DomainError';
import { BusinessCalendar } from '../value-objects/BusinessCalendar';
import { roundMoney } from '../value-objects/Money';

export type AccountType = 'CHECKING' | 'SAVINGS';

/** Tasa efectiva anual de las cuentas de ahorro (4% EA). */
export const SAVINGS_ANNUAL_RATE = 0.04;

const DEFAULT_SAVINGS_NAME = 'Cuenta de ahorros';
const MAX_NAME_LENGTH = 100;

export interface AccountProps {
  id: string;
  /** 10 dígitos; lo asigna la persistencia al crear la cuenta. */
  accountNumber: string;
  userId: string;
  type: AccountType;
  name: string;
  balance: number;
  annualRate: number;
  lastInterestAt: Date | null;
  createdAt: Date;
}

export interface NewSavingsAccount {
  userId: string;
  name: string;
  annualRate: number;
}

export class Account {
  readonly id: string;
  readonly accountNumber: string;
  readonly userId: string;
  readonly type: AccountType;
  readonly name: string;
  readonly annualRate: number;
  readonly createdAt: Date;
  private _balance: number;
  private _lastInterestAt: Date | null;

  constructor(props: AccountProps) {
    this.id = props.id;
    this.accountNumber = props.accountNumber;
    this.userId = props.userId;
    this.type = props.type;
    this.name = props.name;
    this.annualRate = props.annualRate;
    this.createdAt = props.createdAt;
    this._balance = props.balance;
    this._lastInterestAt = props.lastInterestAt;
  }

  get balance(): number {
    return this._balance;
  }

  get lastInterestAt(): Date | null {
    return this._lastInterestAt;
  }

  get isChecking(): boolean {
    return this.type === 'CHECKING';
  }

  static normalizeSavingsName(raw: string | undefined): string {
    const name = raw?.trim() || DEFAULT_SAVINGS_NAME;
    if (name.length > MAX_NAME_LENGTH) throw new ValidationError('El nombre es demasiado largo');
    return name;
  }

  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  canAfford(amount: number): boolean {
    return this._balance >= amount;
  }

  deposit(amount: number): void {
    this._balance = roundMoney(this._balance + amount);
  }

  withdraw(amount: number): void {
    if (!this.canAfford(amount)) throw new BusinessRuleError('Saldo insuficiente');
    this._balance = roundMoney(this._balance - amount);
  }

  /** Solo la cuenta corriente recibe dinero externo. */
  ensureAcceptsExternalDeposit(): void {
    if (!this.isChecking) {
      throw new BusinessRuleError('Para fondear una cuenta de ahorros usa una transferencia');
    }
  }

  /** Solo de la cuenta corriente se puede retirar dinero hacia afuera. */
  ensureAllowsExternalWithdrawal(): void {
    if (!this.isChecking) {
      throw new BusinessRuleError('Para sacar dinero de ahorros transfiérelo primero a tu cuenta principal');
    }
  }

  /**
   * Acredita el interés mensual (tasa efectiva anual convertida a mensual).
   * Solo una vez por mes calendario. Devuelve el interés acreditado.
   */
  creditMonthlyInterest(now: Date): number {
    if (this.type !== 'SAVINGS') throw new BusinessRuleError('Solo las cuentas de ahorro generan intereses');
    if (this._lastInterestAt && BusinessCalendar.isSameMonth(this._lastInterestAt, now)) {
      throw new ConflictError('Los intereses de este mes ya fueron acreditados');
    }

    const monthlyRate = Math.pow(1 + this.annualRate, 1 / 12) - 1;
    const interest = roundMoney(this._balance * monthlyRate);
    if (interest <= 0) throw new BusinessRuleError('El saldo es muy bajo para generar intereses');

    this.deposit(interest);
    this._lastInterestAt = now;
    return interest;
  }
}
