import { Router } from 'express';
import { pool } from '../../infrastructure/database/PostgresPool';

export const healthRoutes = Router();

healthRoutes.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Neobank backend funcionando' });
});

healthRoutes.get('/db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', database: 'connected', time: result.rows[0].now });
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : 'UNKNOWN';

    // Solo se registra el código del error; nunca credenciales.
    console.error('Database connection failed:', code);
    res.status(500).json({ status: 'error', database: 'disconnected', code });
  }
});
