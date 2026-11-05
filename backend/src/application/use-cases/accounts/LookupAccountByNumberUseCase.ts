import { AccountNumberNotFoundError } from '../../../domain/errors/DomainError';
import type { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { parseAccountNumber } from '../../../domain/value-objects/AccountNumber';
import type { AccountHolderInfo } from '../../dtos/AccountDtos';

/** Permite confirmar a quién pertenece una cuenta antes de transferirle. */
export class LookupAccountByNumberUseCase {
  constructor(
    private readonly accounts: IAccountRepository,
    private readonly users: IUserRepository
  ) {}

  async execute(rawAccountNumber: string): Promise<AccountHolderInfo> {
    const account = await this.accounts.findByNumber(parseAccountNumber(rawAccountNumber));
    if (!account) throw new AccountNumberNotFoundError();

    const holder = await this.users.findById(account.userId);
    return {
      accountNumber: account.accountNumber,
      accountType: account.type,
      holderName: holder?.publicName ?? 'Titular',
    };
  }
}
