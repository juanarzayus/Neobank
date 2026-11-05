import type { SpendingRulesInput, VirtualCard } from '../../../domain/entities/VirtualCard';
import { CardNotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { BusinessCalendar } from '../../../domain/value-objects/BusinessCalendar';
import type { UpdateLimitsDto } from '../../dtos/UpdateLimitsDto';
import type { IClock } from '../../ports/IClock';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

export class UpdateCardLimitsUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly clock: IClock
  ) {}

  async execute(dto: UpdateLimitsDto): Promise<VirtualCard> {
    const changes: Partial<SpendingRulesInput> = {};
    if (dto.monthlyLimit !== undefined) changes.monthlyLimit = dto.monthlyLimit;
    if (dto.dailyLimit !== undefined) changes.dailyLimit = dto.dailyLimit;
    if (dto.internationalAllowed !== undefined) changes.internationalAllowed = dto.internationalAllowed;
    if (dto.blockedCategories !== undefined) changes.blockedCategories = dto.blockedCategories;
    if (dto.autoDebitFromAccount !== undefined) changes.autoDebitFromAccount = dto.autoDebitFromAccount;

    if (Object.keys(changes).length === 0) {
      throw new ValidationError('No se proporcionaron campos para actualizar');
    }

    return this.uow.run(async ({ cards }) => {
      const card = await cards.findOwnedByIdForUpdate(dto.userId, dto.cardId);
      if (!card) throw new CardNotFoundError();

      card.rollSpendingPeriod(BusinessCalendar.spendingPeriod(this.clock.now()));
      card.updateRules(changes);
      await cards.save(card);
      return card;
    });
  }
}
