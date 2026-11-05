import type { VirtualCard } from '../../../domain/entities/VirtualCard';
import type { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { BusinessCalendar } from '../../../domain/value-objects/BusinessCalendar';
import type { IClock } from '../../ports/IClock';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

export class ListVirtualCardsUseCase {
  constructor(
    private readonly cards: IVirtualCardRepository,
    private readonly uow: IUnitOfWork,
    private readonly clock: IClock
  ) {}

  async execute(userId: string): Promise<VirtualCard[]> {
    const period = BusinessCalendar.spendingPeriod(this.clock.now());
    const cards = await this.cards.findByUser(userId);
    if (!cards.some((c) => c.spendingPeriod < period)) return cards;

    // Algún periodo venció: se reinicia con las filas bloqueadas para no pisar una compra en curso.
    return this.uow.run(async ({ cards: repo }) => {
      const locked = await repo.findByUserForUpdate(userId);
      for (const card of locked) {
        if (card.rollSpendingPeriod(period)) await repo.save(card);
      }
      return locked;
    });
  }
}
