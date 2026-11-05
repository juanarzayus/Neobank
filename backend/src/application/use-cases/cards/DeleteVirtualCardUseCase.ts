import { CardNotFoundError } from '../../../domain/errors/DomainError';
import type { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';

export class DeleteVirtualCardUseCase {
  constructor(private readonly cards: IVirtualCardRepository) {}

  async execute(userId: string, cardId: string): Promise<void> {
    if (!(await this.cards.delete(userId, cardId))) throw new CardNotFoundError();
  }
}
