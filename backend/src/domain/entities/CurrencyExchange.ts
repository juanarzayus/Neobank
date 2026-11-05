import type { CurrencyCode } from '../value-objects/Currency';

/** Registro inmutable de una operación de cambio de divisas. */
export interface CurrencyExchange {
  readonly id: string;
  readonly userId: string;
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly fromAmount: number;
  readonly toAmount: number;
  readonly rateApplied: number;
  readonly spreadPercent: number;
  readonly createdAt: Date;
}

export interface NewCurrencyExchange {
  userId: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
  toAmount: number;
  rateApplied: number;
  spreadPercent: number;
}

