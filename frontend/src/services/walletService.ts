import { api } from './api';
import type { Account } from '@/types/accounts';
import type {
  CurrencyCode,
  CurrencyExchangeRecord,
  CurrencyWallet,
  ExchangeQuote,
  ForeignCurrencyCode,
  InternalExchangeRate,
  MultiCurrencyOverview,
} from '@/types/wallet';

export interface ExecuteExchangeResponse {
  exchange: CurrencyExchangeRecord;
  conversion: ExchangeQuote;
  checkingAccount: Account | null;
  wallets: Omit<CurrencyWallet, 'copEquivalent' | 'midCopRate'>[];
}

export const walletService = {
  async overview(): Promise<MultiCurrencyOverview> {
    return (await api.get<MultiCurrencyOverview>('/wallets')).data;
  },

  async rates(): Promise<InternalExchangeRate[]> {
    return (await api.get<InternalExchangeRate[]>('/wallets/rates')).data;
  },

  async exchanges(limit?: number): Promise<CurrencyExchangeRecord[]> {
    return (
      await api.get<CurrencyExchangeRecord[]>('/wallets/exchanges', {
        params: limit ? { limit } : undefined,
      })
    ).data;
  },

  async openWallet(currency: ForeignCurrencyCode): Promise<CurrencyWallet> {
    return (await api.post<CurrencyWallet>('/wallets', { currency })).data;
  },

  async closeWallet(currency: ForeignCurrencyCode): Promise<void> {
    await api.delete(`/wallets/${encodeURIComponent(currency)}`);
  },

  async quote(from: CurrencyCode, to: CurrencyCode, amount: number): Promise<ExchangeQuote> {
    return (
      await api.get<ExchangeQuote>('/wallets/quote', {
        params: { from, to, amount },
      })
    ).data;
  },

  async exchange(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    amount: number
  ): Promise<ExecuteExchangeResponse> {
    return (
      await api.post<ExecuteExchangeResponse>('/wallets/exchange', {
        fromCurrency,
        toCurrency,
        amount,
      })
    ).data;
  },
};

