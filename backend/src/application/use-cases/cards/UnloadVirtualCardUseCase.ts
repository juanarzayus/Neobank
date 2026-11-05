import { AccountNotFoundError, CardNotFoundError } from '../../../domain/errors/DomainError';
import { Money } from '../../../domain/value-objects/Money';
import type { CardFundingDto, CardFundingResult } from '../../dtos/UpdateLimitsDto';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

/**
 * Descarga (Unload) saldo prepago de una tarjeta para devolverlo a la cuenta principal (CHECKING).
 */
export class UnloadVirtualCardUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(dto: CardFundingDto): Promise<CardFundingResult> {
    const amount = Money.positiveAmount(dto.amount);

    return this.uow.run(async ({ cards, accounts, movements }) => {
      const card = await cards.findOwnedByIdForUpdate(dto.userId, dto.cardId);
      if (!card) throw new CardNotFoundError();

      const account = await accounts.findCheckingForUpdate(dto.userId);
      if (!account) throw new AccountNotFoundError();

      card.unload(amount);
      account.deposit(amount);

      await cards.save(card);
      await accounts.save(account);

      await movements.record({
        accountId: account.id,
        type: 'TRANSFER_IN',
        amount,
        balanceAfter: account.balance,
        description: card.unloadDescription(),
        category: 'TRANSFERS',
      });

      return { card, accountBalance: account.balance, amount };
    });
  }
}

