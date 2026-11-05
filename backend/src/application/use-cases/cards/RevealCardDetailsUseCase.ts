import { CardNotFoundError } from '../../../domain/errors/DomainError';
import type { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import type { RevealedCardDetailsDto } from '../../dtos/UpdateLimitsDto';
import type { ICardTokenVault } from '../../ports/ICardTokenVault';

/**
 * Destokeniza bajo demanda el PAN completo y el CVV desde la bóveda criptográfica
 * únicamente para el titular autenticado de la tarjeta.
 */
export class RevealCardDetailsUseCase {
  constructor(
    private readonly cards: IVirtualCardRepository,
    private readonly vault: ICardTokenVault
  ) {}

  async execute(userId: string, cardId: string): Promise<RevealedCardDetailsDto> {
    const card = await this.cards.findOwnedById(userId, cardId);
    if (!card) throw new CardNotFoundError();

    const { cardNumber, cvv } = this.vault.detokenize(card.encryptedPan, card.encryptedCvv, card.last4);

    return {
      cardId: card.id,
      cardToken: card.cardToken,
      cardNumber,
      cvv,
      expirationDate: card.expirationDate,
      cardholderName: card.cardholderName,
    };
  }
}

