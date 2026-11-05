import { Account, SAVINGS_ANNUAL_RATE } from '../../../domain/entities/Account';
import type { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import type { CreateSavingsAccountDto } from '../../dtos/AccountDtos';

export class CreateSavingsAccountUseCase {
  constructor(private readonly accounts: IAccountRepository) {}

  async execute(dto: CreateSavingsAccountDto): Promise<Account> {
    return this.accounts.createSavings({
      userId: dto.userId,
      name: Account.normalizeSavingsName(dto.name),
      annualRate: SAVINGS_ANNUAL_RATE,
    });
  }
}
