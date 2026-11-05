import { AccountNotFoundError } from '../../../domain/errors/DomainError';
import type { CreditInterestResult } from '../../dtos/AccountDtos';
import type { IClock } from '../../ports/IClock';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

export class CreditMonthlyInterestUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly clock: IClock
  ) {}

  async execute(userId: string, accountId: string): Promise<CreditInterestResult> {
    return this.uow.run(async ({ accounts, movements }) => {
      const [account] = await accounts.findOwnedForUpdate(userId, [accountId]);
      if (!account) throw new AccountNotFoundError();

      const interest = account.creditMonthlyInterest(this.clock.now());
      await accounts.save(account);

      await movements.record({
        accountId: account.id,
        type: 'INTEREST',
        amount: interest,
        balanceAfter: account.balance,
        description: 'Intereses mensuales',
      });
      return { account, interest };
    });
  }
}
