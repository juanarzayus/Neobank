import type { Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { pool } from '../../infrastructure/database/PostgresPool';
import { AppError } from '../../infrastructure/middlewares/errorHandlerMiddleware';

/** Tasa efectiva anual de las cuentas de ahorro (4% EA). */
const SAVINGS_ANNUAL_RATE = 0.04;
const MAX_AMOUNT = 1_000_000_000;

const ALLOWED_CATEGORIES = new Set([
  'FOOD',
  'SHOPPING',
  'TRANSPORT',
  'UTILITIES',
  'ENTERTAINMENT',
  'HEALTH',
  'EDUCATION',
  'CASH',
  'TRANSFERS',
  'OTHER',
]);

let categoryColumnReady: Promise<void> | null = null;

/** Garantiza de forma idempotente que la columna category exista en account_transactions. */
export const ensureCategoryColumn = (): Promise<void> => {
  if (!categoryColumnReady) {
    categoryColumnReady = pool
      .query('ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT NULL')
      .then(() => undefined)
      .catch((err) => {
        categoryColumnReady = null;
        throw err;
      });
  }
  return categoryColumnReady;
};

export const parseCategory = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new AppError(400, 'Categoría no válida');
  const normalized = value.trim().toUpperCase();
  if (!ALLOWED_CATEGORIES.has(normalized)) throw new AppError(400, 'Categoría no válida');
  return normalized;
};

const toAccount = (row: any) => ({
  id: row.id,
  type: row.type,
  name: row.name,
  balance: Number(row.balance),
  annualRate: Number(row.annual_rate),
  lastInterestAt: row.last_interest_at,
  createdAt: row.created_at,
});

const toMovement = (row: any) => ({
  id: row.id,
  accountId: row.account_id,
  type: row.type,
  amount: Number(row.amount),
  balanceAfter: Number(row.balance_after),
  relatedAccountId: row.related_account_id,
  description: row.description,
  category: row.category ?? null,
  createdAt: row.created_at,
});

/** Valida un monto positivo con máximo 2 decimales. */
const parseAmount = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new AppError(400, 'El monto debe ser un número mayor a 0');
  }
  if (Math.abs(Math.round(value * 100) - value * 100) > 1e-6) {
    throw new AppError(400, 'El monto admite máximo 2 decimales');
  }
  if (value > MAX_AMOUNT) throw new AppError(400, 'Monto demasiado alto');
  return Math.round(value * 100) / 100;
};

/** Ejecuta fn dentro de una transacción SQL (COMMIT / ROLLBACK automático). */
async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Bloquea y devuelve las cuentas del usuario (orden por id => sin deadlocks). */
async function lockAccounts(client: PoolClient, userId: string, ids: string[]) {
  const { rows } = await client.query(
    'SELECT * FROM accounts WHERE user_id = $1 AND id = ANY($2::uuid[]) ORDER BY id FOR UPDATE',
    [userId, ids]
  );
  return rows;
}

const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const getOwnedAccount = async (client: PoolClient, userId: string, id: string) => {
  if (!isUuid(id)) throw new AppError(404, 'Cuenta no encontrada');
  const [account] = await lockAccounts(client, userId, [id]);
  if (!account) throw new AppError(404, 'Cuenta no encontrada');
  return account;
};

const recordMovement = (
  client: PoolClient,
  m: {
    accountId: string;
    type: string;
    amount: number;
    balanceAfter: number;
    relatedId?: string;
    description?: string;
    category?: string | null;
  }
) =>
  client.query(
    `INSERT INTO account_transactions (account_id, type, amount, balance_after, related_account_id, description, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [m.accountId, m.type, m.amount, m.balanceAfter, m.relatedId ?? null, m.description ?? null, m.category ?? null]
  );

export const AccountController = {
  /** Lista las cuentas del usuario; crea la cuenta corriente la primera vez. */
  async list(_req: Request, res: Response) {
    const userId = res.locals.userId;
    await pool.query(
      `INSERT INTO accounts (user_id, type, name) VALUES ($1, 'CHECKING', 'Cuenta principal')
       ON CONFLICT DO NOTHING`,
      [userId]
    );
    const { rows } = await pool.query(
      "SELECT * FROM accounts WHERE user_id = $1 ORDER BY (type = 'CHECKING') DESC, created_at",
      [userId]
    );
    res.json(rows.map(toAccount));
  },

  async createSavings(req: Request, res: Response) {
    const rawName = req.body?.name;
    const name = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : 'Cuenta de ahorros';
    if (name.length > 100) throw new AppError(400, 'El nombre es demasiado largo');

    const { rows } = await pool.query(
      `INSERT INTO accounts (user_id, type, name, annual_rate)
       VALUES ($1, 'SAVINGS', $2, $3) RETURNING *`,
      [res.locals.userId, name, SAVINGS_ANNUAL_RATE]
    );
    res.status(201).json(toAccount(rows[0]));
  },

  /** Depósito externo simulado: solo a la cuenta corriente. */
  async deposit(req: Request, res: Response) {
    await ensureCategoryColumn();
    const amount = parseAmount(req.body?.amount);
    const result = await withTransaction(async (client) => {
      const account = await getOwnedAccount(client, res.locals.userId, req.params.id);
      if (account.type !== 'CHECKING') {
        throw new AppError(400, 'Para fondear una cuenta de ahorros usa una transferencia');
      }
      const { rows } = await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2 RETURNING *',
        [amount, account.id]
      );
      await recordMovement(client, {
        accountId: account.id,
        type: 'DEPOSIT',
        amount,
        balanceAfter: Number(rows[0].balance),
        description: req.body?.description,
      });
      return rows[0];
    });
    res.json(toAccount(result));
  },

  /** Retiro externo simulado: solo de la cuenta corriente. */
  async withdraw(req: Request, res: Response) {
    await ensureCategoryColumn();
    const amount = parseAmount(req.body?.amount);
    const category = parseCategory(req.body?.category);
    const rawDesc = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    if (rawDesc.length > 200) throw new AppError(400, 'La descripción es demasiado larga');

    const result = await withTransaction(async (client) => {
      const account = await getOwnedAccount(client, res.locals.userId, req.params.id);
      if (account.type !== 'CHECKING') {
        throw new AppError(400, 'Para sacar dinero de ahorros transfiérelo primero a tu cuenta principal');
      }
      if (Number(account.balance) < amount) throw new AppError(400, 'Saldo insuficiente');
      const { rows } = await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2 RETURNING *',
        [amount, account.id]
      );
      await recordMovement(client, {
        accountId: account.id,
        type: 'WITHDRAWAL',
        amount,
        balanceAfter: Number(rows[0].balance),
        description: rawDesc || undefined,
        category,
      });
      return rows[0];
    });
    res.json(toAccount(result));
  },

  /** Transferencia entre cuentas propias (principal <-> ahorros, o ahorros <-> ahorros). */
  async transfer(req: Request, res: Response) {
    await ensureCategoryColumn();
    const { fromAccountId, toAccountId } = req.body ?? {};
    const amount = parseAmount(req.body?.amount);
    if (!isUuid(fromAccountId) || !isUuid(toAccountId)) throw new AppError(400, 'Cuentas no válidas');
    if (fromAccountId === toAccountId) throw new AppError(400, 'La cuenta origen y destino deben ser distintas');

    const accounts = await withTransaction(async (client) => {
      const locked = await lockAccounts(client, res.locals.userId, [fromAccountId, toAccountId]);
      const from = locked.find((a) => a.id === fromAccountId);
      const to = locked.find((a) => a.id === toAccountId);
      if (!from || !to) throw new AppError(404, 'Cuenta no encontrada');
      if (Number(from.balance) < amount) throw new AppError(400, 'Saldo insuficiente');

      const debited = await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2 RETURNING *', [amount, from.id]);
      const credited = await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 RETURNING *', [amount, to.id]);

      await recordMovement(client, {
        accountId: from.id, type: 'TRANSFER_OUT', amount,
        balanceAfter: Number(debited.rows[0].balance), relatedId: to.id, description: `Transferencia a ${to.name}`,
        category: 'TRANSFERS',
      });
      await recordMovement(client, {
        accountId: to.id, type: 'TRANSFER_IN', amount,
        balanceAfter: Number(credited.rows[0].balance), relatedId: from.id, description: `Transferencia desde ${from.name}`,
      });
      return { from: debited.rows[0], to: credited.rows[0] };
    });
    res.json({ from: toAccount(accounts.from), to: toAccount(accounts.to) });
  },

  /**
   * Acredita el interés mensual (tasa efectiva anual convertida a mensual).
   * Solo una vez por mes calendario por cuenta.
   */
  async creditInterest(req: Request, res: Response) {
    await ensureCategoryColumn();
    const result = await withTransaction(async (client) => {
      const account = await getOwnedAccount(client, res.locals.userId, req.params.id);
      if (account.type !== 'SAVINGS') throw new AppError(400, 'Solo las cuentas de ahorro generan intereses');

      const { rows: check } = await client.query(
        `SELECT ($1::timestamptz IS NOT NULL
                 AND date_trunc('month', $1::timestamptz) = date_trunc('month', NOW())) AS already`,
        [account.last_interest_at]
      );
      if (check[0].already) throw new AppError(409, 'Los intereses de este mes ya fueron acreditados');

      const { rows: calc } = await client.query(
        'SELECT ROUND($1::numeric * (POWER(1 + $2::numeric, 1.0 / 12) - 1), 2) AS interest',
        [account.balance, account.annual_rate]
      );
      const interest = Number(calc[0].interest);
      if (interest <= 0) throw new AppError(400, 'El saldo es muy bajo para generar intereses');

      const { rows } = await client.query(
        'UPDATE accounts SET balance = balance + $1, last_interest_at = NOW() WHERE id = $2 RETURNING *',
        [interest, account.id]
      );
      await recordMovement(client, {
        accountId: account.id,
        type: 'INTEREST',
        amount: interest,
        balanceAfter: Number(rows[0].balance),
        description: 'Intereses mensuales',
      });
      return { account: rows[0], interest };
    });
    res.json({ account: toAccount(result.account), interest: result.interest });
  },

  async movements(req: Request, res: Response) {
    await ensureCategoryColumn();
    if (!isUuid(req.params.id)) throw new AppError(404, 'Cuenta no encontrada');
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const { rows } = await pool.query(
      `SELECT t.* FROM account_transactions t
       JOIN accounts a ON a.id = t.account_id
       WHERE a.id = $1 AND a.user_id = $2
       ORDER BY t.created_at DESC LIMIT $3`,
      [req.params.id, res.locals.userId, limit]
    );
    res.json(rows.map(toMovement));
  },
};
