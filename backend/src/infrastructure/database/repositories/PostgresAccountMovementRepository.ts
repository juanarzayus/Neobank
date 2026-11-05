import type { AccountMovement, NewAccountMovement } from '../../../domain/entities/AccountMovement';
import type { IAccountMovementRepository } from '../../../domain/repositories/IAccountMovementRepository';
import { isUuid, type Queryable } from '../PostgresPool';

const toEntity = (row: any): AccountMovement => ({
  id: row.id,
  accountId: row.account_id,
  type: row.type,
  amount: Number(row.amount),
  balanceAfter: Number(row.balance_after),
  relatedAccountId: row.related_account_id,
  description: row.description,
  category: row.category ?? null,
  cardId: row.card_id ?? null,
  createdAt: new Date(row.created_at),
});

export class PostgresAccountMovementRepository implements IAccountMovementRepository {
  constructor(private readonly db: Queryable) {}

  async record(m: NewAccountMovement): Promise<AccountMovement> {
    const { rows } = await this.db.query(
      `INSERT INTO account_transactions
         (account_id, type, amount, balance_after, related_account_id, description, category, card_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        m.accountId,
        m.type,
        m.amount,
        m.balanceAfter,
        m.relatedAccountId ?? null,
        m.description ?? null,
        m.category ?? null,
        m.cardId ?? null,
      ]
    );
    return toEntity(rows[0]);
  }

  async findByAccount(userId: string, accountId: string, limit: number): Promise<AccountMovement[]> {
    if (!isUuid(accountId)) return [];
    const { rows } = await this.db.query(
      `SELECT t.* FROM account_transactions t
       JOIN accounts a ON a.id = t.account_id
       WHERE a.id = $1 AND a.user_id = $2
       ORDER BY t.created_at DESC LIMIT $3`,
      [accountId, userId, limit]
    );
    return rows.map(toEntity);
  }

  async sumCardSpendingSince(cardId: string, since: Date): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) AS spent FROM account_transactions
       WHERE card_id = $1 AND created_at >= $2`,
      [cardId, since]
    );
    return Number(rows[0].spent);
  }
}
