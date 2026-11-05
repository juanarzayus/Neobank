import { type NewVirtualCard, VirtualCard } from '../../../domain/entities/VirtualCard';
import type { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { isUuid, type Queryable } from '../PostgresPool';

const toEntity = (row: any): VirtualCard => {
  const last4 = String(row.last4 || String(row.card_number || '').slice(-4) || '0000');
  const cardToken = String(row.card_token || `tok_np_${String(row.id).replace(/-/g, '').slice(0, 24)}`);
  return new VirtualCard({
    id: row.id,
    userId: row.user_id,
    cardToken,
    last4,
    encryptedPan: String(row.encrypted_pan || row.card_number || ''),
    encryptedCvv: String(row.encrypted_cvv || row.cvv || ''),
    cardholderName: row.cardholder_name,
    expirationDate: row.expiration_date,
    status: row.status,
    prepaidBalance: Number(row.prepaid_balance ?? 0),
    rules: {
      monthlyLimit: Number(row.monthly_limit),
      dailyLimit: row.daily_limit === null ? null : Number(row.daily_limit),
      internationalAllowed: Boolean(row.international_allowed),
      blockedCategories: Array.isArray(row.blocked_categories) ? row.blocked_categories : [],
      autoDebitFromAccount:
        row.auto_debit_from_account === undefined ? true : Boolean(row.auto_debit_from_account),
    },
    currentSpending: Number(row.current_spending),
    spendingPeriod: row.spending_period,
    createdAt: new Date(row.created_at),
  });
};

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

  async findOwnedById(userId: string, cardId: string): Promise<VirtualCard | null> {
    if (!isUuid(cardId)) return null;
    const { rows } = await this.db.query(
      'SELECT * FROM virtual_cards WHERE id = $1 AND user_id = $2',
      [cardId, userId]
    );
    return rows[0] ? toEntity(rows[0]) : null;
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
    const maskedColumnValue = `************${data.last4}`;
    const { rows } = await this.db.query(
      `INSERT INTO virtual_cards (
        user_id, card_number, card_token, last4, encrypted_pan, encrypted_cvv,
        cardholder_name, monthly_limit, daily_limit, international_allowed,
        blocked_categories, auto_debit_from_account, prepaid_balance,
        expiration_date, cvv, spending_period
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        data.userId,
        maskedColumnValue,
        data.cardToken,
        data.last4,
        data.encryptedPan,
        data.encryptedCvv,
        data.cardholderName,
        data.rules.monthlyLimit,
        data.rules.dailyLimit,
        data.rules.internationalAllowed,
        data.rules.blockedCategories,
        data.rules.autoDebitFromAccount,
        data.prepaidBalance,
        data.expirationDate,
        '***',
        data.spendingPeriod,
      ]
    );
    return toEntity(rows[0]);
  }

  async save(card: VirtualCard): Promise<void> {
    const { rules } = card;
    await this.db.query(
      `UPDATE virtual_cards SET
         monthly_limit = $1, daily_limit = $2, international_allowed = $3,
         blocked_categories = $4, auto_debit_from_account = $5,
         status = $6, prepaid_balance = $7, current_spending = $8, spending_period = $9
       WHERE id = $10`,
      [
        rules.monthlyLimit,
        rules.dailyLimit,
        rules.internationalAllowed,
        rules.blockedCategories,
        rules.autoDebitFromAccount,
        card.status,
        card.prepaidBalance,
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
