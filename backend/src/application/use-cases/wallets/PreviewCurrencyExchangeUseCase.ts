import { ValidationError } from '../../../domain/errors/DomainError';
import { parseCurrencyCode } from '../../../domain/value-objects/Currency';
import type { ConversionResult } from '../../../domain/value-objects/ExchangeRate';
import type { PreviewExchangeDto } from '../../dtos/WalletDtos';
import type { IClock } from '../../ports/IClock';
import type { IExchangeRateProvider } from '../../ports/IExchangeRateProvider';

export class PreviewCurrencyExchangeUseCase {
  constructor(
    private readonly rates: IExchangeRateProvider,
    private readonly clock: IClock
  ) {}

  async execute(dto: PreviewExchangeDto): Promise<ConversionResult> {
    const fromCurrency = parseCurrencyCode(dto.fromCurrency);
    const toCurrency = parseCurrencyCode(dto.toCurrency);
    if (fromCurrency === toCurrency) {
      throw new ValidationError('Las monedas de origen y destino deben ser distintas');
    }

    const quote = await this.rates.getQuote(fromCurrency, toCurrency, this.clock.now());
    return quote.convert(dto.amount);
  }
}

