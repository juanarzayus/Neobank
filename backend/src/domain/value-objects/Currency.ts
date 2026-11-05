import { ValidationError } from '../errors/DomainError';

export const FOREIGN_CURRENCIES = ['USD', 'EUR', 'GBP', 'MXN', 'BRL'] as const;
export type ForeignCurrencyCode = (typeof FOREIGN_CURRENCIES)[number];

export const SUPPORTED_CURRENCIES = ['COP', ...FOREIGN_CURRENCIES] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface CurrencyMetadata {
  readonly code: CurrencyCode;
  readonly name: string;
  readonly symbol: string;
}

export const CURRENCY_CATALOG: Record<CurrencyCode, CurrencyMetadata> = {
  COP: { code: 'COP', name: 'Peso colombiano', symbol: '$' },
  USD: { code: 'USD', name: 'Dólar estadounidense', symbol: 'US$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  GBP: { code: 'GBP', name: 'Libra esterlina', symbol: '£' },
  MXN: { code: 'MXN', name: 'Peso mexicano', symbol: 'MX$' },
  BRL: { code: 'BRL', name: 'Real brasileño', symbol: 'R$' },
};

const isCurrencyCode = (value: string): value is CurrencyCode =>
  (SUPPORTED_CURRENCIES as readonly string[]).includes(value);

const isForeignCurrencyCode = (value: string): value is ForeignCurrencyCode =>
  (FOREIGN_CURRENCIES as readonly string[]).includes(value);

export function parseCurrencyCode(raw: string): CurrencyCode {
  const normalized = raw.trim().toUpperCase();
  if (!isCurrencyCode(normalized)) {
    throw new ValidationError('Moneda no soportada');
  }
  return normalized;
}

export function parseForeignCurrencyCode(raw: string): ForeignCurrencyCode {
  const normalized = raw.trim().toUpperCase();
  if (!isForeignCurrencyCode(normalized)) {
    throw new ValidationError('Divisa extranjera no soportada');
  }
  return normalized;
}

export function formatCurrencyMovementAmount(amount: number, currency: CurrencyCode): string {
  const meta = CURRENCY_CATALOG[currency];
  return `${meta.symbol}${amount.toFixed(2)} ${currency}`;
}

