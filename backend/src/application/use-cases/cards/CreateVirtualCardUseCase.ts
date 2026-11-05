import { VirtualCard } from '../../../domain/entities/VirtualCard';
import type { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { BusinessCalendar } from '../../../domain/value-objects/BusinessCalendar';
import type { CreateCardDto } from '../../dtos/CreateCardDto';
import type { ICardDetailsGenerator } from '../../ports/ICardDetailsGenerator';
import type { IClock } from '../../ports/IClock';

export class CreateVirtualCardUseCase {
  constructor(
    private readonly cards: IVirtualCardRepository,
    private readonly generator: ICardDetailsGenerator,
    private readonly clock: IClock
  ) {}

  async execute(dto: CreateCardDto): Promise<VirtualCard> {
    const cardholderName = VirtualCard.normalizeCardholderName(dto.cardholderName);
    const rules = VirtualCard.createRules(dto);
    const now = this.clock.now();

    return this.cards.create({
      userId: dto.userId,
      cardholderName,
      rules,
      spendingPeriod: BusinessCalendar.spendingPeriod(now),
      ...this.generator.generate(now),
    });
  }
}
