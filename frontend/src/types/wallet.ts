export type ForeignCurrencyCode = 'USD' | 'EUR' | 'GBP' | 'MXN' | 'BRL';
export type CurrencyCode = 'COP' | ForeignCurrencyCode;

export interface Wallet {
  id: string;
  userId?: string;
  currency: CurrencyCode;
  balance: number;
  isActive?: boolean;
}

export interface ExchangeRate {
  baseCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rate: number;
  timestamp: string;
}

export interface CurrencyWallet {
  id: string;
  currency: ForeignCurrencyCode;
  name: string;
  symbol: string;
  balance: number;
  copEquivalent: number;
  midCopRate: number;
  createdAt: string;
}

export interface InternalExchangeRate {
  currency: ForeignCurrencyCode;
  name: string;
  symbol: string;
  copRate: number;
  buyCopRate: number;
  sellCopRate: number;
  spreadPercent: number;
  updatedAt: string;
}

export interface ExchangeQuote {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
  toAmount: number;
  midMarketRate: number;
  effectiveRate: number;
  inverseRate: number;
  spreadPercent: number;
  updatedAt: string;
}

export interface CurrencyExchangeRecord {
  id: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
  toAmount: number;
  rateApplied: number;
  spreadPercent: number;
  createdAt: string;
}

export interface MultiCurrencyOverview {
  wallets: CurrencyWallet[];
  rates: InternalExchangeRate[];
  exchanges: CurrencyExchangeRecord[];
  totalForeignInCop: number;
}

export interface CurrencyVisualMeta {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  accent: string;
}

export const CURRENCY_META: Record<CurrencyCode, CurrencyVisualMeta> = {
  COP: { code: 'COP', name: 'Peso colombiano', symbol: '$', flag: '🇨🇴', accent: '#00e5c0' },
  USD: { code: 'USD', name: 'Dólar estadounidense', symbol: 'US$', flag: '🇺🇸', accent: '#38bdf8' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', accent: '#818cf8' },
  GBP: { code: 'GBP', name: 'Libra esterlina', symbol: '£', flag: '🇬🇧', accent: '#c084fc' },
  MXN: { code: 'MXN', name: 'Peso mexicano', symbol: 'MX$', flag: '🇲🇽', accent: '#34d399' },
  BRL: { code: 'BRL', name: 'Real brasileño', symbol: 'R$', flag: '🇧🇷', accent: '#fbbf24' },
};

export const FOREIGN_CURRENCY_LIST: ForeignCurrencyCode[] = ['USD', 'EUR', 'GBP', 'MXN', 'BRL'];
