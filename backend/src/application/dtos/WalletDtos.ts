import type { Account } from '../../domain/entities/Account';
import type { CurrencyExchange } from '../../domain/entities/CurrencyExchange';
import type { CurrencyWallet } from '../../domain/entities/CurrencyWallet';
import type { ConversionResult, InternalCurrencyRate } from '../../domain/value-objects/ExchangeRate';

export interface OpenCurrencyWalletDto {
  userId: string;
  currency: string;
}

export interface CloseCurrencyWalletDto {
  userId: string;
  currency: string;
}

export interface PreviewExchangeDto {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export interface ExecuteExchangeDto {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export interface CurrencyWalletValuation {
  wallet: CurrencyWallet;
  /** Equivalente estimado en COP según tasa media interna. */
  copEquivalent: number;
  midCopRate: number;
}

export interface MultiCurrencyOverviewResult {
  wallets: CurrencyWalletValuation[];
  rates: InternalCurrencyRate[];
  exchanges: CurrencyExchange[];
  totalForeignInCop: number;
}

export interface ExecuteExchangeResult {
  exchange: CurrencyExchange;
  conversion: ConversionResult;
  checkingAccount: Account | null;
  wallets: CurrencyWallet[];
}

