import type { Account } from '../../../domain/entities/Account';
import { normalizeMovementDescription } from '../../../domain/entities/AccountMovement';
import { AccountNotFoundError } from '../../../domain/errors/DomainError';
import { Money } from '../../../domain/value-objects/Money';
import { parseSpendingCategory } from '../../../domain/value-objects/SpendingCategory';
import type { WithdrawDto } from '../../dtos/AccountDtos';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

/** Retiro externo simulado: solo de la cuenta corriente. */
export class WithdrawUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(dto: WithdrawDto): Promise<Account> {
    const amount = Money.positiveAmount(dto.amount);
    const category = dto.category ? parseSpendingCategory(dto.category) : null;
    const description = normalizeMovementDescription(dto.description);

    return this.uow.run(async ({ accounts, movements }) => {
      const [account] = await accounts.findOwnedForUpdate(dto.userId, [dto.accountId]);
      if (!account) throw new AccountNotFoundError();

      account.ensureAllowsExternalWithdrawal();
      account.withdraw(amount);
      await accounts.save(account);

      await movements.record({
        accountId: account.id,
        type: 'WITHDRAWAL',
        amount,
        balanceAfter: account.balance,
        description,
        category,
      });
      return account;
    });
  }
}
