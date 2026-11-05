import type { IAccountMovementRepository } from '../../domain/repositories/IAccountMovementRepository';
import type { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import type { ICurrencyExchangeRepository } from '../../domain/repositories/ICurrencyExchangeRepository';
import type { ICurrencyWalletRepository } from '../../domain/repositories/ICurrencyWalletRepository';
import type { IVirtualCardRepository } from '../../domain/repositories/IVirtualCardRepository';

/** Repositorios que comparten una misma transacción. */
export interface TransactionalRepositories {
  accounts: IAccountRepository;
  movements: IAccountMovementRepository;
  cards: IVirtualCardRepository;
  currencyWallets: ICurrencyWalletRepository;
  currencyExchanges: ICurrencyExchangeRepository;
}

/**
 * Ejecuta un trabajo de forma atómica: si la función termina, todo se confirma;
 * si lanza un error, todo se deshace.
 */
export interface IUnitOfWork {
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
