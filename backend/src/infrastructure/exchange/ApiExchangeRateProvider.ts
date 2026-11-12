import type { IExchangeRateProvider } from '../../application/ports/IExchangeRateProvider';
import type { IMarketRateSource, MarketRatesSnapshot } from '../../application/ports/IMarketRateSource';
import { ExchangeRateNotAvailableError, ValidationError } from '../../domain/errors/DomainError';
import {
  FOREIGN_CURRENCIES,
  type CurrencyCode,
  type ForeignCurrencyCode,
} from '../../domain/value-objects/Currency';
import {
  ExchangeRateQuote,
  type InternalCurrencyRate,
} from '../../domain/value-objects/ExchangeRate';
import { roundMoney } from '../../domain/value-objects/Money';

/** Margen operativo del neobanco por divisa (0.005 = 0.50%). */
const SPREAD_RATES: Record<ForeignCurrencyCode, number> = {
  USD: 0.005,
  EUR: 0.006,
  GBP: 0.0065,
  MXN: 0.008,
  BRL: 0.008,
};

const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Adaptador de salida (driven) que obtiene las tasas del día desde la API de mercado,
 * las mantiene en memoria durante `cacheTtlMs` y calcula conversiones directas contra COP
 * o cruzadas entre divisas aplicando el spread del neobanco.
 */
export class ApiExchangeRateProvider implements IExchangeRateProvider {
  private cache: { snapshot: MarketRatesSnapshot; fetchedAt: number } | null = null;
  private inFlight: Promise<MarketRatesSnapshot> | null = null;

  constructor(
    private readonly market: IMarketRateSource,
    private readonly cacheTtlMs: number = DEFAULT_CACHE_TTL_MS
  ) {}

  async listInternalRates(now: Date): Promise<InternalCurrencyRate[]> {
    const snapshot = await this.getSnapshot(now);

    return FOREIGN_CURRENCIES.map((currency) => {
      const copRate = snapshot.copRates[currency];
      const spreadRate = SPREAD_RATES[currency];
      return {
        currency,
        copRate: roundMoney(copRate),
        spreadRate,
        buyCopRate: roundMoney(copRate * (1 + spreadRate)),
        sellCopRate: roundMoney(copRate * (1 - spreadRate)),
        updatedAt: snapshot.asOf,
      };
    });
  }

  async getQuote(from: CurrencyCode, to: CurrencyCode, now: Date): Promise<ExchangeRateQuote> {
    if (from === to) {
      throw new ValidationError('Las monedas de origen y destino deben ser distintas');
    }

    const rates = await this.listInternalRates(now);
    const map = new Map(rates.map((r) => [r.currency, r]));

    // Caso 1: Compra de divisa con COP (COP -> Divisa)
    if (from === 'COP') {
      const target = map.get(to as ForeignCurrencyCode);
      if (!target) throw new ExchangeRateNotAvailableError();
      const buyCopPrice = target.copRate * (1 + target.spreadRate);

      return new ExchangeRateQuote({
        fromCurrency: from,
        toCurrency: to,
        midMarketRate: 1 / target.copRate,
        effectiveRate: 1 / buyCopPrice,
        spreadRate: target.spreadRate,
        updatedAt: target.updatedAt,
      });
    }

    // Caso 2: Venta de divisa hacia COP (Divisa -> COP)
    if (to === 'COP') {
      const source = map.get(from as ForeignCurrencyCode);
      if (!source) throw new ExchangeRateNotAvailableError();

      return new ExchangeRateQuote({
        fromCurrency: from,
        toCurrency: to,
        midMarketRate: source.copRate,
        effectiveRate: source.copRate * (1 - source.spreadRate),
        spreadRate: source.spreadRate,
        updatedAt: source.updatedAt,
      });
    }

    // Caso 3: Conversión cruzada entre dos divisas extranjeras (Divisa A -> Divisa B)
    const source = map.get(from as ForeignCurrencyCode);
    const target = map.get(to as ForeignCurrencyCode);
    if (!source || !target) throw new ExchangeRateNotAvailableError();

    const midMarketRate = source.copRate / target.copRate;
    const crossSpread = (source.spreadRate + target.spreadRate) / 2;

    return new ExchangeRateQuote({
      fromCurrency: from,
      toCurrency: to,
      midMarketRate,
      effectiveRate: midMarketRate * (1 - crossSpread),
      spreadRate: crossSpread,
      updatedAt: source.updatedAt,
    });
  }

  /** Devuelve las tasas en caché o las descarga de la API si vencieron. */
  private async getSnapshot(now: Date): Promise<MarketRatesSnapshot> {
    if (this.cache && now.getTime() - this.cache.fetchedAt < this.cacheTtlMs) {
      return this.cache.snapshot;
    }

    // Varias peticiones simultáneas comparten una sola descarga.
    this.inFlight ??= this.market
      .fetchCopRates()
      .then((snapshot) => {
        this.cache = { snapshot, fetchedAt: now.getTime() };
        return snapshot;
      })
      .finally(() => {
        this.inFlight = null;
      });

    try {
      return await this.inFlight;
    } catch (err) {
      console.error(`[tasas] No se pudieron obtener las tasas: ${(err as Error).message}`);
      throw new ExchangeRateNotAvailableError();
    }
  }
}
