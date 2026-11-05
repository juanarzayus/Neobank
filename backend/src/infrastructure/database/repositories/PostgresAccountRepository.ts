import { randomInt } from 'node:crypto';
import { Account, type NewSavingsAccount } from '../../../domain/entities/Account';
import type { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { ACCOUNT_NUMBER_LENGTH } from '../../../domain/value-objects/AccountNumber';
import { isUuid, type Queryable } from '../PostgresPool';

const UNIQUE_VIOLATION = '23505';
const ACCOUNT_NUMBER_CONSTRAINT = 'uq_accounts_number';
const MAX_NUMBER_ATTEMPTS = 5;

const toEntity = (row: any): Account =>
  new Account({
    id: row.id,
    accountNumber: row.account_number,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    balance: Number(row.balance),
    annualRate: Number(row.annual_rate),
    lastInterestAt: row.last_interest_at ? new Date(row.last_interest_at) : null,
    createdAt: new Date(row.created_at),
  });

const generateAccountNumber = () =>
  Array.from({ length: ACCOUNT_NUMBER_LENGTH }, () => randomInt(0, 10)).join('');

const isAccountNumberCollision = (err: unknown) => {
  const e = err as { code?: string; constraint?: string };
  return e.code === UNIQUE_VIOLATION && e.constraint === ACCOUNT_NUMBER_CONSTRAINT;
};

export class PostgresAccountRepository implements IAccountRepository {
  constructor(private readonly db: Queryable) {}

  /**
   * El número de cuenta lo asigna la persistencia (como el id). Si por azar ya existe,
   * se reintenta con otro número.
   */
  private async insertWithNewNumber<T>(insert: (accountNumber: string) => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await insert(generateAccountNumber());
      } catch (err) {
        if (!isAccountNumberCollision(err) || attempt >= MAX_NUMBER_ATTEMPTS) throw err;
      }
    }
  }

  async findByUser(userId: string): Promise<Account[]> {
    const { rows } = await this.db.query(
      "SELECT * FROM accounts WHERE user_id = $1 ORDER BY (type = 'CHECKING') DESC, created_at",
      [userId]
    );
    return rows.map(toEntity);
  }

  async findByNumber(accountNumber: string): Promise<Account | null> {
    const { rows } = await this.db.query('SELECT * FROM accounts WHERE account_number = $1', [accountNumber]);
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async createCheckingIfMissing(userId: string): Promise<void> {
    await this.insertWithNewNumber((accountNumber) =>
      this.db.query(
        `INSERT INTO accounts (user_id, type, name, account_number)
         VALUES ($1, 'CHECKING', 'Cuenta principal', $2)
         ON CONFLICT (user_id) WHERE type = 'CHECKING' DO NOTHING`,
        [userId, accountNumber]
      )
    );
  }

  async createSavings(data: NewSavingsAccount): Promise<Account> {
    const { rows } = await this.insertWithNewNumber((accountNumber) =>
      this.db.query(
        `INSERT INTO accounts (user_id, type, name, annual_rate, account_number)
         VALUES ($1, 'SAVINGS', $2, $3, $4) RETURNING *`,
        [data.userId, data.name, data.annualRate, accountNumber]
      )
    );
    return toEntity(rows[0]);
  }

  /** Bloquea ordenando por id para que dos transferencias cruzadas no se bloqueen entre sí. */
  async findOwnedForUpdate(userId: string, ids: string[]): Promise<Account[]> {
    const validIds = ids.filter(isUuid);
    if (validIds.length === 0) return [];
    const { rows } = await this.db.query(
      'SELECT * FROM accounts WHERE user_id = $1 AND id = ANY($2::uuid[]) ORDER BY id FOR UPDATE',
      [userId, validIds]
    );
    return rows.map(toEntity);
  }

  async findByIdsForUpdate(ids: string[]): Promise<Account[]> {
    const validIds = ids.filter(isUuid);
    if (validIds.length === 0) return [];
    const { rows } = await this.db.query(
      'SELECT * FROM accounts WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE',
      [validIds]
    );
    return rows.map(toEntity);
  }

  async findCheckingForUpdate(userId: string): Promise<Account | null> {
    const { rows } = await this.db.query(
      "SELECT * FROM accounts WHERE user_id = $1 AND type = 'CHECKING' FOR UPDATE",
      [userId]
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async save(account: Account): Promise<void> {
    await this.db.query('UPDATE accounts SET balance = $1, last_interest_at = $2 WHERE id = $3', [
      account.balance,
      account.lastInterestAt,
      account.id,
    ]);
  }
}
