import type { Account } from '../../../domain/entities/Account';
import type { IAccountRepository } from '../../../domain/repositories/IAccountRepository';

/** Lista las cuentas del usuario; crea la cuenta corriente la primera vez. */
export class ListAccountsUseCase {
  constructor(private readonly accounts: IAccountRepository) {}

  async execute(userId: string): Promise<Account[]> {
    const existing = await this.accounts.findByUser(userId);
    if (existing.some((a) => a.isChecking)) return existing;

    await this.accounts.createCheckingIfMissing(userId);
    return this.accounts.findByUser(userId);
  }
}
