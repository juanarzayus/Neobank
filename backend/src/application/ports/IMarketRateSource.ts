import type { ForeignCurrencyCode } from '../../domain/value-objects/Currency';

/** Tasas de mercado del día: COP por 1 unidad de cada divisa extranjera soportada. */
export interface MarketRatesSnapshot {
  readonly copRates: Record<ForeignCurrencyCode, number>;
  /** Fecha de publicación reportada por el proveedor. */
  readonly asOf: Date;
  /** Nombre del proveedor que respondió. */
  readonly source: string;
}

/**
 * Puerto de salida hacia un proveedor externo de tasas de cambio de mercado.
 */
export interface IMarketRateSource {
  fetchCopRates(): Promise<MarketRatesSnapshot>;
}
