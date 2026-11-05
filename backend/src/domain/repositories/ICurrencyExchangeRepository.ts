import type { CurrencyExchange, NewCurrencyExchange } from '../entities/CurrencyExchange';

export interface ICurrencyExchangeRepository {
  record(exchange: NewCurrencyExchange): Promise<CurrencyExchange>;
  findByUser(userId: string, limit: number): Promise<CurrencyExchange[]>;
}

