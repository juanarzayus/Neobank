import { BusinessRuleError, ValidationError } from '../errors/DomainError';
import type { CurrencyCode, ForeignCurrencyCode } from './Currency';
import { Money, roundMoney } from './Money';

const roundRate = (value: number): number => Math.round(value * 1e8) / 1e8;
const roundPercent = (value: number): number => Math.round(value * 1e4) / 1e4;

/** Parámetros internos de tesorería para una divisa frente al peso colombiano (COP). */
export interface InternalCurrencyRate {
  readonly currency: ForeignCurrencyCode;
  /** Valor medio interno en COP por 1 unidad de la divisa. */
  readonly copRate: number;
  /** Margen operativo interno (p. ej. 0.005 = 0.50%). */
  readonly spreadRate: number;
  /** Precio en COP al comprar 1 unidad de la divisa desde COP. */
  readonly buyCopRate: number;
  /** Precio en COP recibido al vender 1 unidad de la divisa hacia COP. */
  readonly sellCopRate: number;
  readonly updatedAt: Date;
}

export interface ExchangeRateQuoteProps {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  /** Tasa media de referencia interna (sin margen). */
  midMarketRate: number;
  /** Tasa efectiva aplicada: unidades de toCurrency por cada 1 fromCurrency. */
  effectiveRate: number;
  /** Margen interno aplicado como fracción (0.005 = 0.50%). */
  spreadRate: number;
  updatedAt: Date;
}

export interface ConversionResult {
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly fromAmount: number;
  readonly toAmount: number;
  readonly midMarketRate: number;
  readonly effectiveRate: number;
  readonly inverseRate: number;
  /** Porcentaje expresado sobre 100 (p. ej. 0.5 = 0.50%). */
  readonly spreadPercent: number;
  readonly updatedAt: Date;
}

/**
 * Cotización interna de cambio entre dos monedas distintas.
 * Encapsula el redondeo financiero y evita conversiones que produzcan 0.00 unidades.
 */
export class ExchangeRateQuote {
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly midMarketRate: number;
  readonly effectiveRate: number;
  readonly inverseRate: number;
  readonly spreadRate: number;
  readonly spreadPercent: number;
  readonly updatedAt: Date;

  constructor(props: ExchangeRateQuoteProps) {
    if (props.fromCurrency === props.toCurrency) {
      throw new ValidationError('Las monedas de origen y destino deben ser distintas');
    }
    if (!Number.isFinite(props.effectiveRate) || props.effectiveRate <= 0) {
      throw new ValidationError('Tasa de cambio interna inválida');
    }
    this.fromCurrency = props.fromCurrency;
    this.toCurrency = props.toCurrency;
    this.midMarketRate = roundRate(props.midMarketRate);
    this.effectiveRate = roundRate(props.effectiveRate);
    this.inverseRate = roundRate(1 / props.effectiveRate);
    this.spreadRate = props.spreadRate;
    this.spreadPercent = roundPercent(props.spreadRate * 100);
    this.updatedAt = props.updatedAt;
  }

  convert(rawAmount: number): ConversionResult {
    const fromAmount = Money.positiveAmount(rawAmount);
    const toAmount = roundMoney(fromAmount * this.effectiveRate);
    if (toAmount <= 0) {
      throw new BusinessRuleError(
        'El monto es demasiado bajo para realizar la conversión al tipo de cambio actual'
      );
    }
    if (toAmount > 1_000_000_000_000) {
      throw new ValidationError('El monto convertido supera el límite permitido');
    }

    return {
      fromCurrency: this.fromCurrency,
      toCurrency: this.toCurrency,
      fromAmount,
      toAmount,
      midMarketRate: this.midMarketRate,
      effectiveRate: this.effectiveRate,
      inverseRate: this.inverseRate,
      spreadPercent: this.spreadPercent,
      updatedAt: this.updatedAt,
    };
  }
}

