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

    return this.uow.run(async ({ cards }) => {
      const card = await cards.findOwnedByIdForUpdate(dto.userId, dto.cardId);
      if (!card) throw new CardNotFoundError();

      card.rollSpendingPeriod(BusinessCalendar.spendingPeriod(this.clock.now()));
      card.changeStatus(status);
      await cards.save(card);
      return card;
    });
  }
}
