import type { CurrencyExchange } from '../../../domain/entities/CurrencyExchange';
import type { ICurrencyExchangeRepository } from '../../../domain/repositories/ICurrencyExchangeRepository';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export class ListCurrencyExchangesUseCase {
  constructor(private readonly exchanges: ICurrencyExchangeRepository) {}

  async execute(userId: string, rawLimit?: number): Promise<CurrencyExchange[]> {
    const requested = rawLimit && Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : DEFAULT_LIMIT;
    const limit = Math.min(Math.max(requested, 1), MAX_LIMIT);
    return this.exchanges.findByUser(userId, limit);
  }
}

