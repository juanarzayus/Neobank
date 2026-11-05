import { CardNotFoundError } from '../../../domain/errors/DomainError';
import type { IUnitOfWork } from '../../ports/IUnitOfWork';

export class DeleteVirtualCardUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(userId: string, cardId: string): Promise<void> {
    await this.uow.run(async ({ cards, accounts, movements }) => {
      const card = await cards.findOwnedByIdForUpdate(userId, cardId);
      if (!card) throw new CardNotFoundError();

      if (card.prepaidBalance > 0) {
        const refunded = card.drainPrepaidBalance();
        const account = await accounts.findCheckingForUpdate(userId);
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

      if (!(await cards.delete(userId, cardId))) throw new CardNotFoundError();
    });
  }
}
