import type { Account } from '../../../domain/entities/Account';
import { normalizeMovementDescription } from '../../../domain/entities/AccountMovement';
import { AccountNotFoundError } from '../../../domain/errors/DomainError';
import { Money } from '../../../domain/value-objects/Money';
import type { DepositDto } from '../../dtos/AccountDtos';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

/** Depósito externo simulado: solo a la cuenta corriente. */
export class DepositUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(dto: DepositDto): Promise<Account> {
    const amount = Money.positiveAmount(dto.amount);
    const description = normalizeMovementDescription(dto.description);

    return this.uow.run(async ({ accounts, movements }) => {
      const [account] = await accounts.findOwnedForUpdate(dto.userId, [dto.accountId]);
      if (!account) throw new AccountNotFoundError();

      account.ensureAcceptsExternalDeposit();
      account.deposit(amount);
      await accounts.save(account);

      await movements.record({
        accountId: account.id,
        type: 'DEPOSIT',
        amount,
        balanceAfter: account.balance,
        description,
      });
      return account;
    });
  }
}
