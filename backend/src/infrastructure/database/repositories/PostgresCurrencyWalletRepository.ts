import { CurrencyWallet } from '../../../domain/entities/CurrencyWallet';
import { CurrencyWalletAlreadyExistsError } from '../../../domain/errors/DomainError';
import type { ICurrencyWalletRepository } from '../../../domain/repositories/ICurrencyWalletRepository';
import type { ForeignCurrencyCode } from '../../../domain/value-objects/Currency';
import { isUuid, type Queryable } from '../PostgresPool';

const UNIQUE_VIOLATION = '23505';

const toEntity = (row: any): CurrencyWallet =>
  new CurrencyWallet({
    id: row.id,
    userId: row.user_id,
    currency: row.currency,
    balance: Number(row.balance),
    createdAt: new Date(row.created_at),
  });

export class PostgresCurrencyWalletRepository implements ICurrencyWalletRepository {
  constructor(private readonly db: Queryable) {}

  async findByUser(userId: string): Promise<CurrencyWallet[]> {
    const { rows } = await this.db.query(
      'SELECT * FROM currency_wallets WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    return rows.map(toEntity);
  }

  async findByUserAndCurrency(
    userId: string,
    currency: ForeignCurrencyCode
  ): Promise<CurrencyWallet | null> {
    const { rows } = await this.db.query(
      'SELECT * FROM currency_wallets WHERE user_id = $1 AND currency = $2',
      [userId, currency]
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findByUserAndCurrencyForUpdate(
    userId: string,
    currency: ForeignCurrencyCode
  ): Promise<CurrencyWallet | null> {
    const { rows } = await this.db.query(
      'SELECT * FROM currency_wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE',
      [userId, currency]
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async create(userId: string, currency: ForeignCurrencyCode): Promise<CurrencyWallet> {
    try {
      const { rows } = await this.db.query(
        `INSERT INTO currency_wallets (user_id, currency)
         VALUES ($1, $2) RETURNING *`,
        [userId, currency]
      );
      return toEntity(rows[0]);
    } catch (err) {
      if ((err as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new CurrencyWalletAlreadyExistsError();
      }
      throw err;
    }
  }

  async ensureExists(userId: string, currency: ForeignCurrencyCode): Promise<void> {
    await this.db.query(
      `INSERT INTO currency_wallets (user_id, currency)
       VALUES ($1, $2)
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );
  }

  async save(wallet: CurrencyWallet): Promise<void> {
    await this.db.query('UPDATE currency_wallets SET balance = $1 WHERE id = $2', [
      wallet.balance,
      wallet.id,
    ]);
  }

  async delete(id: string): Promise<void> {
    if (!isUuid(id)) return;
    await this.db.query('DELETE FROM currency_wallets WHERE id = $1', [id]);
  }
}

