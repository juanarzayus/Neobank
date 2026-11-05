import { AccountNotFoundError, CardNotFoundError } from '../../../domain/errors/DomainError';
import { Money } from '../../../domain/value-objects/Money';
import type { CardFundingDto, CardFundingResult } from '../../dtos/UpdateLimitsDto';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

/**
 * Recarga (Top-Up) el saldo prepago de una tarjeta descontando de la cuenta principal (CHECKING).
 */
export class TopUpVirtualCardUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(dto: CardFundingDto): Promise<CardFundingResult> {
    const amount = Money.positiveAmount(dto.amount);

    return this.uow.run(async ({ cards, accounts, movements }) => {
      const card = await cards.findOwnedByIdForUpdate(dto.userId, dto.cardId);
      if (!card) throw new CardNotFoundError();

      const account = await accounts.findCheckingForUpdate(dto.userId);
      if (!account) throw new AccountNotFoundError();

      account.withdraw(amount);
      card.topUp(amount);

      await accounts.save(account);
      await cards.save(card);

      await movements.record({
        accountId: account.id,
        type: 'TRANSFER_OUT',
        amount,
        balanceAfter: account.balance,
        description: card.topUpDescription(),
        category: 'TRANSFERS',
      });

      return { card, accountBalance: account.balance, amount };
    });
  }
}

