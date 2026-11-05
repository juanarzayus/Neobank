import type { IExchangeRateProvider } from '../../application/ports/IExchangeRateProvider';
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
import type { Queryable } from '../database/PostgresPool';

interface SeedRate {
  readonly copRate: number;
  readonly spreadRate: number;
}

/**
 * Tasas base internas de respaldo en caso de que la tabla aún no tenga filas para una divisa.
 */
const DEFAULT_INTERNAL_RATES: Record<ForeignCurrencyCode, SeedRate> = {
  USD: { copRate: 4150.0, spreadRate: 0.005 },
  EUR: { copRate: 4520.0, spreadRate: 0.006 },
  GBP: { copRate: 5280.0, spreadRate: 0.0065 },
  MXN: { copRate: 215.0, spreadRate: 0.008 },
  BRL: { copRate: 740.0, spreadRate: 0.008 },
};

const UNDEFINED_TABLE = '42P01';

/**
 * Adaptador de salida (driven) que gestiona las tasas de cambio internas de tesorería NOVA.
 * Persiste y lee tasas desde PostgreSQL (`exchange_rates`) sin depender de APIs externas,
 * y calcula conversiones directas contra COP o cruzadas entre divisas aplicando el spread interno.
 */
export class InternalExchangeRateProvider implements IExchangeRateProvider {
  constructor(private readonly db: Queryable) {}

  async listInternalRates(now: Date): Promise<InternalCurrencyRate[]> {
    const dbRates = new Map<ForeignCurrencyCode, { copRate: number; spreadRate: number; updatedAt: Date }>();

    try {
      const { rows } = await this.db.query('SELECT * FROM exchange_rates');
      for (const row of rows) {
        const code = row.currency as ForeignCurrencyCode;
        if ((FOREIGN_CURRENCIES as readonly string[]).includes(code)) {
          dbRates.set(code, {
            copRate: Number(row.cop_rate),
            spreadRate: Number(row.spread_rate),
            updatedAt: new Date(row.updated_at),
          });
        }
      }
    } catch (err) {
      if ((err as { code?: string }).code !== UNDEFINED_TABLE) throw err;
    }

    return FOREIGN_CURRENCIES.map((currency) => {
      const found = dbRates.get(currency);
      const copRate = found?.copRate ?? DEFAULT_INTERNAL_RATES[currency].copRate;
      const spreadRate = found?.spreadRate ?? DEFAULT_INTERNAL_RATES[currency].spreadRate;
      const updatedAt = found?.updatedAt ?? now;

      return {
        currency,
        copRate: roundMoney(copRate),
        spreadRate,
        buyCopRate: roundMoney(copRate * (1 + spreadRate)),
        sellCopRate: roundMoney(copRate * (1 - spreadRate)),
        updatedAt,
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
      const midMarketRate = 1 / target.copRate;
      const buyCopPrice = target.copRate * (1 + target.spreadRate);
      const effectiveRate = 1 / buyCopPrice;

      return new ExchangeRateQuote({
        fromCurrency: from,
        toCurrency: to,
        midMarketRate,
        effectiveRate,
        spreadRate: target.spreadRate,
        updatedAt: target.updatedAt,
      });
    }

    // Caso 2: Venta de divisa hacia COP (Divisa -> COP)
    if (to === 'COP') {
      const source = map.get(from as ForeignCurrencyCode);
      if (!source) throw new ExchangeRateNotAvailableError();
      const midMarketRate = source.copRate;
      const effectiveRate = source.copRate * (1 - source.spreadRate);

      return new ExchangeRateQuote({
        fromCurrency: from,
        toCurrency: to,
        midMarketRate,
        effectiveRate,
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
    const effectiveRate = midMarketRate * (1 - crossSpread);
    const updatedAt = source.updatedAt > target.updatedAt ? source.updatedAt : target.updatedAt;

    return new ExchangeRateQuote({
      fromCurrency: from,
      toCurrency: to,
      midMarketRate,
      effectiveRate,
      spreadRate: crossSpread,
      updatedAt,
    });
  }
}

