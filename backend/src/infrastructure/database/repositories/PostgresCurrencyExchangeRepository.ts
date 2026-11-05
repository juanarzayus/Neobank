import type {
  CurrencyExchange,
  NewCurrencyExchange,
} from '../../../domain/entities/CurrencyExchange';
import type { ICurrencyExchangeRepository } from '../../../domain/repositories/ICurrencyExchangeRepository';
import type { Queryable } from '../PostgresPool';

const toEntity = (row: any): CurrencyExchange => ({
  id: row.id,
  userId: row.user_id,
  fromCurrency: row.from_currency,
  toCurrency: row.to_currency,
  fromAmount: Number(row.from_amount),
  toAmount: Number(row.to_amount),
  rateApplied: Number(row.rate_applied),
  spreadPercent: Number(row.spread_percent),
  createdAt: new Date(row.created_at),
});

export class PostgresCurrencyExchangeRepository implements ICurrencyExchangeRepository {
  constructor(private readonly db: Queryable) {}

  async record(exchange: NewCurrencyExchange): Promise<CurrencyExchange> {
    const { rows } = await this.db.query(
      `INSERT INTO currency_exchanges
         (user_id, from_currency, to_currency, from_amount, to_amount, rate_applied, spread_percent)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        exchange.userId,
        exchange.fromCurrency,
        exchange.toCurrency,
        exchange.fromAmount,
        exchange.toAmount,
        exchange.rateApplied,
        exchange.spreadPercent,
      ]
    );
    return toEntity(rows[0]);
  }

  async findByUser(userId: string, limit: number): Promise<CurrencyExchange[]> {
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const { rows } = await this.db.query(
      `SELECT * FROM currency_exchanges
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [userId, safeLimit]
    );
    return rows.map(toEntity);
  }
}

