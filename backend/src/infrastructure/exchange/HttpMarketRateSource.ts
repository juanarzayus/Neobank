import type { IMarketRateSource, MarketRatesSnapshot } from '../../application/ports/IMarketRateSource';
import { FOREIGN_CURRENCIES, type ForeignCurrencyCode } from '../../domain/value-objects/Currency';

const API_URL = 'https://open.er-api.com/v6/latest/COP';
const SOURCE_NAME = 'open.er-api.com';
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Adaptador de salida que consulta las tasas de mercado del día en ExchangeRate-API
 * (endpoint abierto, sin API key, actualización diaria).
 */
export class HttpMarketRateSource implements IMarketRateSource {
  constructor(private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS) {}

  async fetchCopRates(): Promise<MarketRatesSnapshot> {
    const res = await fetch(API_URL, {
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`${SOURCE_NAME} respondió HTTP ${res.status}`);

    const data: any = await res.json();
    if (data?.result !== 'success' || typeof data.rates !== 'object') {
      throw new Error(`Respuesta inválida de ${SOURCE_NAME}`);
    }

    const copRates = {} as Record<ForeignCurrencyCode, number>;
    for (const currency of FOREIGN_CURRENCIES) {
      const unitsPerCop = Number(data.rates[currency]);
      if (!Number.isFinite(unitsPerCop) || unitsPerCop <= 0) {
        throw new Error(`${SOURCE_NAME} no devolvió la tasa ${currency}`);
      }
      // La API da "divisa por 1 COP"; el motor interno trabaja con "COP por 1 divisa".
      copRates[currency] = 1 / unitsPerCop;
    }

    const asOf = new Date(Number(data.time_last_update_unix) * 1000);
    return {
      copRates,
      asOf: Number.isNaN(asOf.getTime()) ? new Date() : asOf,
      source: SOURCE_NAME,
    };
  }
}
