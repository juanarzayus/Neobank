import { randomInt } from 'node:crypto';
import type { Request, Response } from 'express';
import { pool } from '../../infrastructure/database/PostgresPool';
import { AppError } from '../../infrastructure/middlewares/errorHandlerMiddleware';

const STATUSES = ['ACTIVE', 'FROZEN', 'CANCELLED'];

const toCard = (row: any) => ({
  id: row.id,
  maskedNumber: `**** **** **** ${String(row.card_number).slice(-4)}`,
  cardholderName: row.cardholder_name,
  monthlyLimit: Number(row.monthly_limit),
  currentSpending: Number(row.current_spending),
  status: row.status,
  createdAt: row.created_at,
});

const generatePan = () => '4' + Array.from({ length: 15 }, () => randomInt(0, 10)).join('');

export const VirtualCardController = {
  async list(_req: Request, res: Response) {
    const { rows } = await pool.query(
      'SELECT * FROM virtual_cards WHERE user_id = $1 ORDER BY created_at DESC',
      [res.locals.userId]
    );
    res.json(rows.map(toCard));
  },

  async create(req: Request, res: Response) {
    const { cardholderName, monthlyLimit = 0 } = req.body ?? {};
    if (typeof cardholderName !== 'string' || !cardholderName.trim()) {
      throw new AppError(400, 'El nombre del titular es obligatorio');
    }
    if (typeof monthlyLimit !== 'number' || monthlyLimit < 0) {
      throw new AppError(400, 'Límite mensual no válido');
    }

    const { rows } = await pool.query(
      `INSERT INTO virtual_cards (user_id, card_number, cardholder_name, monthly_limit)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [res.locals.userId, generatePan(), cardholderName.trim().toUpperCase(), monthlyLimit]
    );
    res.status(201).json(toCard(rows[0]));
  },

  async updateLimits(req: Request, res: Response) {
    const { monthlyLimit } = req.body ?? {};
    if (typeof monthlyLimit !== 'number' || monthlyLimit < 0) {
      throw new AppError(400, 'Límite mensual no válido');
    }
    const { rows } = await pool.query(
      'UPDATE virtual_cards SET monthly_limit = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [monthlyLimit, req.params.id, res.locals.userId]
    );
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
};
