import type { DatabaseHealth, IHealthCheck } from '../../application/ports/IHealthCheck';
import type { Queryable } from './PostgresPool';

export class PostgresHealthCheck implements IHealthCheck {
  constructor(private readonly db: Queryable) {}

  async checkDatabase(): Promise<DatabaseHealth> {
    try {
      const { rows } = await this.db.query('SELECT NOW() AS now');
      return { ok: true, time: rows[0].now };
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : 'UNKNOWN';
      // Solo se registra el código del error; nunca credenciales.
      console.error('Database connection failed:', code);
      return { ok: false, code };
    }
  }
}
