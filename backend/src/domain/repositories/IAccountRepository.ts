import type { Account, NewSavingsAccount } from '../entities/Account';

export interface IAccountRepository {
  /** Cuentas del usuario: primero la corriente, luego por fecha de creación. */
  findByUser(userId: string): Promise<Account[]>;
  /** Cualquier cuenta (de cualquier usuario) por su número. */
  findByNumber(accountNumber: string): Promise<Account | null>;
  /** Crea la cuenta corriente del usuario si todavía no existe (idempotente). */
  createCheckingIfMissing(userId: string): Promise<void>;
  createSavings(data: NewSavingsAccount): Promise<Account>;
  /**
   * Devuelve y bloquea (hasta el fin de la unidad de trabajo) las cuentas indicadas
   * que pertenecen al usuario. Los ids inexistentes o ajenos se omiten.
   */
  findOwnedForUpdate(userId: string, ids: string[]): Promise<Account[]>;
  /**
   * Devuelve y bloquea las cuentas indicadas sin importar su dueño
   * (transferencias a terceros). El caso de uso valida la propiedad del origen.
   */
  findByIdsForUpdate(ids: string[]): Promise<Account[]>;
  findCheckingForUpdate(userId: string): Promise<Account | null>;
  /** Persiste el saldo y la fecha del último interés. */
  save(account: Account): Promise<void>;
}
