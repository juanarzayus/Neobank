import { AccountNotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { Money } from '../../../domain/value-objects/Money';
import type { TransferDto, TransferResult } from '../../dtos/AccountDtos';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

/** Transferencia entre cuentas propias (principal <-> ahorros, o ahorros <-> ahorros). */
export class TransferBetweenAccountsUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(dto: TransferDto): Promise<TransferResult> {
    const amount = Money.positiveAmount(dto.amount);
    if (dto.fromAccountId === dto.toAccountId) {
      throw new ValidationError('La cuenta origen y destino deben ser distintas');
    }

    return this.uow.run(async ({ accounts, movements }) => {
      const locked = await accounts.findOwnedForUpdate(dto.userId, [dto.fromAccountId, dto.toAccountId]);
      const from = locked.find((a) => a.id === dto.fromAccountId);
      const to = locked.find((a) => a.id === dto.toAccountId);
      if (!from || !to) throw new AccountNotFoundError();

      from.withdraw(amount);
      to.deposit(amount);
      await accounts.save(from);
      await accounts.save(to);

      await movements.record({
        accountId: from.id,
        type: 'TRANSFER_OUT',
        amount,
        balanceAfter: from.balance,
        relatedAccountId: to.id,
        description: `Transferencia a ${to.name}`,
        category: 'TRANSFERS',
      });
      await movements.record({
        accountId: to.id,
        type: 'TRANSFER_IN',
        amount,
        balanceAfter: to.balance,
        relatedAccountId: from.id,
        description: `Transferencia desde ${from.name}`,
      });

      return { from, to };
    });
  }
}
