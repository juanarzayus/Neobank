import { VirtualCard } from '../../../domain/entities/VirtualCard';
import { CardNotFoundError } from '../../../domain/errors/DomainError';
import { BusinessCalendar } from '../../../domain/value-objects/BusinessCalendar';
import type { UpdateStatusDto } from '../../dtos/UpdateLimitsDto';
import type { IClock } from '../../ports/IClock';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

export class UpdateCardStatusUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly clock: IClock
  ) {}

  async execute(dto: UpdateStatusDto): Promise<VirtualCard> {
    const status = VirtualCard.parseStatus(dto.status);

    return this.uow.run(async ({ cards, accounts, movements }) => {
      const card = await cards.findOwnedByIdForUpdate(dto.userId, dto.cardId);
      if (!card) throw new CardNotFoundError();

      card.rollSpendingPeriod(BusinessCalendar.spendingPeriod(this.clock.now()));
      card.changeStatus(status);

      if (status === 'CANCELLED' && card.prepaidBalance > 0) {
        const refunded = card.drainPrepaidBalance();
        const account = await accounts.findCheckingForUpdate(dto.userId);
        if (account && refunded > 0) {
          account.deposit(refunded);
          await accounts.save(account);
          await movements.record({
            accountId: account.id,
            type: 'TRANSFER_IN',
            amount: refunded,
            balanceAfter: account.balance,
            description: card.refundOnCloseDescription(),
            category: 'TRANSFERS',
          });
        }
      }

      await cards.save(card);
      return card;
    });
  }
}
