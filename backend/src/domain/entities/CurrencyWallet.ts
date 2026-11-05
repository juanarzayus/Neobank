import { BusinessRuleError } from '../errors/DomainError';
import { CURRENCY_CATALOG, type ForeignCurrencyCode } from '../value-objects/Currency';
import { roundMoney } from '../value-objects/Money';

export interface CurrencyWalletProps {
  id: string;
  userId: string;
  currency: ForeignCurrencyCode;
  balance: number;
  createdAt: Date;
}

/**
 * Billetera / bolsillo en moneda extranjera perteneciente a un usuario.
 * La moneda local (COP) reside en la cuenta corriente principal (Account CHECKING).
 */
export class CurrencyWallet {
  readonly id: string;
  readonly userId: string;
  readonly currency: ForeignCurrencyCode;
  readonly createdAt: Date;
  private _balance: number;

  constructor(props: CurrencyWalletProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.currency = props.currency;
    this.createdAt = props.createdAt;
    this._balance = props.balance;
  }

  get balance(): number {
    return this._balance;
  }

  get currencyName(): string {
    return CURRENCY_CATALOG[this.currency].name;
  }

  get symbol(): string {
    return CURRENCY_CATALOG[this.currency].symbol;
  }

  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  canAfford(amount: number): boolean {
    return this._balance >= amount;
  }

  credit(amount: number): void {
    this._balance = roundMoney(this._balance + amount);
  }

  debit(amount: number): void {
    if (!this.canAfford(amount)) {
      throw new BusinessRuleError(`Saldo insuficiente en tu billetera ${this.currency}`);
    }
    this._balance = roundMoney(this._balance - amount);
  }

  ensureZeroBalanceForClose(): void {
    if (this._balance > 0) {
      throw new BusinessRuleError(
        `Convierte o retira tu saldo en ${this.currency} antes de cerrar esta billetera`
      );
    }
  }
}

