import { randomInt } from 'node:crypto';
import type { Request, Response } from 'express';
import { pool } from '../../infrastructure/database/PostgresPool';
import { AppError } from '../../infrastructure/middlewares/errorHandlerMiddleware';

const STATUSES = ['ACTIVE', 'FROZEN', 'CANCELLED'];

const toCard = (row: any) => ({
  id: row.id,
  maskedNumber: `**** **** **** ${String(row.card_number).slice(-4)}`,
  cardholderName: row.cardholder_name,
  expirationDate: row.expiration_date || '12/28',
  cvv: row.cvv || '123',
  monthlyLimit: Number(row.monthly_limit),
  dailyLimit: row.daily_limit !== null && row.daily_limit !== undefined ? Number(row.daily_limit) : null,
  currentSpending: Number(row.current_spending),
  internationalAllowed: row.international_allowed !== undefined ? Boolean(row.international_allowed) : true,
  blockedCategories: Array.isArray(row.blocked_categories) ? row.blocked_categories : [],
  status: row.status,
  createdAt: row.created_at,
  spendingRules: {
    monthlyLimit: Number(row.monthly_limit),
    dailyLimit: row.daily_limit !== null && row.daily_limit !== undefined ? Number(row.daily_limit) : null,
    internationalAllowed: row.international_allowed !== undefined ? Boolean(row.international_allowed) : true,
    blockedCategories: Array.isArray(row.blocked_categories) ? row.blocked_categories : [],
  },
});

const generatePan = () => '4' + Array.from({ length: 15 }, () => randomInt(0, 10)).join('');

const generateExpirationDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 4);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
};

const generateCvv = () => String(randomInt(100, 1000));

export const VirtualCardController = {
  async list(_req: Request, res: Response) {
    const { rows } = await pool.query(
      'SELECT * FROM virtual_cards WHERE user_id = $1 ORDER BY created_at DESC',
      [res.locals.userId]
    );
    res.json(rows.map(toCard));
  },

  async create(req: Request, res: Response) {
    const {
      cardholderName,
      monthlyLimit = 0,
      dailyLimit = null,
      internationalAllowed = true,
      blockedCategories = [],
    } = req.body ?? {};

    if (typeof cardholderName !== 'string' || !cardholderName.trim()) {
      throw new AppError(400, 'El nombre del titular es obligatorio');
    }
    if (typeof monthlyLimit !== 'number' || monthlyLimit < 0) {
      throw new AppError(400, 'Límite mensual no válido');
    }
    if (dailyLimit !== null && (typeof dailyLimit !== 'number' || dailyLimit < 0)) {
      throw new AppError(400, 'Límite diario no válido');
    }
    if (typeof internationalAllowed !== 'boolean') {
      throw new AppError(400, 'Valor de compras internacionales no válido');
    }
    if (!Array.isArray(blockedCategories)) {
      throw new AppError(400, 'Categorías bloqueadas no válidas');
    }

    const { rows } = await pool.query(
      `INSERT INTO virtual_cards (
        user_id, card_number, cardholder_name, monthly_limit, daily_limit,
        international_allowed, blocked_categories, expiration_date, cvv
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        res.locals.userId,
        generatePan(),
        cardholderName.trim().toUpperCase(),
        monthlyLimit,
        dailyLimit,
        internationalAllowed,
        blockedCategories,
        generateExpirationDate(),
        generateCvv(),
      ]
    );
    res.status(201).json(toCard(rows[0]));
  },

  async updateLimits(req: Request, res: Response) {
    const {
      monthlyLimit,
      dailyLimit,
      internationalAllowed,
      blockedCategories,
    } = req.body ?? {};

    if (monthlyLimit !== undefined && (typeof monthlyLimit !== 'number' || monthlyLimit < 0)) {
      throw new AppError(400, 'Límite mensual no válido');
    }
    if (dailyLimit !== undefined && dailyLimit !== null && (typeof dailyLimit !== 'number' || dailyLimit < 0)) {
      throw new AppError(400, 'Límite diario no válido');
    }
    if (internationalAllowed !== undefined && typeof internationalAllowed !== 'boolean') {
      throw new AppError(400, 'Valor de compras internacionales no válido');
    }
    if (blockedCategories !== undefined && !Array.isArray(blockedCategories)) {
      throw new AppError(400, 'Categorías bloqueadas no válidas');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (monthlyLimit !== undefined) {
      updates.push(`monthly_limit = $${idx++}`);
      values.push(monthlyLimit);
    }
    if (dailyLimit !== undefined) {
      updates.push(`daily_limit = $${idx++}`);
      values.push(dailyLimit);
    }
    if (internationalAllowed !== undefined) {
      updates.push(`international_allowed = $${idx++}`);
      values.push(internationalAllowed);
    }
    if (blockedCategories !== undefined) {
      updates.push(`blocked_categories = $${idx++}`);
      values.push(blockedCategories);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No se proporcionaron campos para actualizar');
    }

    values.push(req.params.id, res.locals.userId);
    const query = `UPDATE virtual_cards SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`;
    const { rows } = await pool.query(query, values);
    if (!rows[0]) throw new AppError(404, 'Tarjeta no encontrada');
    res.json(toCard(rows[0]));
  },

  async updateStatus(req: Request, res: Response) {
    const { status } = req.body ?? {};
    if (!STATUSES.includes(status)) throw new AppError(400, `Estado inválido (${STATUSES.join(', ')})`);
    const { rows } = await pool.query(
      'UPDATE virtual_cards SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, res.locals.userId]
    );
    if (!rows[0]) throw new AppError(404, 'Tarjeta no encontrada');
    res.json(toCard(rows[0]));
  },

  async delete(req: Request, res: Response) {
    const { rowCount } = await pool.query(
      'DELETE FROM virtual_cards WHERE id = $1 AND user_id = $2',
      [req.params.id, res.locals.userId]
    );
    if (!rowCount) throw new AppError(404, 'Tarjeta no encontrada');
    res.status(204).end();
  },

  async authorize(req: Request, res: Response) {
    const { amount, merchantName = 'Comercio', isInternational = false } = req.body ?? {};

    // Validate amount
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new AppError(400, 'El monto debe ser un número mayor a 0');
    }
    if (amount > 1_000_000) throw new AppError(400, 'Monto demasiado alto');
    const rounded = Math.round(amount * 100) / 100;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock and fetch card
      const { rows: cardRows } = await client.query(
        'SELECT * FROM virtual_cards WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [req.params.id, res.locals.userId]
      );
      if (!cardRows[0]) throw new AppError(404, 'Tarjeta no encontrada');
      const card = cardRows[0];

      // 2. Authorization checks (always return HTTP 200 — rejection is a business outcome)
      if (card.status === 'CANCELLED') {
        await client.query('ROLLBACK');
        return res.status(200).json({ approved: false, reason: 'Tarjeta cancelada' });
      }
      if (card.status === 'FROZEN') {
        await client.query('ROLLBACK');
        return res.status(200).json({ approved: false, reason: 'Tarjeta congelada' });
      }
      if (isInternational && !card.international_allowed) {
        await client.query('ROLLBACK');
        return res.status(200).json({ approved: false, reason: 'Compras internacionales desactivadas en esta tarjeta' });
      }
      if (Number(card.monthly_limit) > 0 && Number(card.current_spending) + rounded > Number(card.monthly_limit)) {
        await client.query('ROLLBACK');
        return res.status(200).json({ approved: false, reason: `Límite mensual superado ($${card.monthly_limit})` });
      }

      // Daily spending check — computed from account_transactions recorded today
      if (card.daily_limit !== null && card.daily_limit !== undefined && Number(card.daily_limit) > 0) {
        const { rows: dailyRows } = await client.query(
          `SELECT COALESCE(SUM(amount), 0) AS spent FROM account_transactions
           WHERE description LIKE $1 AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'America/Bogota')`,
          [`%[${card.id}]%`]
        );
        const dailySpent = Number(dailyRows[0].spent);
        if (dailySpent + rounded > Number(card.daily_limit)) {
          await client.query('ROLLBACK');
          return res.status(200).json({ approved: false, reason: `Límite diario superado ($${card.daily_limit})` });
        }
      }

      // 3. Find CHECKING account and check balance
      const { rows: accountRows } = await client.query(
        "SELECT * FROM accounts WHERE user_id = $1 AND type = 'CHECKING' FOR UPDATE",
        [res.locals.userId]
      );
      if (!accountRows[0]) {
        await client.query('ROLLBACK');
        return res.status(200).json({ approved: false, reason: 'No se encontró cuenta principal (CHECKING)' });
      }
      const account = accountRows[0];
      if (Number(account.balance) < rounded) {
        await client.query('ROLLBACK');
        return res.status(200).json({ approved: false, reason: `Saldo insuficiente (disponible: $${Number(account.balance).toFixed(2)})` });
      }

      // 4. Deduct balance from account
      const { rows: updatedAccountRows } = await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2 RETURNING *',
        [rounded, account.id]
      );
      const newBalance = Number(updatedAccountRows[0].balance);

      // 5. Update current_spending on card
      const { rows: updatedCardRows } = await client.query(
        'UPDATE virtual_cards SET current_spending = current_spending + $1 WHERE id = $2 RETURNING *',
        [rounded, card.id]
      );

      // 6. Record transaction in account_transactions
      await client.query(
        `INSERT INTO account_transactions (account_id, type, amount, balance_after, description)
         VALUES ($1, 'WITHDRAWAL', $2, $3, $4)`,
        [account.id, rounded, newBalance, `Pago: ${merchantName} [${card.id}]`]
      );

      await client.query('COMMIT');
      res.json({
        approved: true,
        reason: 'Compra aprobada',
        amount: rounded,
        merchantName,
        newBalance,
        currentSpending: Number(updatedCardRows[0].current_spending),
        card: toCard(updatedCardRows[0]),
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
