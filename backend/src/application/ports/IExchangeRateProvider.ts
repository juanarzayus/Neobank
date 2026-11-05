import type { CurrencyCode } from '../../domain/value-objects/Currency';
import type { ExchangeRateQuote, InternalCurrencyRate } from '../../domain/value-objects/ExchangeRate';

/**
 * Puerto de salida para consultar el motor interno de tasas de cambio del neobanco.
 */
export interface IExchangeRateProvider {
  listInternalRates(now: Date): Promise<InternalCurrencyRate[]>;
  getQuote(from: CurrencyCode, to: CurrencyCode, now: Date): Promise<ExchangeRateQuote>;
}

