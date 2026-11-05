import type { Pool } from 'pg';
import type { IUnitOfWork, TransactionalRepositories } from '../../application/ports/IUnitOfWork';
import { PostgresAccountMovementRepository } from './repositories/PostgresAccountMovementRepository';
import { PostgresAccountRepository } from './repositories/PostgresAccountRepository';
import { PostgresCurrencyExchangeRepository } from './repositories/PostgresCurrencyExchangeRepository';
import { PostgresCurrencyWalletRepository } from './repositories/PostgresCurrencyWalletRepository';
import { PostgresVirtualCardRepository } from './repositories/PostgresVirtualCardRepository';

/** Unidad de trabajo sobre una transacción SQL: COMMIT si el trabajo termina, ROLLBACK si falla. */
export class PostgresUnitOfWork implements IUnitOfWork {
  constructor(private readonly pool: Pool) {}

  async run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work({
        accounts: new PostgresAccountRepository(client),
        movements: new PostgresAccountMovementRepository(client),
        cards: new PostgresVirtualCardRepository(client),
        currencyWallets: new PostgresCurrencyWalletRepository(client),
        currencyExchanges: new PostgresCurrencyExchangeRepository(client),
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
