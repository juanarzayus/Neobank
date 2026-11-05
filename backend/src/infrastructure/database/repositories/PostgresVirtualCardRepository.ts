import { type NewVirtualCard, VirtualCard } from '../../../domain/entities/VirtualCard';
import type { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { isUuid, type Queryable } from '../PostgresPool';

const toEntity = (row: any): VirtualCard =>
  new VirtualCard({
    id: row.id,
    userId: row.user_id,
    cardNumber: String(row.card_number),
    cardholderName: row.cardholder_name,
    expirationDate: row.expiration_date,
    cvv: row.cvv,
    status: row.status,
    rules: {
      monthlyLimit: Number(row.monthly_limit),
      dailyLimit: row.daily_limit === null ? null : Number(row.daily_limit),
      internationalAllowed: Boolean(row.international_allowed),
      blockedCategories: Array.isArray(row.blocked_categories) ? row.blocked_categories : [],
    },
    currentSpending: Number(row.current_spending),
    spendingPeriod: row.spending_period,
    createdAt: new Date(row.created_at),
  });

export class PostgresVirtualCardRepository implements IVirtualCardRepository {
  constructor(private readonly db: Queryable) {}

  async findByUser(userId: string): Promise<VirtualCard[]> {
    const { rows } = await this.db.query(
      'SELECT * FROM virtual_cards WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows.map(toEntity);
  }

  async findByUserForUpdate(userId: string): Promise<VirtualCard[]> {
    const { rows } = await this.db.query(
      'SELECT * FROM virtual_cards WHERE user_id = $1 ORDER BY created_at DESC FOR UPDATE',
      [userId]
    );
    return rows.map(toEntity);
  }

  async findOwnedByIdForUpdate(userId: string, cardId: string): Promise<VirtualCard | null> {
    if (!isUuid(cardId)) return null;
    const { rows } = await this.db.query(
      'SELECT * FROM virtual_cards WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [cardId, userId]
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async create(data: NewVirtualCard): Promise<VirtualCard> {
    const { rows } = await this.db.query(
      `INSERT INTO virtual_cards (
        user_id, card_number, cardholder_name, monthly_limit, daily_limit,
        international_allowed, blocked_categories, expiration_date, cvv, spending_period
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        data.userId,
        data.cardNumber,
        data.cardholderName,
        data.rules.monthlyLimit,
        data.rules.dailyLimit,
        data.rules.internationalAllowed,
        data.rules.blockedCategories,
        data.expirationDate,
        data.cvv,
        data.spendingPeriod,
      ]
    );
    return toEntity(rows[0]);
  }

  async save(card: VirtualCard): Promise<void> {
    const { rules } = card;
    await this.db.query(
      `UPDATE virtual_cards SET
         monthly_limit = $1, daily_limit = $2, international_allowed = $3, blocked_categories = $4,
         status = $5, current_spending = $6, spending_period = $7
       WHERE id = $8`,
      [
        rules.monthlyLimit,
        rules.dailyLimit,
        rules.internationalAllowed,
        rules.blockedCategories,
        card.status,
        card.currentSpending,
        card.spendingPeriod,
        card.id,
      ]
    );
  }

  async delete(userId: string, cardId: string): Promise<boolean> {
    if (!isUuid(cardId)) return false;
    const { rowCount } = await this.db.query(
      'DELETE FROM virtual_cards WHERE id = $1 AND user_id = $2',
      [cardId, userId]
    );
    return Boolean(rowCount);
  }
}
