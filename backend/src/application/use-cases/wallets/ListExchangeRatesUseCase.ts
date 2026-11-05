import type { InternalCurrencyRate } from '../../../domain/value-objects/ExchangeRate';
import type { IClock } from '../../ports/IClock';
import type { IExchangeRateProvider } from '../../ports/IExchangeRateProvider';

export class ListExchangeRatesUseCase {
  constructor(
    private readonly rates: IExchangeRateProvider,
    private readonly clock: IClock
  ) {}

  async execute(): Promise<InternalCurrencyRate[]> {
    return this.rates.listInternalRates(this.clock.now());
  }
}

